/**
 * Serviço para gerenciar videoconferências usando Dyte
 * 
 * Este serviço lida com a criação, configuração e gerenciamento
 * de sessões de videoconferência através da API do backend,
 * que se integra com a plataforma Dyte.io
 */

import api from './api';

/**
 * Cria uma reunião para uma sessão específica
 * @param {string} sessionId - ID da sessão para a qual criar a reunião
 * @param {string} title - Título opcional da reunião
 * @returns {Promise<Object>} - Detalhes da reunião criada
 */
export const createMeeting = async (sessionId, title = '') => {
  try {
    console.log('Criando reunião para a sessão:', sessionId);
    const response = await api.post('/meetings', {
      sessionId,
      title
    });
    console.log('Reunião criada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    throw error;
  }
};

/**
 * Entra em uma reunião existente para uma sessão
 * @param {string} sessionId - ID da sessão
 * @returns {Promise<Object>} - Token de acesso e detalhes da reunião
 */
export const joinMeeting = async (sessionId) => {
  try {
    console.log('Entrando na reunião para a sessão:', sessionId);
    const response = await api.get(`/meetings/${sessionId}/join`);
    console.log('Token de acesso gerado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao entrar na reunião:', error);
    throw error;
  }
};

/**
 * Encerra uma reunião ativa
 * @param {string} sessionId - ID da sessão
 * @returns {Promise<Object>} - Confirmação de encerramento
 */
export const endMeeting = async (sessionId) => {
  try {
    console.log('Encerrando reunião da sessão:', sessionId);
    const response = await api.post(`/meetings/${sessionId}/end`);
    console.log('Reunião encerrada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao encerrar reunião:', error);
    throw error;
  }
};

/**
 * Verifica o status atual de uma reunião
 * @param {string} sessionId - ID da sessão
 * @returns {Promise<Object>} - Status da reunião
 */
export const getMeetingStatus = async (sessionId) => {
  try {
    const response = await api.get(`/meetings/${sessionId}/status`);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar status da reunião:', error);
    throw error;
  }
}; 