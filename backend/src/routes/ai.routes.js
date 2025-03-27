const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Rotas públicas (sem autenticação)

// Rota de teste simples
router.get('/test', async (req, res) => {
    try {
        const openAIService = require('../services/ai/openai.service');
        const response = await openAIService.analyzeText("Olá, isso é um teste de integração.");
        res.json({ analysis: response });
    } catch (error) {
        console.error('Erro no teste:', error);
        res.status(500).json({
            message: 'Erro no teste de integração',
            details: error.message
        });
    }
});

// Verificar configuração da API OpenAI
router.get('/openai-check', async (req, res) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({
                configured: false,
                message: 'API OpenAI não configurada. A variável de ambiente OPENAI_API_KEY não está definida.'
            });
        }
        
        // Verificar se a chave começa com o formato correto
        const isValidFormat = apiKey.startsWith('sk-');
        
        res.json({
            configured: true,
            validFormat: isValidFormat,
            keyLength: apiKey.length,
            maskedKey: `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`
        });
    } catch (error) {
        console.error('Erro ao verificar API OpenAI:', error);
        res.status(500).json({
            configured: false,
            error: error.message
        });
    }
});

// Testar conexão com API OpenAI (se o método existir no controlador)
if (typeof aiController.checkOpenAI === 'function') {
    router.get('/openai-public-test', aiController.checkOpenAI);
}

// Middleware de autenticação para todas as rotas abaixo
router.use(authenticate);

// Adicionar transcrição
router.post(
  '/transcriptions',
  [
    body('sessionId').isString().notEmpty(),
    body('speaker').isString().notEmpty(),
    body('content').isString().notEmpty(),
    body('timestamp').isISO8601().optional()
  ],
  aiController.addTranscription
);

// Obter transcrições de uma sessão
router.get('/transcriptions/session/:sessionId', aiController.getSessionTranscripts);

// Rotas para serviços de IA (autenticadas)
// Verificar se as funções existem no controlador antes de criar as rotas
if (typeof aiController.saveTranscript === 'function') {
    router.post('/transcript', aiController.saveTranscript);
}

router.post('/analyze', aiController.analyzeSession);

if (typeof aiController.analyzeText === 'function') {
    router.post('/analyze-text', aiController.analyzeText);
}

router.post('/suggest', aiController.generateSuggestions);
router.post('/report', aiController.generateReport);

// Versões alternativas com parâmetros na URL
router.post('/analyze/:sessionId', aiController.analyzeSession);
router.post('/suggest/:sessionId', aiController.generateSuggestions);
router.post('/report/:sessionId', aiController.generateReport);

// Teste autenticado da API OpenAI (se o método existir no controlador)
if (typeof aiController.checkOpenAI === 'function') {
    router.get('/openai-test', aiController.checkOpenAI);
}

module.exports = router; 