// Endpoint chamado pelo navegador depois que o cartão (quando aplicável) já
// foi tokenizado no cliente. Cria um PEDIDO ÚNICO no Pagar.me — não é
// assinatura recorrente. O plano anual é vendido como uma compra só,
// parcelada no cartão pela própria operadora (installments), ou paga à
// vista no boleto/PIX. Não existe "plano" nem "ciclo" aqui: por decisão de
// escopo, renovação no ano seguinte fica para uma etapa futura.
//
// Preço e parcelas são decididos aqui no servidor, nunca vindos do
// navegador: assim ninguém consegue adulterar a requisição pra pagar menos
// ou escolher parcelas que não deveriam existir.

const { neon } = require('@neondatabase/serverless');
const { pagarme } = require('./_pagarme');

// DATABASE_URL é o nome que a integração Neon da Vercel injeta.
const sql = neon(process.env.DATABASE_URL);

// Em centavos, como o Pagar.me espera. Débito cobra o mesmo valor do
// boleto/PIX (também à vista), mas ainda não está implementado abaixo —
// ver aviso mais adiante.
const PRICING = {
    credit_card: 188400, // R$ 1.884,00 em 12x de R$ 157,00
    boleto: 179000,      // R$ 1.790,00 à vista
    pix: 179000          // R$ 1.790,00 à vista (mesmo preço do boleto)
};

