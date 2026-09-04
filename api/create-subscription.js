// Endpoint chamado pelo navegador quando o cliente escolhe "Assinatura
// anual" em vez de pagamento único. Cria uma ASSINATURA de verdade no
// Pagar.me (/subscriptions) — o Pagar.me cobra sozinho, automaticamente,
// a cada aniversário, sem o cliente precisar voltar ao checkout.
//
// Diferença central para o pedido único (create-order.js): assinatura não
// parcela (o valor sempre é cobrado cheio por ciclo), e não aceita PIX —
// só cartão de crédito ou boleto.

const { neon } = require('@neondatabase/serverless');
const { pagarme } = require('./_pagarme');

// @neondatabase/serverless não exporta um `sql` pronto — precisa criar a
// função passando a connection string. DATABASE_URL é o nome que a
// integração Neon da Vercel injeta (junto com POSTGRES_URL, mantido só
// por compatibilidade com o pacote antigo que não usamos mais).
const sql = neon(process.env.DATABASE_URL);

// O plano (com o preço já embutido) é criado uma vez, fora do código, via
// curl — ver instruções passadas fora deste arquivo. O id fica fixo aqui
// no servidor, nunca vindo do navegador, pelo mesmo motivo do amount em
// create-order.js: ninguém deve conseguir adulterar a requisição.
const ALLOWED_PAYMENT_METHODS = ['credit_card', 'boleto'];

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Método não permitido.' });
        return;
    }

    const { payment_method, card_token, customer } = request.body || {};
    const { name, email, document } = customer || {};

    if (!payment_method || !ALLOWED_PAYMENT_METHODS.includes(payment_method)) {
        response.status(400).json({ error: 'payment_method deve ser "credit_card" ou "boleto" (PIX não existe em assinatura recorrente).' });
        return;
    }

    if (!name || !email || !document) {
        response.status(400).json({ error: 'customer.name, customer.email e customer.document são obrigatórios.' });
        return;
    }

    if (payment_method === 'credit_card' && !card_token) {
        response.status(400).json({ error: 'card_token é obrigatório para assinatura no cartão de crédito.' });
        return;
    }

    const planId = process.env.PAGARME_PLAN_ID;
    if (!planId) {
        response.status(500).json({ error: 'PAGARME_PLAN_ID não configurado nas variáveis de ambiente da Vercel.' });
        return;
    }

    // card_token fica no NÍVEL RAIZ da assinatura — testado direto contra
    // a API: a doc sugeria `card: { card_token }` (aninhado), mas isso é
    // rejeitado com "the card number is required". Diferente do pedido
    // único, onde card_token fica dentro de `credit_card`.
    //
    // Boleto não precisa de objeto extra nenhum — segundo a doc do
    // Pagar.me, diferente do pedido único, o endereço aqui é opcional
    // (não testado ainda contra a API de verdade; se a assinatura em
    // boleto falhar pedindo endereço, é o primeiro lugar a olhar).
    const paymentFields = payment_method === 'credit_card'
        ? { card_token }
        : {};

    let subscription;
    try {
        subscription = await pagarme('/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                plan_id: planId,
                payment_method,
                ...paymentFields,
                customer: {
                    name,
                    email,
                    type: 'individual',
                    document,
                    document_type: 'CPF'
                }
            })
        });
    } catch (error) {
        console.error('Falha ao criar assinatura no Pagar.me:', error.status || '', error.body || error.message);
        response.status(error.status || 500).json({
            error: 'Não foi possível criar a assinatura.',
            details: error.body || null
        });
        return;
    }

    // Grava na tabela ponte — best effort, separado da chamada acima de
    // propósito: se o Pagar.me já criou a assinatura com sucesso, uma
    // falha ao gravar no banco não deve virar erro pro cliente.
    //
    // `current_cycle` vem nulo na criação (confirmado testando direto: só
    // existe depois que o primeiro ciclo real começa). `start_at` é o
    // campo certo aqui — é a data em que o trial termina e a primeira
    // cobrança acontece, exatamente o que access_until precisa representar
    // enquanto a assinatura está em "future" (trial). Quando o webhook for
    // reconstruído, cada renovação deve atualizar access_until de novo com
    // a data do próximo ciclo.
    try {
        const accessUntil = subscription.start_at
            || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

        await sql`
            INSERT INTO customers (
                email, full_name, document, purchase_type,
                pagarme_customer_id, pagarme_subscription_id, plan_id,
                payment_method, status, access_until, updated_at
            ) VALUES (
                ${email}, ${name}, ${document}, 'subscription',
                ${subscription.customer?.id || null}, ${subscription.id}, ${planId},
                ${payment_method}, ${subscription.status || 'future'}, ${accessUntil}, now()
            )
            ON CONFLICT (email) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                document = EXCLUDED.document,
                purchase_type = EXCLUDED.purchase_type,
                pagarme_customer_id = EXCLUDED.pagarme_customer_id,
                pagarme_subscription_id = EXCLUDED.pagarme_subscription_id,
                plan_id = EXCLUDED.plan_id,
                payment_method = EXCLUDED.payment_method,
                status = EXCLUDED.status,
                access_until = EXCLUDED.access_until,
                updated_at = now();
        `;
    } catch (dbError) {
        console.warn('Assinatura criada no Pagar.me, mas não foi possível gravar na tabela customers:', dbError.message);
    }

    response.status(201).json(subscription);
};
