// Helper compartilhado pelos endpoints que falam com o Firebase (Admin SDK).
//
// Mesmo padrão do antigo api/_pagarme.js: prefixo "_" pra não virar rota
// pública na Vercel, só é importado por outros arquivos de /api.

const admin = require('firebase-admin');

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // A Vercel guarda a chave privada com "\n" literal (string), precisa
    // virar quebra de linha de verdade antes de passar pro SDK.
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        // Falha alto e claro, igual ao _pagarme.js: preferível a um erro
        // confuso vindo de dentro do SDK do Firebase.
        throw new Error('Variáveis de ambiente do Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não configuradas.');
    }

    admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
}

module.exports = {
    firestore: admin.firestore()
};
