/**
 * Rotas para gerenciamento de videoconferências
 */

const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Importar serviço Jitsi
const jitsiService = require('../services/jitsi.service');

// Middleware para verificar se o usuário está autenticado
router.use(authenticate);

// Rota de debug para testar a configuração do Jitsi
router.get('/debug', async (req, res) => {
  try {
    // Verificar configuração do Jitsi
    res.json({
      message: 'Configuração do Jitsi',
      domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
      appId: process.env.JITSI_APP_ID || 'terapiaconect',
      hasSecret: process.env.JITSI_APP_SECRET ? 'Configurado (não exibido)' : 'Usando valor padrão'
    });
  } catch (error) {
    console.error('Erro ao verificar configuração do Jitsi:', error);
    res.status(500).json({ message: 'Erro ao verificar configuração do Jitsi', error: error.message });
  }
});

/**
 * @route POST /api/meetings
 * @desc Cria uma nova reunião para uma sessão
 * @access Privado - Terapeuta e Cliente
 */
router.post('/', meetingController.createMeeting);

/**
 * @route GET /api/meetings/:sessionId/join
 * @desc Gera token para entrar em uma reunião
 * @access Privado - Terapeuta e Cliente da sessão
 */
router.get('/:sessionId/join', meetingController.joinMeeting);

/**
 * @route POST /api/meetings/:sessionId/end
 * @desc Encerra uma reunião ativa
 * @access Privado - Apenas o Terapeuta
 */
router.post('/:sessionId/end', meetingController.endMeeting);

/**
 * @route GET /api/meetings/:sessionId/status
 * @desc Verifica o status de uma reunião
 * @access Privado - Terapeuta e Cliente da sessão
 */
router.get('/:sessionId/status', meetingController.getMeetingStatus);

module.exports = router; 