// Monta o objeto `payment` de cada método — cada um tem um formato
// diferente dentro de `payments[]` no Pagar.me, por isso um builder por
// método em vez de uma única função genérica.
const PAYMENT_BUILDERS = {
    credit_card(card_token) {
        // card_token fica no mesmo nível de `card` dentro de credit_card,
        // não aninhado dentro dele.
        return { payment_method: 'credit_card', credit_card: { installments: 12, card_token } };
    },
    boleto() {
        // nosso_numero e document_number identificam o boleto de forma
        // única — a doc do Pagar.me exige os dois, mas não existe ainda
        // nenhum sistema de numeração sequencial próprio, então geramos a
        // partir do timestamp. Revisar se o banco/operadora usado tiver
        // uma exigência de formato diferente.
        const identificador = Date.now().toString().slice(-10);

        return {
            payment_method: 'boleto',
            boleto: {
                // Vencimento em 3 dias corridos — valor de partida
                // razoável, ajustar conforme a regra de negócio real.
                due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                instructions: 'go2apply - Plano Anual. Pagamento único, sem renovação automática.',
                nosso_numero: identificador,
                type: 'DM',
                document_number: identificador
            }
        };
    },
    pix() {
        return {
            payment_method: 'pix',
            // 30 minutos é um prazo comum pra QR code de PIX em checkout —
            // ajustar se a regra de negócio pedir outro valor.
            pix: { expires_in: 1800 }
        };
    }
};

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Método não permitido.' });
        return;
    }

    const { payment_method, card_token, customer } = request.body || {};
    const { name, email, document, phone, address } = customer || {};

    // TODO: cartão de débito fica de fora por enquanto. A doc do Pagar.me
    // exige um fluxo de autenticação 3DS (objeto `authentication` com
    // mpi/eci/cavv/transaction_id) só disponível para "clientes Gateway" —
    // isso é uma integração à parte, com SDK de desafio no navegador, não
    // um simples campo a mais no payload. Precisa de investigação própria
    // antes de implementar; não dá para adivinhar esse fluxo com segurança.
    if (!payment_method || !PAYMENT_BUILDERS[payment_method]) {
        response.status(400).json({ error: 'payment_method deve ser "credit_card", "boleto" ou "pix" (débito ainda não implementado).' });
        return;
    }

    if (!name || !email || !document) {
        response.status(400).json({ error: 'customer.name, customer.email e customer.document são obrigatórios.' });
        return;
    }

    if (payment_method === 'credit_card' && !card_token) {
        response.status(400).json({ error: 'card_token é obrigatório para pagamento em cartão de crédito.' });
        return;
    }

    // PIX exige telefone do cliente pra ter sucesso, segundo a doc do
    // Pagar.me — cartão e boleto funcionam sem isso (testado). Aceita só
    // dígitos (ex.: "11999998888") e separa DDD (2 primeiros dígitos) do
    // resto do número.
    let phones;
    if (payment_method === 'pix') {
        const digits = (phone || '').replace(/\D/g, '');
        if (digits.length < 10) {
            response.status(400).json({ error: 'customer.phone é obrigatório para pagamento em PIX (DDD + número, só dígitos).' });
            return;
        }
        phones = {
            mobile_phone: {
                country_code: '55',
                area_code: digits.slice(0, 2),
                number: digits.slice(2)
            }
        };
    }

    // Boleto exige endereço do cliente pra ter sucesso — testado direto
    // contra a API: sem isso, o Pagar.me responde "Customer address
    // required." Cartão e PIX funcionam sem endereço nenhum.
    if (payment_method === 'boleto') {
        const { line_1, zip_code, city, state } = address || {};
        if (!line_1 || !zip_code || !city || !state) {
            response.status(400).json({ error: 'customer.address (line_1, zip_code, city, state) é obrigatório para pagamento em boleto.' });
            return;
        }
    }

    const amount = PRICING[payment_method];
    const payment = PAYMENT_BUILDERS[payment_method](card_token);

    try {
        const order = await pagarme('/orders', {
            method: 'POST',
            body: JSON.stringify({
                items: [
                    {
                        amount,
                        description: 'go2apply - Plano Anual',
                        quantity: 1,
                        code: 'PLANO-ANUAL'
                    }
                ],
                customer: {
                    name,
                    email,
                    type: 'individual',
                    document,
                    document_type: 'CPF',
                    ...(phones ? { phones } : {}),
                    // País vem fixo: negócio é só Brasil, não precisa
                    // perguntar isso no formulário.
                    ...(payment_method === 'boleto' ? { address: { ...address, country: 'BR' } } : {})
                },
                payments: [payment]
            })
        });

        // Grava na tabela ponte — best effort, separado da chamada acima
        // de propósito: se o Pagar.me já criou o pedido com sucesso, uma
        // falha ao gravar no banco não deve virar erro pro cliente.
        //
        // access_until assume 1 ano a partir de agora mesmo quando o
        // status inicial é "pending" (boleto/PIX aguardando pagamento) —
        // otimista de propósito. Se o cliente nunca pagar, api/webhook.js
        // corrige isso depois (order.payment_failed/order.canceled
        // revogam o acesso via access_until = agora).
        try {
            const accessUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

            await sql`
                INSERT INTO customers (
                    email, full_name, document, purchase_type,
                    pagarme_customer_id, pagarme_order_id,
                    payment_method, status, access_until, updated_at
                ) VALUES (
                    ${email}, ${name}, ${document}, 'one_time',
                    ${order.customer?.id || null}, ${order.id},
                    ${payment_method}, ${order.status || 'pending'}, ${accessUntil}, now()
                )
                ON CONFLICT (email) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    document = EXCLUDED.document,
                    purchase_type = EXCLUDED.purchase_type,
                    pagarme_customer_id = EXCLUDED.pagarme_customer_id,
                    pagarme_order_id = EXCLUDED.pagarme_order_id,
                    payment_method = EXCLUDED.payment_method,
                    status = EXCLUDED.status,
                    access_until = EXCLUDED.access_until,
                    updated_at = now();
            `;
        } catch (dbError) {
            console.warn('Pedido criado no Pagar.me, mas não foi possível gravar na tabela customers:', dbError.message);
        }

        response.status(201).json(order);
    } catch (error) {
        console.error('Falha ao criar pedido:', error.status || '', error.body || error.message);
        response.status(error.status || 500).json({
            error: 'Não foi possível processar o pagamento.',
            details: error.body || null
        });
    }
};
