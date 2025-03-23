import api from './api';

// Obter agendamentos do terapeuta
export const getTherapistAppointments = async (therapistId) => {
  try {
    const response = await api.get(`/appointments/therapist/${therapistId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos do terapeuta:', error);
    throw error;
  }
};

// Obter agendamentos do cliente
export const getClientAppointments = async (clientId) => {
  try {
    const response = await api.get(`/appointments/client/${clientId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos do cliente:', error);
    throw error;
  }
};

// Verificar disponibilidade de um terapeuta para o mês
export const getTherapistAvailability = async (therapistId, month, year) => {
  try {
    const response = await api.get(`/therapists/${therapistId}/availability`, {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching therapist availability:', error);
    throw error;
  }
};

// Obter horários disponíveis para uma data específica
export const getAvailableTimeSlots = async (therapistId, date) => {
  try {
    // Garantir que temos o formato correto para a requisição
    console.log(`[API] Iniciando busca de slots para terapeuta ${therapistId} na data ${date}`);
    
    let year, month, day;
    
    // Normalizar o formato da data
    if (date instanceof Date) {
      year = date.getFullYear();
      month = date.getMonth() + 1; // Mês é base 0 em JS
      day = date.getDate();
    } else if (typeof date === 'string') {
      if (date.includes('-')) {
        // Formato ISO (YYYY-MM-DD)
        [year, month, day] = date.split('-').map(Number);
      } else if (date.includes('/')) {
        // Formato brasileiro (DD/MM/YYYY)
        [day, month, year] = date.split('/').map(Number);
      } else {
        throw new Error(`Formato de data não reconhecido: ${date}`);
      }
    } else {
      throw new Error(`Tipo de data não suportado: ${typeof date}`);
    }
    
    // Formatar para uso na API
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    console.log(`[API] Data formatada para request: ${formattedDate}`);
    
    // Fazer a requisição
    const response = await api.get(`/therapists/${therapistId}/availability`, {
      params: { 
        month, 
        year,
        // Adicionar day como parâmetro opcional, caso a API suporte filtro por dia específico
        day
      }
    });
    
    // Log para debug
    console.log(`[API] Resposta para disponibilidade de ${formattedDate}:`, response.data);
    
    // Filtrar apenas os slots para o dia específico
    const slots = Array.isArray(response.data) 
      ? response.data
          .filter(slot => slot.date === formattedDate)
          .map(slot => slot.startTime)
      : [];
    
    console.log(`[API] ${slots.length} slots encontrados para ${formattedDate}:`, slots);
    return slots;
  } catch (error) {
    console.error(`[API] Erro ao buscar horários para ${date}:`, error);
    throw error;
  }
};

// Criar um novo agendamento
export const createAppointment = async (appointmentData) => {
  try {
    console.log('Criando agendamento:', appointmentData);
    const response = await api.post('/appointments', appointmentData);
    console.log('Resposta da API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw error;
  }
};

// Obter detalhes de um terapeuta
export const getTherapistDetails = async (therapistId) => {
  try {
    const response = await api.get(`/therapists/${therapistId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching therapist details:', error);
    throw error;
  }
};

export const getAppointments = async () => {
  try {
    const response = await api.get('/appointments');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
};

export const getAppointmentById = async (id) => {
  try {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    throw error;
  }
};

export const updateAppointment = async (id, data) => {
  try {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};

export const cancelAppointment = async (id) => {
  try {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    throw error;
  }
}; 