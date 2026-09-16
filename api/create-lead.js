const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let isInitialized = false;
let initError = null;

function initFirebase() {
  if (isInitialized) return;
  
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("A variável FIREBASE_SERVICE_ACCOUNT não foi encontrada.");
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    isInitialized = true;
  } catch (error) {
    initError = error.message;
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

module.exports = async function handler(req, res) {
  // Configurações de CORS para aceitar requisições
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  initFirebase();

  if (initError) {
    return res.status(500).json({ error: 'Erro de configuração no servidor: ' + initError });
  }

  const db = getFirestore();

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
