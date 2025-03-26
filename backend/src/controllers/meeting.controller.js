/**
 * Controlador para gerenciar videoconferências
 * 
 * Este controlador lida com a criação, configuração e gerenciamento
 * de sessões de videoconferência usando o serviço do Jitsi
 */

const jitsiService = require('../services/jitsi.service');
const prisma = require('../utils/prisma');

/**
 * Controlador para gerenciar videoconferências com Jitsi
 */
const meetingController = {
  /**
   * Cria uma reunião/sessão no Jitsi
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  createMeeting: async (req, res) => {
    try {
      const { sessionId, title } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: 'ID da sessão é obrigatório' });
      }

      // Buscar a sessão no banco de dados
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: {
            include: {
              user: true
            }
          },
          client: {
            include: {
              user: true
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Verificar se o usuário atual é o terapeuta ou cliente envolvido
      const userId = req.user.id;
      const isTherapist = session.therapist.userId === userId;
      const isClient = session.client.userId === userId;

      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Não autorizado a criar reunião para esta sessão' });
      }

      // Criar a reunião no Jitsi
      const meetingTitle = title || `Sessão: ${session.therapist.user.name} - ${new Date().toLocaleDateString()}`;
      const jitsiResponse = await jitsiService.createMeeting(meetingTitle);

      // Salvar o ID da reunião Jitsi na sessão
      await prisma.$executeRawUnsafe(`
        UPDATE "Session"
        SET "dyteMeetingId" = '${jitsiResponse.data.id}',
            "dyteRoomName" = '${jitsiResponse.data.room_name || ''}'
        WHERE id = '${sessionId}'
      `);

      res.status(201).json({
        message: 'Reunião criada com sucesso',
        meetingDetails: jitsiResponse.data
      });
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      res.status(500).json({ message: 'Erro ao criar reunião' });
    }
  },

  /**
   * Adiciona um participante à reunião
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  joinMeeting: async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ message: 'ID da sessão é obrigatório' });
      }

      // Buscar a sessão no banco de dados
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: {
            include: {
              user: true
            }
          },
          client: {
            include: {
              user: true
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      if (!session.dyteMeetingId) {
        return res.status(400).json({ message: 'Reunião ainda não foi criada para esta sessão' });
      }

      // Verificar se o usuário atual é o terapeuta ou cliente envolvido
      const userId = req.user.id;
      const currentUser = req.user;
      const isTherapist = session.therapist.userId === userId;
      const isClient = session.client.userId === userId;

      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Não autorizado a participar desta reunião' });
      }

      // Definir o papel com base em quem está entrando
      const role = isTherapist ? 'moderator' : 'participant';
      
      // Adicionar o participante à reunião no Jitsi
      const participantResponse = await jitsiService.addParticipant(
        session.dyteMeetingId,
        currentUser.name,
        userId,
        role
      );

      // Retornar informações para o frontend
      res.status(200).json({
        message: 'Token de participante gerado com sucesso',
        authToken: participantResponse.data.token,
        meetingId: session.dyteMeetingId,
        roomName: session.dyteRoomName,
        domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
        // Informações sobre o usuário
        userName: currentUser.name,
        userId: userId,
        userRole: role,
        isHost: participantResponse.data.isHost
      });
    } catch (error) {
      console.error('Erro ao entrar na reunião:', error);
      res.status(500).json({ message: 'Erro ao entrar na reunião' });
    }
  },

  /**
   * Encerra uma reunião ativa
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  endMeeting: async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ message: 'ID da sessão é obrigatório' });
      }

      // Buscar a sessão no banco de dados
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      if (!session.dyteMeetingId) {
        return res.status(400).json({ message: 'Nenhuma reunião ativa para esta sessão' });
      }

      // Verificar se o usuário atual é o terapeuta
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode encerrar a reunião' });
      }

      // Encerrar a reunião no Jitsi
      await jitsiService.endMeeting(session.dyteMeetingId);

      // Atualizar a sessão no banco de dados
      await prisma.$executeRawUnsafe(`
        UPDATE "Session"
        SET "dyteMeetingId" = NULL,
            "dyteRoomName" = NULL
        WHERE id = '${sessionId}'
      `);

      res.status(200).json({ message: 'Reunião encerrada com sucesso' });
    } catch (error) {
      console.error('Erro ao encerrar reunião:', error);
      res.status(500).json({ message: 'Erro ao encerrar reunião' });
    }
  },

  /**
   * Obtém o status de uma reunião
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  getMeetingStatus: async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ message: 'ID da sessão é obrigatório' });
      }

      // Buscar a sessão no banco de dados
      const session = await prisma.session.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Verificar se o usuário atual tem permissão para ver a sessão
      const userId = req.user.id;
      const isTherapist = session.therapistId && await prisma.therapist.findFirst({
        where: { id: session.therapistId, userId }
      });
      const isClient = session.clientId && await prisma.client.findFirst({
        where: { id: session.clientId, userId }
      });

      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Não autorizado a ver esta sessão' });
      }

      if (!session.dyteMeetingId) {
        return res.json({
          active: false,
          message: 'Nenhuma reunião ativa para esta sessão'
        });
      }

      // Verificar o status da reunião no Jitsi
      const meetingInfo = await jitsiService.getMeeting(session.dyteMeetingId);
      
      res.json({
        active: meetingInfo.data.status === 'active',
        meetingDetails: meetingInfo.data
      });
    } catch (error) {
      console.error('Erro ao verificar status da reunião:', error);
      res.status(500).json({ message: 'Erro ao verificar status da reunião' });
    }
  }
};

module.exports = meetingController; 