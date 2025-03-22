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
    console.log('Buscando horários disponíveis:', { therapistId, date });
    
    // Buscar todos os horários disponíveis do terapeuta
    const response = await api.get(`/therapists/${therapistId}/availability`);
    console.log('Resposta da API (todos os horários):', response.data);
    
    // Filtrar apenas os do dia específico
    let timeSlots = [];
    if (response.data && Array.isArray(response.data)) {
      // Converter a data de entrada para formato ISO (YYYY-MM-DD)
      let formattedDate = date;
      if (!(date instanceof Date) && !date.includes('-')) {
        // Se não for uma data ISO, tentar converter
        const parts = date.split('/');
        formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      
      // Filtrar slots do dia específico
      const daySlots = response.data.filter(slot => slot.date === formattedDate);
      console.log(`Slots encontrados para ${formattedDate}:`, daySlots);
      
      // Transformar em array de horários
      timeSlots = daySlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: true
      }));
    }
    
    return timeSlots;
  } catch (error) {
    console.error('Erro ao buscar horários disponíveis:', error);
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