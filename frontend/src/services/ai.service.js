import api from './api';

/**
 * Serviço para interação com as funcionalidades de IA
 */
const aiService = {
  /**
   * Adiciona uma nova transcrição à sessão
   * @param {Object} data - Dados da transcrição
   * @returns {Promise} Resposta da API
   */
  async addTranscription(data) {
    try {
      const response = await api.post('/api/ai/transcriptions', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar transcrição:', error);
      throw error;
    }
  },

  /**
   * Obtém as transcrições de uma sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} Lista de transcrições
   */
  async getSessionTranscripts(sessionId) {
    try {
      const response = await api.get(`/api/ai/transcriptions/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter transcrições:', error);
      throw error;
    }
  },

  /**
   * Analisa uma sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} Análise da sessão
   */
  async analyzeSession(sessionId) {
    try {
      const response = await api.get(`/api/ai/analyze/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      throw error;
    }
  },

  /**
   * Gera sugestões em tempo real
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} Sugestões para o terapeuta
   */
  async generateSuggestions(sessionId) {
    try {
      const response = await api.get(`/api/ai/suggestions/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      throw error;
    }
  },

  /**
   * Gera relatório da sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} Relatório da sessão
   */
  async generateReport(sessionId) {
    try {
      const response = await api.get(`/api/ai/report/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }
};

export default aiService; 