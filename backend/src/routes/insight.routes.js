const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const insightController = require('../controllers/insight.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Middleware para validar criação de insight
const validateInsight = [
  body('content').notEmpty().withMessage('O conteúdo do insight é obrigatório'),
  body('type').optional().isString().withMessage('O tipo deve ser um texto'),
  body('keywords').optional().isArray().withMessage('Keywords deve ser um array')
];

// Middleware para validar atualização de insight
const validateInsightUpdate = [
  body('content').optional().isString().withMessage('O conteúdo deve ser um texto'),
  body('type').optional().isString().withMessage('O tipo deve ser um texto'),
  body('keywords').optional().isArray().withMessage('Keywords deve ser um array')
];

// Middleware para validar visibilidade de insights
const validateVisibility = [
  body('shareInsightsWithClient').isBoolean().withMessage('O valor deve ser true ou false')
];

// Rotas protegidas com autenticação
router.use(authenticate);

// Adicionar um novo insight a uma sessão
router.post('/:sessionId', validateInsight, insightController.addInsight);

// Obter todos os insights de uma sessão
router.get('/:sessionId', insightController.getSessionInsights);

// Excluir um insight específico
router.delete('/:insightId', insightController.deleteInsight);

// Atualizar um insight
router.patch('/:insightId', validateInsightUpdate, insightController.updateInsight);

// Atualizar visibilidade dos insights para o cliente
router.patch('/:sessionId/visibility', validateVisibility, insightController.updateInsightVisibility);

module.exports = router; 