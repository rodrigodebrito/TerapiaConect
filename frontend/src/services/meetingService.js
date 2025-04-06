/**
 * Serviço para gerenciar videoconferências usando Jitsi Meet
 * 
 * Este serviço lida com a criação, configuração e gerenciamento
 * de sessões de videoconferência através da API do backend,
 * que se integra com a plataforma Jitsi Meet
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
    
    // Garantir que o URL não tenha prefixo "tc-" que causa problemas com Daily.co
    if (response.data && response.data.roomName) {
      // Limpeza do URL para compatibilidade com o Daily.co
      response.data.roomName = response.data.roomName.replace('/tc-', '/');
      
      // Verificar se o URL ainda contém o domínio correto
      if (!response.data.roomName.includes('teraconect.daily.co')) {
        console.warn('URL da sala não contém o domínio correto, ajustando...');
        
        // Extrair o nome da sala (último segmento da URL)
        const roomNameSegment = response.data.roomName.split('/').pop();
        // Reconstruir URL com domínio correto
        response.data.roomName = `https://teraconect.daily.co/${roomNameSegment}`;
      }
      
      console.log('URL da sala processado:', response.data.roomName);
    }
    
    return response.data;
  } catch (error) {
    // Se o erro for 404 (sala não encontrada), tentar criar a sala primeiro
    if (error.response && error.response.status === 404) {
      console.log('Sala não encontrada, tentando criar uma nova sala para a sessão:', sessionId);
      try {
        // Chamar createMeeting para criar uma nova sala
        const newMeeting = await createMeeting(sessionId);
        console.log('Nova sala criada:', newMeeting);
        
        // Tentar entrar na sala novamente
        const joinResponse = await api.get(`/meetings/${sessionId}/join`);
        console.log('Token de acesso gerado após criar sala:', joinResponse.data);
        
        // Aplicar a mesma limpeza de URL
        if (joinResponse.data && joinResponse.data.roomName) {
          joinResponse.data.roomName = joinResponse.data.roomName.replace('/tc-', '/');
          
          if (!joinResponse.data.roomName.includes('teraconect.daily.co')) {
            const roomNameSegment = joinResponse.data.roomName.split('/').pop();
            joinResponse.data.roomName = `https://teraconect.daily.co/${roomNameSegment}`;
          }
          
          console.log('URL da sala processado (após criar):', joinResponse.data.roomName);
        }
        
        return joinResponse.data;
      } catch (createError) {
        console.error('Erro ao criar e entrar na reunião:', createError);
        throw createError;
      }
    }
    
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