import api from './api';

/**
 * Serviço para interações com a IA
 */
const aiService = {
  /**
   * Enviar transcrição da sessão para o servidor
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Texto da transcrição
   * @param {Object} emotions - Objeto com as emoções detectadas
   * @returns {Promise} Resposta da API
   */
  saveTranscript: async (sessionId, transcript, emotions = null) => {
    try {
      const response = await api.post('/api/ai/transcript', {
        sessionId,
        transcript,
        emotions
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar transcrição:', error);
      throw error;
    }
  },

  /**
   * Solicitar análise da sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Transcrição opcional (pode ser obtida do servidor)
   * @returns {Promise} Resposta da API com análise
   */
  analyzeSession: async (sessionId, transcript = null) => {
    try {
      const response = await api.post('/api/ai/analyze', {
        sessionId,
        transcript
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      throw error;
    }
  },

  /**
   * Solicitar sugestões para a sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Transcrição opcional (pode ser obtida do servidor)
   * @returns {Promise} Resposta da API com sugestões
   */
  generateSuggestions: async (sessionId, transcript = null) => {
    try {
      const response = await api.post('/api/ai/suggest', {
        sessionId,
        transcript
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      throw error;
    }
  },

  /**
   * Solicitar relatório da sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Transcrição opcional (pode ser obtida do servidor)
   * @returns {Promise} Resposta da API com relatório
   */
  generateReport: async (sessionId, transcript = null) => {
    try {
      const response = await api.post('/api/ai/report', {
        sessionId,
        transcript
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }
};

export default aiService; 