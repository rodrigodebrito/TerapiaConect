const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Rota de teste (sem autenticação)
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

// Analisar sessão
router.post('/analyze/:sessionId', aiController.analyzeSession);

// Gerar sugestões em tempo real
router.post('/suggest/:sessionId', aiController.generateSuggestions);

// Gerar relatório da sessão
router.post('/report/:sessionId', aiController.generateReport);

module.exports = router; 