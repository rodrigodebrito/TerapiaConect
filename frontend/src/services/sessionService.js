import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Serviço para gerenciar as chamadas de API relacionadas à sessão
 */
const sessionService = {
  /**
   * Obter detalhes de uma sessão por ID
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com os dados da sessão
   */
  getSession: async (sessionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      throw error;
    }
  },

  /**
   * Iniciar uma nova sessão
   * @param {Object} sessionData - Dados da sessão
   * @returns {Promise} - Promessa com os dados da sessão criada
   */
  startSession: async (sessionData) => {
    try {
      const response = await axios.post(`${API_URL}/api/sessions`, sessionData);
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      throw error;
    }
  },

  /**
   * Finalizar uma sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com os dados da sessão finalizada
   */
  endSession: async (sessionId) => {
    try {
      const response = await axios.put(`${API_URL}/api/sessions/${sessionId}/end`);
      return response.data;
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      throw error;
    }
  },

  /**
   * Pausar uma sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com os dados da sessão pausada
   */
  pauseSession: async (sessionId) => {
    try {
      const response = await axios.put(`${API_URL}/api/sessions/${sessionId}/pause`);
      return response.data;
    } catch (error) {
      console.error('Erro ao pausar sessão:', error);
      throw error;
    }
  },

  /**
   * Retomar uma sessão
   * @param {string} sessionId - ID da sessão
   * @returns {Promise} - Promessa com os dados da sessão retomada
   */
  resumeSession: async (sessionId) => {
    try {
      const response = await axios.put(`${API_URL}/api/sessions/${sessionId}/resume`);
      return response.data;
    } catch (error) {
      console.error('Erro ao retomar sessão:', error);
      throw error;
    }
  },

  /**
   * Obter histórico de sessões de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise} - Promessa com o histórico de sessões
   */
  getUserSessions: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/${userId}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico de sessões:', error);
      throw error;
    }
  }
};

export default sessionService; 