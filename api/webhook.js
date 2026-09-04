// Recebe os eventos que o Pagar.me envia (postback) quando o status de um
// pedido ou de uma assinatura muda: boleto/PIX foi pago, trial virou
// cobrança, cartão foi recusado, assinatura foi cancelada etc. É isso que
// mantém a tabela `customers` atualizada sem a LP precisar ficar
// consultando o Pagar.me toda hora.
//
// TODO (segurança): a documentação do Pagar.me não descreve publicamente
// como verificar a autenticidade do postback (assinatura HMAC, header
// específico etc.) — só existe, na criação da chave de API, um checkbox
// "usar esta chave para assinar postbacks". Por enquanto este endpoint
// aceita qualquer POST que chegar. Antes de ir para produção de verdade,
// confirmar com o suporte do Pagar.me qual é o mecanismo de verificação e
// implementá-lo aqui — sem isso, alguém poderia forjar um evento de
// "pagamento confirmado" sem ter pagado nada.
//
// Nenhum evento aqui foi testado com um webhook real do Pagar.me ainda —
// só dá pra simular chamando a nossa própria API (o que fizemos para
// orders/subscriptions), não dá pra simular o Pagar.me nos chamando. Os
// nomes de campo vêm da documentação (eventos-de-webhook-1, faturas-1);
// no primeiro evento real, o `console.log` abaixo mostra o payload
// completo — confira ali se algo não bater.

const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// `subscription.created` não está aqui de propósito: create-subscription.js
// já grava a linha na criação, de forma síncrona — tratar esse evento aqui
// de novo seria redundante. O webhook cuida do que acontece DEPOIS da
// criação: pedido pago, trial virando cobrança, falha, cancelamento.
const EVENT_HANDLERS = {
    // --- Pagamento único (/orders) ---
    'order.paid': { purchaseType: 'one_time', status: 'paid' },
    // Pagamento nunca aconteceu (boleto/PIX que expirou ou cartão
    // recusado numa tentativa tardia) — revoga o acesso que tinha sido
    // concedido de forma otimista na criação do pedido.
    'order.payment_failed': { purchaseType: 'one_time', status: 'failed', revokeAccess: true },
    'order.canceled': { purchaseType: 'one_time', status: 'failed', revokeAccess: true },

    // --- Assinatura anual (/subscriptions) ---
    // Cada fatura paga é um ciclo cobrado com sucesso — o primeiro depois
    // do trial, ou uma renovação anual. Estende o acesso até o fim do
    // novo ciclo.
    'invoice.paid': { purchaseType: 'subscription', status: 'active', extendAccess: true },
    // Cobrança falhou (cartão recusado, boleto não pago no vencimento).
    // Não revoga o acesso na hora — a pessoa mantém acesso até a data já
    // registrada em access_until, funcionando como um período de
    // carência natural.
    'invoice.payment_failed': { purchaseType: 'subscription', status: 'past_due' },
    // Cancelamento para de renovar no futuro, mas não corta o acesso do
    // ciclo já pago — mesma lógica de não mexer em access_until.
    'subscription.canceled': { purchaseType: 'subscription', status: 'canceled' }
};

// Extrai o id que identifica a linha certa em `customers`, dependendo do
// tipo de evento — cada família de evento aninha isso de um jeito
// diferente no Pagar.me.
function extractPagarmeId(type, data) {
    if (type.startsWith('order.')) return data?.id || null;
    if (type === 'subscription.canceled') return data?.id || null;
    if (type.startsWith('invoice.')) return data?.subscription?.id || null;
    return null;
}

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Método não permitido.' });
        return;
    }

    const { type, data } = request.body || {};

    // Loga o payload inteiro sempre: é o que vai permitir confirmar, no
    // primeiro evento real, se os campos abaixo batem com o formato de
    // verdade que o Pagar.me envia.
    console.log('Webhook Pagar.me recebido:', type, JSON.stringify(data));

    const config = EVENT_HANDLERS[type];
    if (!config) {
        // Evento que não precisamos tratar (ex.: order.created,
        // customer.created). Não é erro — só não altera nada na tabela.
        response.status(200).json({ received: true, handled: false });
        return;
    }

    // `customer.email` é consistente nos três tipos de objeto (pedido,
    // assinatura, fatura) — confirmado na documentação de cada um.
    const email = data?.customer?.email || null;
    const pagarmeId = extractPagarmeId(type, data);

    if (!email && !pagarmeId) {
        // Não conseguimos identificar de quem é o evento — melhor logar e
        // seguir do que quebrar o webhook (o Pagar.me reenvia em caso de
        // erro, e um 500 aqui geraria retentativas inúteis).
        console.warn('Webhook sem e-mail nem id identificável, ignorado:', type);
        response.status(200).json({ received: true, handled: false });
        return;
    }

    // access_until só muda em dois casos: estende (assinatura renovou) ou
    // revoga (pagamento único que nunca foi pago). Nos demais eventos,
    // fica como já estava — é isso que dá o período de carência natural
    // em past_due/canceled.
    let accessUntil = null;
    if (config.revokeAccess) {
        accessUntil = new Date().toISOString();
    } else if (config.extendAccess) {
        // TODO: `period.end_at` é uma suposição sobre o formato de
        // resposta do Pagar.me para o objeto de fatura (invoice), não
        // confirmada com um exemplo completo na documentação. No
        // primeiro evento real, confira no log acima se o campo é esse
        // mesmo antes de confiar nessa data.
        accessUntil = data?.period?.end_at
            || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    try {
        // COALESCE mantém o valor atual de access_until quando accessUntil
        // é null (os casos "não mexe" da tabela EVENT_HANDLERS) — evita
        // repetir a query com/sem essa coluna pra cada combinação.
        if (email) {
            await sql`
                UPDATE customers
                SET status = ${config.status}, access_until = COALESCE(${accessUntil}, access_until), updated_at = now()
                WHERE email = ${email};
            `;
        } else if (config.purchaseType === 'one_time') {
            await sql`
                UPDATE customers
                SET status = ${config.status}, access_until = COALESCE(${accessUntil}, access_until), updated_at = now()
                WHERE pagarme_order_id = ${pagarmeId};
            `;
        } else {
            await sql`
                UPDATE customers
                SET status = ${config.status}, access_until = COALESCE(${accessUntil}, access_until), updated_at = now()
                WHERE pagarme_subscription_id = ${pagarmeId};
            `;
        }

        response.status(200).json({ received: true, handled: true });
    } catch (error) {
        console.error('Falha ao processar webhook:', error.message);
        // Mesmo em erro, responde 200: um 500 faria o Pagar.me reenviar o
        // mesmo evento repetidamente. O log acima já registrou a falha
        // para investigação manual.
        response.status(200).json({ received: true, handled: false, error: true });
    }
};
