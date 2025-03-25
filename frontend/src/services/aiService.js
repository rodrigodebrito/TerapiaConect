import api from './api';

const aiService = {
  /**
   * Analisa o conteúdo da sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} content - Conteúdo para análise
   * @returns {Promise<Object>} Resultado da análise
   */
  async analyzeSession(sessionId, content) {
    try {
      const response = await api.post(`/ai/analyze/${sessionId}`, { content });
      return response.data;
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      throw error;
    }
  },

  /**
   * Gera sugestões em tempo real
   * @param {string} sessionId - ID da sessão
   * @param {string} context - Contexto atual da sessão
   * @returns {Promise<Object>} Sugestões geradas
   */
  async generateSuggestions(sessionId, context) {
    try {
      const response = await api.post(`/ai/suggest/${sessionId}`, { context });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      throw error;
    }
  },

  /**
   * Gera relatório da sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} content - Conteúdo completo da sessão
   * @returns {Promise<Object>} Relatório gerado
   */
  async generateReport(sessionId, content) {
    try {
      const response = await api.post(`/ai/report/${sessionId}`, { content });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  },

  /**
   * Adiciona transcrição à sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} text - Texto da transcrição
   * @returns {Promise<Object>} Confirmação do salvamento
   */
  async addTranscription(sessionId, text) {
    try {
      const response = await api.post(`/ai/transcription/${sessionId}`, { text });
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar transcrição:', error);
      throw error;
    }
  }
};

export default aiService; 