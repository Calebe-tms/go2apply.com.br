// Endpoint chamado pelo auth-drawer (nome, e-mail e WhatsApp) ao clicar em
// "Continuar para o pagamento". Grava o lead no Firestore (projeto
// crm-equalizagro, usado como CRM) — não existe login em lugar nenhum.
//
// Valida formato de e-mail e WhatsApp aqui também (não só no navegador),
// já que a chamada pode ser feita direto contra a API sem passar pelo
// formulário.

const { firestore } = require('./_firebase');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_BR_REGEX = /^\(\d{2}\)\s9?\d{4}-\d{4}$/;

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Método não permitido.' });
        return;
    }

    const { fullName, email, phone, terms } = request.body || {};

    if (!fullName || !email || !phone) {
        response.status(400).json({ error: 'fullName, email e phone são obrigatórios.' });
        return;
    }

    if (!terms) {
        response.status(400).json({ error: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.' });
        return;
    }

    if (!EMAIL_REGEX.test(email)) {
        response.status(400).json({ error: 'E-mail inválido.' });
        return;
    }

    if (!PHONE_BR_REGEX.test(phone)) {
        response.status(400).json({ error: 'WhatsApp inválido. Use o formato (11) 99999-9999.' });
        return;
    }

    try {
        const docRef = await firestore.collection('leads').add({
            nomeCompleto: fullName,
            email,
            whatsapp: phone,
            origem: 'auth-drawer',
            termosAceitosEm: new Date().toISOString(),
            criadoEm: new Date().toISOString()
        });

        response.status(201).json({ id: docRef.id });
    } catch (error) {
        console.error('Falha ao gravar lead no Firestore:', error);
        response.status(500).json({ error: 'Não foi possível concluir o cadastro.' });
    }
};
