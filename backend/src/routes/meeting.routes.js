/**
 * Rotas para gerenciamento de videoconferências
 */

const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Rota de debug para testar a conexão com o Dyte
router.get('/debug', async (req, res) => {
  try {
    const dyteService = require('../services/dyte.service');
    const dyteConfig = require('../utils/dyte.config');
    
    // Verificar configuração
    res.json({
      message: 'Configuração do Dyte',
      baseUrl: dyteConfig.baseUrl,
      organizationId: dyteConfig.organizationId,
      apiKeyLength: dyteConfig.apiKey ? dyteConfig.apiKey.length : 0,
      authHeader: dyteConfig.authorizationHeader ? 'Configurado (não exibido por segurança)' : 'Não configurado'
    });
  } catch (error) {
    console.error('Erro ao verificar configuração do Dyte:', error);
    res.status(500).json({ message: 'Erro ao verificar configuração do Dyte', error: error.message });
  }
});

// Criar uma reunião para uma sessão
router.post('/', meetingController.createMeeting);

// Entrar em uma reunião
router.get('/:sessionId/join', meetingController.joinMeeting);

// Encerrar uma reunião
router.post('/:sessionId/end', meetingController.endMeeting);

// Obter status de uma reunião
router.get('/:sessionId/status', meetingController.getMeetingStatus);

module.exports = router; 