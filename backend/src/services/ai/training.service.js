const { OpenAI } = require('openai');
const prisma = require('../../utils/prisma');
const logger = require('../../utils/logger');

class TrainingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Adiciona um novo material de treinamento
   * @param {Object} data - Dados do material
   * @param {string} data.title - Título do material
   * @param {string} data.content - Conteúdo do material
   * @param {string} data.type - Tipo do material (aula, supervisao, etc)
   * @param {string} data.category - Categoria do material
   * @param {string} data.userId - ID do usuário que está adicionando
   */
  async addTrainingMaterial(data) {
    try {
      const material = await prisma.trainingMaterial.create({
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          category: data.category,
          userId: data.userId,
          status: 'pending'
        }
      });

      // Processa o material com a IA
      await this.processMaterial(material.id);

      return material;
    } catch (error) {
      logger.error('Erro ao adicionar material de treinamento:', error);
      throw error;
    }
  }

  /**
   * Processa um material com a IA para extrair insights e padrões
   * @param {string} materialId - ID do material
   */
  async processMaterial(materialId) {
    try {
      const material = await prisma.trainingMaterial.findUnique({
        where: { id: materialId }
      });

      if (!material) {
        throw new Error('Material não encontrado');
      }

      // Extrai insights do material
      const insights = await this.extractInsights(material.content);
      
      // Atualiza o material com os insights
      await prisma.trainingMaterial.update({
        where: { id: materialId },
        data: {
          insights: insights,
          status: 'processed'
        }
      });

      return insights;
    } catch (error) {
      logger.error('Erro ao processar material:', error);
      throw error;
    }
  }

  /**
   * Extrai insights do conteúdo usando a IA
   * @param {string} content - Conteúdo do material
   */
  async extractInsights(content) {
    try {
      const prompt = `
        Analise o seguinte conteúdo e extraia:
        1. Principais conceitos e teorias
        2. Técnicas e metodologias mencionadas
        3. Casos de exemplo
        4. Recomendações práticas
        5. Pontos de atenção
        6. Referências importantes
        
        Conteúdo:
        ${content}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de conteúdo terapêutico e educacional."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      logger.error('Erro ao extrair insights:', error);
      throw error;
    }
  }

  /**
   * Busca materiais de treinamento por categoria
   * @param {string} category - Categoria dos materiais
   */
  async getMaterialsByCategory(category) {
    try {
      return await prisma.trainingMaterial.findMany({
        where: {
          category: category,
          status: 'processed'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar materiais:', error);
      throw error;
    }
  }

  /**
   * Usa os materiais treinados para melhorar a análise de uma sessão
   * @param {string} sessionContent - Conteúdo da sessão
   * @param {string} category - Categoria da sessão
   */
  async enhanceSessionAnalysis(sessionContent, category) {
    try {
      // Busca materiais relevantes
      const relevantMaterials = await this.getMaterialsByCategory(category);
      
      // Combina insights dos materiais com o conteúdo da sessão
      const materialsContext = relevantMaterials
        .map(m => m.insights)
        .join('\n\n');

      const prompt = `
        Analise a seguinte sessão considerando os insights dos materiais de treinamento:
        
        Materiais de Referência:
        ${materialsContext}
        
        Conteúdo da Sessão:
        ${sessionContent}
        
        Forneça uma análise detalhada considerando:
        1. Aplicação de conceitos dos materiais
        2. Alinhamento com metodologias aprendidas
        3. Pontos de melhoria baseados nos materiais
        4. Recomendações específicas
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de sessões terapêuticas com conhecimento profundo dos materiais de treinamento."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      logger.error('Erro ao melhorar análise da sessão:', error);
      throw error;
    }
  }
}

module.exports = new TrainingService(); 