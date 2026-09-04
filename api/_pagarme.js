// Helper compartilhado pelos endpoints que falam com o Pagar.me.
//
// O prefixo "_" no nome do arquivo é intencional: dentro de /api, a Vercel
// transforma cada arquivo em uma rota pública automaticamente. Um arquivo
// começando com "_" fica de fora desse mapeamento — ele existe só para ser
// importado por outros arquivos da pasta, não para ser chamado direto.

const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

/**
 * Faz uma chamada autenticada ao Pagar.me usando a chave SECRETA.
 *
 * A autenticação é HTTP Basic com a secret key como usuário e senha vazia,
 * exatamente como a documentação do Pagar.me especifica — não é um Bearer
 * token nem uma chave em header customizado.
 *
 * A chave nunca aparece no código: vem de `process.env`, ou seja, só existe
 * dentro da Vercel (variável de ambiente), nunca no repositório nem no
 * navegador do cliente.
 */
async function pagarme(path, options = {}) {
    const secretKey = process.env.PAGARME_SECRET_KEY;
    if (!secretKey) {
        // Falha alto e claro: preferível a uma chamada silenciosa que
        // devolveria 401 do Pagar.me sem explicar o motivo real.
        throw new Error('PAGARME_SECRET_KEY não configurada nas variáveis de ambiente da Vercel.');
    }

    // Basic Auth manual: "usuário:senha" em base64, com senha vazia.
    const authHeader = 'Basic ' + Buffer.from(`${secretKey}:`).toString('base64');

    const response = await fetch(`${PAGARME_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
            ...options.headers
        }
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        // Repassa o corpo do erro do Pagar.me em vez de mascarar: é o que
        // diz exatamente qual campo veio errado (ex.: token expirado,
        // CPF inválido).
        const error = new Error(`Pagar.me respondeu ${response.status} em ${path}`);
        error.status = response.status;
        error.body = data;
        throw error;
    }

    return data;
}

module.exports = { pagarme, PAGARME_BASE_URL };
