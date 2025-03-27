const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transcriptController = require('../controllers/transcript.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Middleware para validar criação de transcrição
const validateTranscript = [
  body('speaker').notEmpty().withMessage('O campo speaker é obrigatório'),
  body('content').notEmpty().withMessage('O conteúdo da transcrição é obrigatório')
];

// Middleware para validar atualização de transcrição
const validateTranscriptUpdate = [
  body('content').notEmpty().withMessage('O conteúdo da transcrição é obrigatório')
];

// Rotas protegidas com autenticação
router.use(authenticate);

// Adicionar uma nova transcrição a uma sessão
router.post('/:sessionId', validateTranscript, transcriptController.addTranscript);

// Obter todas as transcrições de uma sessão
router.get('/:sessionId', transcriptController.getSessionTranscripts);

// Excluir uma transcrição específica
router.delete('/:transcriptId', transcriptController.deleteTranscript);

// Atualizar o conteúdo de uma transcrição
router.patch('/:transcriptId', validateTranscriptUpdate, transcriptController.updateTranscript);

module.exports = router; 