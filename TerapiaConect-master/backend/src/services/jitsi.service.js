/**
 * Serviço para gerenciar salas de videoconferência com Jitsi
 */

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Configurações do Jitsi
const JITSI_CONFIG = require('../utils/jitsi.config');

class JitsiService {
  constructor() {
    console.log('Inicializando serviço Jitsi');
  }

  /**
   * Cria uma nova sala de reunião Jitsi
   * @param {string} title - Título da reunião
   * @returns {Object} - Dados da sala criada
   */
  async createMeeting(title) {
    try {
      const roomName = `terapiaconect-${uuidv4()}`;
      
      // No Jitsi não precisamos criar a sala previamente, apenas gerar o nome
      return {
        success: true,
        data: {
          id: roomName,
          room_name: roomName,
          title: title || 'Sessão de Terapia',
          created_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao criar sala Jitsi:', error);
      throw error;
    }
  }

  /**
   * Gera um token JWT para autenticação do participante
   * @param {string} meetingId - ID da reunião (room name)
   * @param {string} displayName - Nome do participante
   * @param {string} userId - ID do usuário
   * @param {string} role - Papel do usuário (host ou participant)
   * @returns {Object} - Token de autenticação
   */
  async addParticipant(meetingId, displayName, userId, role) {
    try {
      const isHost = role === 'group_call_host' || role === 'host' || role === 'moderator';
      
      // Criar payload do JWT para autenticação no Jitsi
      const payload = {
        context: {
          user: {
            id: userId,
            name: displayName
          },
          features: {
            livestreaming: false,
            recording: isHost,
            transcription: isHost,
            outbound_call: false
          }
        },
        room: meetingId,
        sub: JITSI_CONFIG.appId,
        iss: JITSI_CONFIG.appId,
        aud: JITSI_CONFIG.domain,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Token válido por 24 horas
        moderator: isHost
      };

      // Assinar o token
      const token = jwt.sign(payload, JITSI_CONFIG.appSecret);

      return {
        success: true,
        data: {
          token: token,
          roomName: meetingId,
          userId: userId,
          userName: displayName,
          role: isHost ? 'moderator' : 'participant',
          isHost: isHost
        }
      };
    } catch (error) {
      console.error('Erro ao adicionar participante Jitsi:', error);
      throw error;
    }
  }

  /**
   * Encerra uma reunião (no Jitsi, apenas limpamos os registros)
   * @param {string} meetingId - ID da reunião
   * @returns {Object} - Resultado da operação
   */
  async endMeeting(meetingId) {
    try {
      // No Jitsi, as salas se encerram automaticamente quando vazias
      // Esta função existe apenas para compatibilidade com a API anterior
      return {
        success: true,
        message: 'Sala encerrada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao encerrar sala Jitsi:', error);
      throw error;
    }
  }

  /**
   * Obtém informações sobre uma reunião
   * @param {string} meetingId - ID da reunião
   * @returns {Object} - Dados da reunião
   */
  async getMeeting(meetingId) {
    try {
      // No Jitsi, não temos uma API para verificar o status da sala
      // Retornamos informações básicas
      return {
        success: true,
        data: {
          id: meetingId,
          room_name: meetingId,
          status: 'active'  // Assumimos que está ativa
        }
      };
    } catch (error) {
      console.error('Erro ao obter informações da sala Jitsi:', error);
      throw error;
    }
  }
}

module.exports = new JitsiService(); 