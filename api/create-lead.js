const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa o Firebase Admin de forma segura (Modular API - compatível com V12+)
if (!getApps().length) {
  try {
    const serviceAccount = require('./firebase-key.json');
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

const db = getFirestore();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { fullName, email, phone, interest, role, region, cpf } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'Faltam campos obrigatórios' });
    }

    const docRef = db.collection('equalizagro').doc('regua-v5');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Documento não encontrado no Firebase' });
    }

    const data = docSnap.data();
    const payloadStr = data.payload || "{}";
    const payloadObj = JSON.parse(payloadStr);

    // Gerador de ID curto padrão do CRM (ex: "ldc3i30b")
    const generateId = () => "ld" + Math.random().toString(36).substring(2, 8);
    const hoje = new Date().toISOString().split('T')[0];

    const novoLead = {
      id: generateId(),
      nome: fullName || "",
      tipo: role || "",
      regiaoId: region || "sul", // Default
      unidadeId: "u1", // Default matriz
      hectaresEstimados: 0,
      culturas: "",
      contatoNome: "",
      fone: phone || "",
      email: email || "",
      origem: "Site (go2apply)",
      consultorId: null,
      estagio: "Contato iniciado",
      valorPotencial: 0,
      moeda: "BRL",
      probabilidade: 25,
      dataPrevista: null,
      dataFechamento: null,
      responsavelId: null,
      criadoEm: hoje,
      motivoPerda: null,
      clienteConvertidoId: null,
      interesse: interest || "go2apply",
      obs: cpf ? `CPF: ${cpf}` : "",
      linkId: null
    };

    if (!payloadObj.leads) {
      payloadObj.leads = [];
    }
    payloadObj.leads.push(novoLead);

    const novoPayloadStr = JSON.stringify(payloadObj);

    await docRef.update({
      payload: novoPayloadStr,
      atualizadoEm: new Date().toISOString()
    });

    return res.status(200).json({ success: true, leadId: novoLead.id });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Erro interno no servidor: ' + error.message });
  }
}
