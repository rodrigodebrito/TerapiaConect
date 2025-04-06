const trainingService = require('../services/ai/training.service');
const logger = require('../logger');

const trainingController = {
  /**
   * Adiciona um novo material de treinamento
   */
  addMaterial: async (req, res) => {
    try {
      const { title, content, type, category } = req.body;
      const userId = req.user.id;

      const material = await trainingService.addTrainingMaterial({
        title,
        content,
        type,
        category,
        userId
      });

      res.status(201).json(material);
    } catch (error) {
      logger.error('Erro ao adicionar material:', error);
      res.status(500).json({ error: 'Erro ao adicionar material de treinamento' });
    }
  },

  /**
   * Lista materiais por categoria
   */
  getMaterialsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const materials = await trainingService.getMaterialsByCategory(category);
      res.json(materials);
    } catch (error) {
      logger.error('Erro ao buscar materiais:', error);
      res.status(500).json({ error: 'Erro ao buscar materiais de treinamento' });
    }
  },

  /**
   * Obtém detalhes de um material específico
   */
  getMaterialById: async (req, res) => {
    try {
      const { id } = req.params;
      const material = await prisma.trainingMaterial.findUnique({
        where: { id }
      });

      if (!material) {
        return res.status(404).json({ error: 'Material não encontrado' });
      }

      res.json(material);
    } catch (error) {
      logger.error('Erro ao buscar material:', error);
      res.status(500).json({ error: 'Erro ao buscar material de treinamento' });
    }
  },

  /**
   * Atualiza um material existente
   */
  updateMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, type, category } = req.body;

      const material = await prisma.trainingMaterial.update({
        where: { id },
        data: { title, content, type, category }
      });

      res.json(material);
    } catch (error) {
      logger.error('Erro ao atualizar material:', error);
      res.status(500).json({ error: 'Erro ao atualizar material de treinamento' });
    }
  },

  /**
   * Remove um material
   */
  deleteMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.trainingMaterial.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Erro ao deletar material:', error);
      res.status(500).json({ error: 'Erro ao deletar material de treinamento' });
    }
  },

  /**
   * Processa um material manualmente
   */
  processMaterial: async (req, res) => {
    try {
      const { id } = req.params;
      const insights = await trainingService.processMaterial(id);
      res.json({ insights });
    } catch (error) {
      logger.error('Erro ao processar material:', error);
      res.status(500).json({ error: 'Erro ao processar material de treinamento' });
    }
  },

  /**
   * Melhora a análise de uma sessão usando materiais de treinamento
   */
  enhanceSessionAnalysis: async (req, res) => {
    try {
      const { sessionContent, category } = req.body;
      const enhancedAnalysis = await trainingService.enhanceSessionAnalysis(
        sessionContent,
        category
      );
      res.json({ analysis: enhancedAnalysis });
    } catch (error) {
      logger.error('Erro ao melhorar análise:', error);
      res.status(500).json({ error: 'Erro ao melhorar análise da sessão' });
    }
  }
};

module.exports = trainingController; 