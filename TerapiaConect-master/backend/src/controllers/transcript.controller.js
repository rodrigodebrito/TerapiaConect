const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

/**
 * Controlador para gerenciar transcrições de sessões
 */
const transcriptController = {
  /**
   * Adicionar uma nova transcrição a uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  addTranscript: async (req, res) => {
    try {
      // Validar request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;
      const { speaker, content } = req.body;

      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true,
          client: true
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
        return res.status(403).json({ message: 'Não autorizado a adicionar transcrição a esta sessão' });
      }

      // Verificar se a sessão está ativa para adicionar transcrições
      if (session.status !== 'ACTIVE') {
        return res.status(400).json({ message: 'Só é possível adicionar transcrições a sessões ativas' });
      }

      // Criar a transcrição
      const transcript = await prisma.sessionTranscript.create({
        data: {
          sessionId,
          speaker,
          content,
          timestamp: new Date()
        }
      });

      res.status(201).json(transcript);
    } catch (error) {
      console.error('Erro ao adicionar transcrição:', error);
      res.status(500).json({ message: 'Erro ao adicionar transcrição' });
    }
  },

  /**
   * Obter todas as transcrições de uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  getSessionTranscripts: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { limit, offset } = req.query;

      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true,
          client: true
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
        return res.status(403).json({ message: 'Não autorizado a acessar transcrições desta sessão' });
      }

      // Buscar transcrições com paginação
      const take = limit ? parseInt(limit) : 50;
      const skip = offset ? parseInt(offset) : 0;

      const transcripts = await prisma.sessionTranscript.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        take,
        skip
      });

      // Contar total de transcrições para paginação
      const total = await prisma.sessionTranscript.count({
        where: { sessionId }
      });

      res.json({
        data: transcripts,
        pagination: {
          total,
          limit: take,
          offset: skip,
          hasMore: skip + take < total
        }
      });
    } catch (error) {
      console.error('Erro ao obter transcrições:', error);
      res.status(500).json({ message: 'Erro ao obter transcrições' });
    }
  },

  /**
   * Excluir uma transcrição específica
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  deleteTranscript: async (req, res) => {
    try {
      const { transcriptId } = req.params;

      // Buscar a transcrição para verificar permissões
      const transcript = await prisma.sessionTranscript.findUnique({
        where: { id: transcriptId },
        include: {
          session: {
            include: {
              therapist: true
            }
          }
        }
      });

      if (!transcript) {
        return res.status(404).json({ message: 'Transcrição não encontrada' });
      }

      // Apenas o terapeuta pode excluir transcrições
      const userId = req.user.id;
      if (transcript.session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode excluir transcrições' });
      }

      // Excluir a transcrição
      await prisma.sessionTranscript.delete({
        where: { id: transcriptId }
      });

      res.json({ message: 'Transcrição excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir transcrição:', error);
      res.status(500).json({ message: 'Erro ao excluir transcrição' });
    }
  },

  /**
   * Editar uma transcrição específica
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  updateTranscript: async (req, res) => {
    try {
      // Validar request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { transcriptId } = req.params;
      const { content } = req.body;

      // Buscar a transcrição para verificar permissões
      const transcript = await prisma.sessionTranscript.findUnique({
        where: { id: transcriptId },
        include: {
          session: {
            include: {
              therapist: true
            }
          }
        }
      });

      if (!transcript) {
        return res.status(404).json({ message: 'Transcrição não encontrada' });
      }

      // Apenas o terapeuta pode editar transcrições
      const userId = req.user.id;
      if (transcript.session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode editar transcrições' });
      }

      // Atualizar a transcrição
      const updatedTranscript = await prisma.sessionTranscript.update({
        where: { id: transcriptId },
        data: { content }
      });

      res.json(updatedTranscript);
    } catch (error) {
      console.error('Erro ao atualizar transcrição:', error);
      res.status(500).json({ message: 'Erro ao atualizar transcrição' });
    }
  }
};

module.exports = transcriptController; 