// backend/server.js
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');

const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   CONFIGURAÇÃO GEMINI
========================= */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];

/* =========================
   PROMPT DO CHATBOT
========================= */
const healthPrompt = `Você é "SUS Virtual", um assistente virtual especializado do Sistema Único de Saúde.
NUNCA dê diagnóstico médico. Em emergências: LIGUE 192 (SAMU).`;

/* =========================
   FALLBACKS
========================= */
const fallbackResponses = {
  emergencia: {
    title: "🚨 EMERGÊNCIA",
    content: "**LIGUE 192 (SAMU) IMEDIATAMENTE**"
  },
  padrao: {
    title: "🤖 SUS Virtual",
    content: "No momento não consegui responder. Procure uma UBS ou ligue 136."
  }
};

function detectIntent(message = "") {
  const m = message.toLowerCase();
  if (m.includes('dor no peito') || m.includes('falta de ar')) return 'emergencia';
  return 'padrao';
}

/* =========================
   ROTAS DA API
========================= */

// Teste
app.get('/api', (req, res) => {
  res.json({ status: 'API online', service: 'SUS Virtual' });
});

// Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Mensagem vazia' });
    }

    const intent = detectIntent(message);
    if (intent === 'emergencia') {
      return res.json({
        success: true,
        response: fallbackResponses.emergencia.content
      });
    }

    const fullPrompt = `${healthPrompt}\n\nPergunta do utente: "${message}"\nResposta:`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1200,
        topP: 0.9,
        topK: 40
      }
    });

    res.json({
      success: true,
      response: result.response.text()
    });

  } catch (error) {
    console.error('Erro:', error.message);
    res.json({
      success: true,
      response: fallbackResponses.padrao.content
    });
  }
});

/* =========================
   SERVIR FRONTEND (REACT)
========================= */

// Caminho correto do build
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* =========================
   START SERVER (RENDER)
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SUS Virtual online na porta ${PORT}`);
});
