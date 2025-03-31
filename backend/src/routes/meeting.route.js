const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas EXCETO a de verificação de sala
router.use(/^\/(?!check-room).*$/, authMiddleware);

// Criar uma reunião
router.post('/create', meetingController.createMeeting);

// Entrar em uma reunião
router.post('/join', meetingController.joinMeeting);

// Encerrar uma reunião
router.post('/end', meetingController.endMeeting);

// Verificar status de uma reunião
router.get('/status/:sessionId', meetingController.getMeetingStatus);

// Verificar sala Daily.co (sem autenticação para facilitar testes)
router.get('/check-room/:roomName', async (req, res) => {
  try {
    const dailyService = require('../services/daily.service');
    const { roomName } = req.params;
    
    console.log('Verificando sala:', roomName);
    
    if (!roomName) {
      return res.status(400).json({ error: 'Nome da sala não fornecido' });
    }
    
    const result = await dailyService.validateAndGetRoom(roomName);
    console.log('Resultado da verificação:', result);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao verificar sala:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 