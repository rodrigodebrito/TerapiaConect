import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Serviço para gerenciar as chamadas de API relacionadas à IA
 */
const aiService = {
  /**
   * Analisar transcrição e gerar insights
   * @param {Array} transcript - Array de objetos de transcrição
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com os insights gerados
   */
  generateInsights: async (transcript, sessionId) => {
    try {
      const response = await axios.post(`${API_URL}/api/ai/insights`, {
        transcript,
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      throw error;
    }
  },

  /**
   * Iniciar transcrição de áudio
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com o status da transcrição
   */
  startTranscription: async (sessionId) => {
    try {
      const response = await axios.post(`${API_URL}/api/ai/transcription/start`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar transcrição:', error);
      throw error;
    }
  },

  /**
   * Parar transcrição de áudio
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com o status da transcrição
   */
  stopTranscription: async (sessionId) => {
    try {
      const response = await axios.post(`${API_URL}/api/ai/transcription/stop`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao parar transcrição:', error);
      throw error;
    }
  },

  /**
   * Obter transcrição completa
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com a transcrição completa
   */
  getTranscript: async (sessionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/ai/transcription/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter transcrição:', error);
      throw error;
    }
  },

  /**
   * Obter resumo da sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com o resumo da sessão
   */
  getSessionSummary: async (sessionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/ai/summary/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter resumo da sessão:', error);
      throw error;
    }
  },

  /**
   * Salvar notas da sessão com análise de IA
   * @param {string} sessionId - ID da sessão
   * @param {string} notes - Notas da sessão
   * @returns {Promise} - Promessa com as notas enriquecidas
   */
  processSessionNotes: async (sessionId, notes) => {
    try {
      const response = await axios.post(`${API_URL}/api/ai/notes`, {
        sessionId,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao processar notas da sessão:', error);
      throw error;
    }
  }
};

export default aiService; 