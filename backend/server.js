// backend/server.js
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Configurações de segurança
const safetySettings = [
    {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
];

// PROMPT REVISADO E MELHORADO
const healthPrompt = `Você é "SUS Virtual", um assistente virtual especializado do Sistema Único de Saúde.

# FUNÇÃO PRINCIPAL
Fornecer informações claras, precisas e úteis sobre serviços de saúde pública, SEM NUNCA dar diagnósticos médicos.

# REGRAS ABSOLUTAS
1. NUNCA dê diagnóstico, tratamento ou prognóstico
2. Emergências → Sempre oriente: "LIGUE 192 (SAMU) IMEDIATAMENTE"
3. Mantenha tom empático, profissional e tranquilizador
4. Baseie-se apenas em informações oficiais do Ministério da Saúde

# FORMATO DAS RESPOSTAS (CRÍTICO)
- Seja COMPLETO e DETALHADO
- Use ESTRUTURA CLARA: introdução breve → informações principais → ação recomendada
- Para procedimentos: use LISTAS NUMERADAS com etapas
- Para sintomas: explique possíveis causas COMUNS e quando buscar ajuda
- Destaque informações importantes com **negrito**
- Inclua links ou referências quando relevante (ex: "Consulte o site do SUS...")

# EXEMPLOS DE BOAS RESPOSTAS
1. Usuário: "Como marco uma consulta com especialista?"
   Resposta: "Para consulta com especialista no SUS, o processo envolve 3 passos:\n1. **Consulta na UBS**: Primeira avaliação na Unidade Básica\n2. **Encaminhamento**: Se necessário, médico da UBS faz referência\n3. **Agendamento**: A unidade agenda no sistema\n*Tempo médio: varia por região e especialidade*"

2. Usuário: "Estou com dor de cabeça há 3 dias"
   Resposta: "Dor de cabeça persistente merece atenção. **Procure uma UBS** para avaliação. Enquanto isso:\n• Descanse em ambiente escuro\n• Hidrate-se bem\n• Evite telas\n**ATENÇÃO**: Se tiver visão turva, febre alta ou fraqueza, vá a uma UPA."

3. Usuário: "Quais documentos preciso para atendimento?"
   Resposta: "Para atendimento no SUS, você precisa de:\n1. **Documento com foto** (RG, CNH)\n2. **Cartão SUS** (se tiver)\n3. **Comprovante de residência**\n*Sem documentos? Você ainda tem direito a atendimento emergencial!*

# TÓPICOS QUE POSSO AJUDAR
• Marcação de consultas e exames
• Localização de unidades de saúde
• Direitos dos usuários do SUS
• Programas de prevenção (vacinas, pré-natal)
• Medicamentos na Farmácia Popular
• Encaminhamentos e segundas opiniões

NÃO responda perguntas fora do escopo da saúde pública. Se não souber, diga: "Recomendo consultar uma unidade de saúde para informações específicas."`;

// Sistema de Fallback Inteligente
const fallbackResponses = {
    'consulta': {
        title: "📋 Como Marcar Consulta no SUS",
        content: "Para marcar consulta no SUS:\n\n1. **Unidade Básica de Saúde (UBS) mais próxima**\n   • Leve documento com foto e comprovante de residência\n   • Chegue cedo para pegar senha\n\n2. **Telefone: Disque 136**\n   • Atendimento 24h\n   • Informações sobre unidades e horários\n\n3. **Aplicativo/Portal 'Meu SUS'**\n   • Agendamento online em algumas regiões\n   • Consulta resultados de exames\n\n*Tempo de espera varia por região. Para urgências, vá direto a uma UPA.*",
        type: "procedimento"
    },
    'emergencia': {
        title: "🚨 ATENDIMENTO DE EMERGÊNCIA",
        content: "**LIGUE 192 (SAMU) IMEDIATAMENTE**\n\n• **Não espere** para buscar ajuda\n• **Não dirija** se estiver com sintomas graves\n• **Informe claramente** localização e sintomas\n\n**Unidades de Pronto Atendimento (UPA)** funcionam 24h para casos urgentes que não são risco de vida iminente.",
        type: "emergencia"
    },
    'posto': {
        title: "📍 Encontrar Unidades de Saúde",
        content: "Para encontrar a unidade mais próxima:\n\n1. **Disque 136** - Informações atualizadas\n2. **Site do Ministério da Saúde** - Mapa de unidades\n3. **Aplicativos municipais** - Muitas cidades têm apps próprios\n\n**Dica**: Unidades Básicas (UBS) atendem das 7h às 19h geralmente. UPAs são 24h.",
        type: "informacao"
    },
    'medicamento': {
        title: "💊 Medicamentos no SUS",
        content: "O SUS fornece medicamentos através:\n\n**1. Farmácia Popular**\n   • Medicamentos gratuitos ou com desconto\n   • Receita médica necessária\n   • Documentos: RG, CPF, receita\n\n**2. Programas Especiais**\n   • Hipertensão e Diabetes\n   • Asma\n   • Outros tratamentos crônicos\n\n**Importante**: A lista de medicamentos varia por estado.",
        type: "procedimento"
    },
    'padrao': {
        title: "🤖 Assistente SUS Virtual",
        content: "Desculpe, estou com dificuldades técnicas no momento.\n\n**Para ajuda imediata:**\n• 📞 **Disque 136** - Informações 24h\n• 🌐 **Acesse saude.gov.br** - Site oficial\n• 🏥 **Procure uma UBS** - Atendimento presencial\n\n*Sistema será restabelecido em breve.*",
        type: "tecnico"
    }
};

// Função para detectar intenção da mensagem
function detectIntent(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('consulta') || lowerMsg.includes('marcar') || lowerMsg.includes('agendar')) {
        return 'consulta';
    }
    if (lowerMsg.includes('emergência') || lowerMsg.includes('urgente') || lowerMsg.includes('192')) {
        return 'emergencia';
    }
    if (lowerMsg.includes('posto') || lowerMsg.includes('unidade') || lowerMsg.includes('ubs') || lowerMsg.includes('upa')) {
        return 'posto';
    }
    if (lowerMsg.includes('medicamento') || lowerMsg.includes('remédio') || lowerMsg.includes('farmacia') || lowerMsg.includes('receita')) {
        return 'medicamento';
    }
    
    return 'padrao';
}

