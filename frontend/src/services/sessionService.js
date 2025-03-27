import api from './api';

/**
 * Obter os detalhes de uma sessão pelo ID
 */
export const getSessionById = async (sessionId) => {
  try {
    console.log(`Buscando detalhes da sessão: ${sessionId}`);
    const response = await api.get(`/sessions/${sessionId}`);
    console.log('Detalhes da sessão obtidos:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    throw error;
  }
};

/**
 * Marcar uma sessão como concluída
 */
export const markSessionCompleted = async (sessionId) => {
  try {
    console.log(`Marcando sessão ${sessionId} como concluída`);
    const response = await api.put(`/sessions/${sessionId}/complete`);
    console.log('Sessão marcada como concluída:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao marcar sessão como concluída:', error);
    throw error;
  }
};

/**
 * Iniciar uma sessão agendada
 */
export const startSession = async (sessionId) => {
  try {
    console.log(`Iniciando sessão ${sessionId}`);
    const response = await api.put(`/sessions/${sessionId}/start`);
    console.log('Sessão iniciada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao iniciar sessão:', error);
    throw error;
  }
};

/**
 * Cancelar uma sessão
 */
export const cancelSession = async (sessionId, reason) => {
  try {
    console.log(`Cancelando sessão ${sessionId}`);
    const response = await api.put(`/sessions/${sessionId}/cancel`, { reason });
    console.log('Sessão cancelada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao cancelar sessão:', error);
    throw error;
  }
};

/**
 * Reagendar uma sessão
 */
export const rescheduleSession = async (sessionId, newDateTime) => {
  try {
    console.log(`Reagendando sessão ${sessionId}`);
    const response = await api.put(`/sessions/${sessionId}/reschedule`, newDateTime);
    console.log('Sessão reagendada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao reagendar sessão:', error);
    throw error;
  }
};

/**
 * Criar uma sessão para um agendamento de forma robusta
 */
export const createRobustSession = async (appointmentData) => {
  try {
    // Verificar se temos um appointmentId
    if (!appointmentData.id) {
      throw new Error('ID do agendamento é obrigatório');
    }
    
    // Definir título da sessão
    let sessionTitle = '';
    if (appointmentData.therapistName) {
      sessionTitle = `Sessão com ${appointmentData.therapistName}`;
    } else if (appointmentData.therapist?.name) {
      sessionTitle = `Sessão com ${appointmentData.therapist.name}`;
    } else {
      sessionTitle = `Sessão ${new Date().toLocaleDateString()}`;
    }
    
    // Criar payload da sessão
    const sessionPayload = {
      appointmentId: appointmentData.id,
      title: sessionTitle,
      scheduledDuration: appointmentData.duration || 50
    };
    
    // Tentar criar a sessão
    const response = await api.post('/sessions', sessionPayload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Criar uma sessão de teste (apenas para terapeutas)
 */
export const createTestSession = async () => {
  try {
    const response = await api.post('/sessions/test');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getSessionById,
  markSessionCompleted,
  startSession,
  cancelSession,
  rescheduleSession,
  createRobustSession,
  createTestSession
}; 