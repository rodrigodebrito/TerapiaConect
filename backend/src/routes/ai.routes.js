const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware de autenticação para todas as rotas
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

// Solicitar insight
router.post(
  '/insights/session/:sessionId',
  [
    body('prompt').isString().optional(),
    body('keywords').isString().optional()
  ],
  aiController.requestInsight
);

// Obter insights de uma sessão
router.get('/insights/session/:sessionId', aiController.getSessionInsights);

// Gerar resumo da sessão
router.get('/summary/session/:sessionId', aiController.generateSessionSummary);

module.exports = router; 