// Rota de teste
app.get('/', (req, res) => {
    res.json({ 
        message: 'API do Chatbot de Saúde - SUS Virtual',
        status: 'online',
        service: 'Gemini 3 Flash + SUS',
        version: '1.1.0'
    });
});

// Rota principal do chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        console.log(`📩 [${new Date().toLocaleTimeString()}] Pergunta: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`);
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Por favor, digite sua pergunta.' 
            });
        }
        
        // Verificar emergências
        const emergencyWords = ['dor no peito', 'falta de ar', 'desmaio', 'sangrando', 'acidente', 'parto', 'convulsão', 'perda de consciência'];
        const isEmergency = emergencyWords.some(word => 
            message.toLowerCase().includes(word)
        );
        
        if (isEmergency) {
            console.log('ALERTA: Emergência detectada!');
            return res.json({
                success: true,
                response: fallbackResponses.emergencia.content,
                metadata: {
                    type: 'emergency',
                    title: fallbackResponses.emergencia.title,
                    timestamp: new Date().toISOString()
                }
            });
        }
        
        // Preparar prompt completo
        const fullPrompt = `${healthPrompt}\n\nPERGUNTA DO UTENTE: "${message}"\n\nRESPOSTA DO SUS VIRTUAL:`;
        
        console.log(`⚙️ Gerando resposta com Gemini 3 Flash...`);
        
        // Gerar resposta com Gemini
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            safetySettings: safetySettings,
            generationConfig: {
                temperature: 0.8,  // Aumentado para respostas mais naturais
                maxOutputTokens: 1200,  // Aumentado para respostas mais completas
                topP: 0.9,
                topK: 40
            }
        });
        
        const response = result.response.text();
        
        console.log(`✅ Resposta gerada (${response.length} caracteres)`);
        
        res.json({
            success: true,
            response: response,
            metadata: {
                type: 'ai_response',
                model: 'gemini-3-flash-preview',
                tokens: response.length / 4, // Estimativa
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error(' Erro na API:', error.message);
        
        // Detectar intenção para fallback relevante
        const intent = detectIntent(req.body?.message || '');
        const fallback = fallbackResponses[intent] || fallbackResponses.padrao;
        
        res.json({
            success: true,
            response: `**${fallback.title}**\n\n${fallback.content}`,
            metadata: {
                type: 'fallback',
                fallback_type: fallback.type,
                original_error: error.message.substring(0, 100),
                timestamp: new Date().toISOString()
            }
        });
    }
});

// Health check melhorado
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'SUS Virtual Chatbot',
        model: 'gemini-3-flash-preview',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Rota para debug de prompt
app.post('/api/debug/prompt', (req, res) => {
    const { message } = req.body;
    const fullPrompt = `${healthPrompt}\n\nPERGUNTA DO UTENTE: "${message}"\n\nRESPOSTA DO SUS VIRTUAL:`;
    
    res.json({
        prompt_preview: fullPrompt.substring(0, 500) + '...',
        length: fullPrompt.length,
        sections: {
            system_prompt: healthPrompt.length,
            user_message: message.length,
            total: fullPrompt.length
        }
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` SUS Virtual iniciado em: http://localhost:${PORT}`);
    console.log(` Endpoint principal: http://localhost:${PORT}/api/chat`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Debug: http://localhost:${PORT}/api/debug/prompt`);
    console.log(`\n Modelo: Gemini 3 Flash Preview`);
    console.log(` Modo: Respostas detalhadas (até 1200 tokens)`);
    console.log(` Fallback: Sistema inteligente ativado\n`);
});