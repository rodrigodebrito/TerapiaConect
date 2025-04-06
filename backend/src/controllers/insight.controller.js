const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

/**
 * Controlador para gerenciar insights de IA das sessões
 */
const insightController = {
  /**
   * Adicionar um novo insight de IA a uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  addInsight: async (req, res) => {
    try {
      // Validar request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.params;
      const { content, type, keywords } = req.body;

      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode adicionar insights manualmente
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode adicionar insights' });
      }

      // Criar o insight
      const insight = await prisma.aIInsight.create({
        data: {
          sessionId,
          content,
          type: type || 'MANUAL',
          keywords: keywords || [],
          timestamp: new Date()
        }
      });

      res.status(201).json(insight);
    } catch (error) {
      console.error('Erro ao adicionar insight:', error);
      res.status(500).json({ message: 'Erro ao adicionar insight' });
    }
  },

  /**
   * Obter todos os insights de uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  getSessionInsights: async (req, res) => {
    try {
      const { sessionId } = req.params;

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

      // Verificar permissão: terapeuta vê tudo, cliente vê apenas se compartilhado
      const userId = req.user.id;
      const isTherapist = session.therapist.userId === userId;
      const isClient = session.client.userId === userId;

      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Não autorizado a acessar insights desta sessão' });
      }

      // Se for cliente, verificar se insights estão compartilhados
      if (isClient && !session.shareInsightsWithClient) {
        return res.status(403).json({ message: 'O terapeuta não compartilhou os insights desta sessão' });
      }

      // Buscar insights
      const insights = await prisma.aIInsight.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'desc' }
      });

      res.json(insights);
    } catch (error) {
      console.error('Erro ao obter insights:', error);
      res.status(500).json({ message: 'Erro ao obter insights' });
    }
  },

  /**
   * Excluir um insight específico
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  deleteInsight: async (req, res) => {
    try {
      const { insightId } = req.params;

      // Buscar o insight para verificar permissões
      const insight = await prisma.aIInsight.findUnique({
        where: { id: insightId },
        include: {
          session: {
            include: {
              therapist: true
            }
          }
        }
      });

      if (!insight) {
        return res.status(404).json({ message: 'Insight não encontrado' });
      }

      // Apenas o terapeuta pode excluir insights
      const userId = req.user.id;
      if (insight.session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode excluir insights' });
      }

      // Excluir o insight
      await prisma.aIInsight.delete({
        where: { id: insightId }
      });

      res.json({ message: 'Insight excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir insight:', error);
      res.status(500).json({ message: 'Erro ao excluir insight' });
    }
  },

  /**
   * Atualizar um insight específico
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  updateInsight: async (req, res) => {
    try {
      // Validar request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { insightId } = req.params;
      const { content, type, keywords } = req.body;

      // Buscar o insight para verificar permissões
      const insight = await prisma.aIInsight.findUnique({
        where: { id: insightId },
        include: {
          session: {
            include: {
              therapist: true
            }
          }
        }
      });

      if (!insight) {
        return res.status(404).json({ message: 'Insight não encontrado' });
      }

      // Apenas o terapeuta pode atualizar insights
      const userId = req.user.id;
      if (insight.session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode atualizar insights' });
      }

      // Atualizar o insight
      const updatedInsight = await prisma.aIInsight.update({
        where: { id: insightId },
        data: {
          content: content || insight.content,
          type: type || insight.type,
          keywords: keywords || insight.keywords
        }
      });

      res.json(updatedInsight);
    } catch (error) {
      console.error('Erro ao atualizar insight:', error);
      res.status(500).json({ message: 'Erro ao atualizar insight' });
    }
  },

  /**
   * Atualizar visibilidade dos insights para o cliente
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  updateInsightVisibility: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { shareInsightsWithClient } = req.body;

      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode atualizar a visibilidade dos insights
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode atualizar a visibilidade dos insights' });
      }

      // Atualizar a sessão
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { shareInsightsWithClient }
      });

      res.json({
        message: shareInsightsWithClient
          ? 'Insights compartilhados com o cliente'
          : 'Insights não compartilhados com o cliente',
        session: updatedSession
      });
    } catch (error) {
      console.error('Erro ao atualizar visibilidade dos insights:', error);
      res.status(500).json({ message: 'Erro ao atualizar visibilidade dos insights' });
    }
  }
};

module.exports = insightController; 