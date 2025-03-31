/**
 * Controlador para gerenciar videoconferências
 * 
 * Este controlador lida com a criação, configuração e gerenciamento
 * de sessões de videoconferência usando o serviço do Daily.co
 */

const jitsiService = require('../services/jitsi.service');
const dailyService = require('../services/daily.service');
const prisma = require('../utils/prisma');

/**
 * Controlador para gerenciar videoconferências com Daily.co
 */
const meetingController = {
  /**
   * Cria uma reunião/sessão no Daily.co
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  createMeeting: async (req, res) => {
    try {
      const { roomName, provider = 'jitsi' } = req.body;
      
      // Verificar se há um usuário logado (req.user é inserido pelo middleware de auth)
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Gerar identificador único para a sessão se não fornecido
      const sessionId = roomName || `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      console.log(`Criando reunião. Provider: ${provider}, roomName: ${sessionId}`);
      
      let roomData = {};
      let url = '';
      
      // Criar sala no provedor de videoconferência selecionado
      if (provider === 'daily') {
        // Usar o serviço Daily para criar a sala
        const dailyRoom = await dailyService.validateAndGetRoom(sessionId);
        url = dailyRoom.url;
        roomData = {
          dailyRoomName: dailyRoom.name,
          dailyRoomUrl: dailyRoom.url
        };
        console.log('Sala Daily.co criada:', dailyRoom);
      } else if (provider === 'dyte') {
        // Código para o Dyte, se for necessário
        // ...
      } else {
        // Jitsi (provider padrão)
        url = `https://meet.jit.si/${sessionId}`;
      }
      
      // Registrar a reunião no banco de dados
      const meeting = await prisma.meeting.create({
        data: {
          sessionId,
          status: 'active',
          provider,
          createdBy: {
            connect: { id: req.user.id }
          },
          ...roomData
        }
      });
      
      console.log(`Reunião criada, ID: ${meeting.id}, SessionID: ${sessionId}`);
      
      return res.status(201).json({
        id: meeting.id,
        sessionId,
        url,
        provider
      });
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      return res.status(500).json({ error: 'Erro ao criar reunião: ' + error.message });
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

      // Verificar se existe uma reunião criada
      if (!session.dyteMeetingId || !session.dyteRoomName) {
        // Se não existir, criar uma nova reunião Daily.co
        const roomName = `tc-${sessionId.substring(0, 8)}-${Date.now()}`;
        const dailyRoom = await dailyService.createRoom(roomName, 2);
        
        // Atualizar a sessão com os dados da nova sala
        await prisma.$executeRawUnsafe(`
          UPDATE "Session"
          SET "dyteMeetingId" = '${dailyRoom.name}',
              "dyteRoomName" = '${dailyRoom.url}'
          WHERE id = '${sessionId}'
        `);
        
        // Atualizar os dados da sessão na memória
        session.dyteMeetingId = dailyRoom.name;
        session.dyteRoomName = dailyRoom.url;
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
      const role = isTherapist ? 'host' : 'participant';
      
      // Gerar um token para o participante (opcional, para acesso seguro)
      const tokenResult = await dailyService.createMeetingToken(session.dyteMeetingId, {
        userName: currentUser.name,
        userId: userId,
        isOwner: isTherapist,
        startAudioOff: false,
        startVideoOff: false
      });

      // Para compatibilidade com o cliente existente, retornamos o mesmo formato
      res.status(200).json({
        message: 'Token de participante gerado com sucesso',
        authToken: tokenResult.token,
        meetingId: session.dyteMeetingId,
        roomName: session.dyteRoomName,
        domain: 'terapiaconect.daily.co',
        // Informações sobre o usuário
        userName: currentUser.name,
        userId: userId,
        userRole: role,
        isHost: isTherapist
      });
    } catch (error) {
      console.error('Erro ao entrar na reunião:', error);
      res.status(500).json({ message: 'Erro ao entrar na reunião', error: error.message });
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

      // Encerrar a reunião no Daily.co
      await dailyService.deleteRoom(session.dyteMeetingId);

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
      res.status(500).json({ message: 'Erro ao encerrar reunião', error: error.message });
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

      // Verificar o status da reunião no Daily.co
      const roomStatus = await dailyService.getRoomStatus(session.dyteMeetingId);

      return res.json({
        active: roomStatus.exists,
        url: session.dyteRoomName,
        roomName: session.dyteMeetingId,
        created: roomStatus.created,
        expires: roomStatus.expires,
        message: roomStatus.exists ? 'Reunião ativa' : 'Reunião não existe ou expirou'
      });
    } catch (error) {
      console.error('Erro ao verificar status da reunião:', error);
      res.status(500).json({ message: 'Erro ao verificar status da reunião', error: error.message });
    }
  }
};

module.exports = meetingController; 