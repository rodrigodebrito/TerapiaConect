import api from './api';
import { getFullImageUrl } from '../utils/constants';

// Obter o perfil de terapeuta pelo ID do usuário
export const getTherapistByUserId = async (userId) => {
  try {
    console.log(`Buscando terapeuta para o usuário com ID: ${userId}`);
    const response = await api.get(`/api/therapists/user/${userId}`);
    console.log('Resposta do perfil de terapeuta por userId:', response.data);
    
    if (!response.data || !response.data.id) {
      console.warn('O usuário não tem um perfil de terapeuta associado');
      return null;
    }
    
    return response.data;
  } catch (error) {
    // Se for erro 404, significa que não existe perfil de terapeuta para este usuário
    if (error.response && error.response.status === 404) {
      console.log('Perfil de terapeuta não encontrado para este usuário');
      return null;
    }
    
    console.error('Erro ao buscar terapeuta por ID de usuário:', error);
    throw error;
  }
};

// Obter o perfil de terapeuta pelo ID do terapeuta
export const getTherapistById = async (therapistId) => {
  try {
    console.log(`Buscando terapeuta com ID: ${therapistId}`);
    const response = await api.get(`/api/therapists/${therapistId}`);
    console.log('Resposta detalhada do perfil:', response.data);
    
    // Assegurar que os campos JSON são corretamente processados
    const therapist = {
      ...response.data,
      niches: safeParseJSON(response.data.niches, []),
      customNiches: safeParseJSON(response.data.customNiches, []),
      customTools: safeParseJSON(response.data.customTools, []),
      targetAudience: isJsonString(response.data.targetAudience) 
        ? safeParseJSON(response.data.targetAudience, []) 
        : response.data.targetAudience || '',
      sessionDuration: parseInt(response.data.sessionDuration) || 60,
      baseSessionPrice: parseFloat(response.data.baseSessionPrice) || 0,
      tools: Array.isArray(response.data.tools) ? response.data.tools : []
    };
    
    console.log('Perfil processado e ferramentas:', {
      ...therapist,
      toolCount: therapist.tools.length,
      tools: therapist.tools
    });
    
    return therapist;
  } catch (error) {
    console.error('Erro ao buscar terapeuta por ID:', error);
    throw error;
  }
};

// Criar um novo perfil de terapeuta
export const createTherapistProfile = async (profileData) => {
  try {
    console.log('Enviando criação para o backend:', profileData);
    const response = await api.post('/api/therapists', profileData);
    console.log('Resposta da criação:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    throw error;
  }
};

// Atualizar o perfil de terapeuta
export const updateTherapistProfile = async (therapistId, profileData) => {
  try {
    console.log('Enviando atualização para o backend:', profileData);
    const response = await api.put(`/api/therapists/${therapistId}`, profileData);
    console.log('Resposta da atualização:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};

// Obter disponibilidade do terapeuta
export const getTherapistAvailability = async (therapistId) => {
  const response = await api.get(`/api/therapists/${therapistId}/availability`);
  return response.data;
};

// Atualizar disponibilidade do terapeuta
export const updateTherapistAvailability = async (therapistId, availabilityData) => {
  const response = await api.post(`/api/therapists/${therapistId}/availability`, { availability: availabilityData });
  return response.data;
};

// Buscar todos os terapeutas (para diretório público)
export const getAllTherapists = async (filters = {}) => {
  try {
    console.log('Iniciando busca de terapeutas com filtros:', filters);
    const {
      attendanceMode,
      maxPrice,
      minPrice,
      offersFreeSession,
      searchTerm
    } = filters;

    // Construir query params
    const params = new URLSearchParams();
    
    if (attendanceMode && attendanceMode !== 'ALL') {
      params.append('attendanceMode', attendanceMode);
    }
    
    if (maxPrice) {
      params.append('maxPrice', maxPrice.toString());
    }
    
    if (minPrice) {
      params.append('minPrice', minPrice.toString());
    }
    
    if (offersFreeSession) {
      params.append('offersFreeSession', 'true');
    }
    
    if (searchTerm) {
      params.append('searchTerm', searchTerm);
    }

    console.log('Parâmetros construídos:', params.toString());
    const response = await api.get('/api/therapists', { params });
    console.log('Resposta recebida:', response.data);
    
    if (!Array.isArray(response.data)) {
      console.error('Resposta inválida da API:', response.data);
      throw new Error('Formato de resposta inválido');
    }

    return response.data.map(therapist => {
      try {
        return {
          ...therapist,
          niches: safeParseJSON(therapist.niches, []),
          customNiches: safeParseJSON(therapist.customNiches, []),
          targetAudience: isJsonString(therapist.targetAudience) 
            ? safeParseJSON(therapist.targetAudience, []) 
            : therapist.targetAudience || '',
          servicePrices: safeParseJSON(therapist.servicePrices, []),
          baseSessionPrice: parseFloat(therapist.baseSessionPrice) || 0,
          rating: parseFloat(therapist.rating) || 0,
          reviewCount: parseInt(therapist.reviewCount) || 0,
          sessionDuration: parseInt(therapist.sessionDuration) || 60,
          freeSessionDuration: parseInt(therapist.freeSessionDuration) || 0
        };
      } catch (error) {
        console.warn('Erro ao processar terapeuta:', error);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Erro detalhado ao buscar terapeutas:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params
      }
    });
    
    if (error.response?.status === 500) {
      throw new Error('Erro interno do servidor. Por favor, tente novamente mais tarde.');
    }
    throw error;
  }
};

// Função auxiliar para fazer parse seguro de JSON
function safeParseJSON(value, defaultValue) {
  if (!value) return defaultValue;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    console.warn('Erro ao fazer parse de JSON:', error);
    return defaultValue;
  }
}

// Função para verificar se uma string é um JSON válido
function isJsonString(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Enviar a foto de perfil (upload de arquivo)
export const uploadProfilePicture = async (therapistId, formData) => {
  if (!formData.get('profilePicture')) {
    throw new Error('Nenhuma imagem enviada');
  }
  
  try {
    console.log('Enviando imagem para:', `/api/therapists/${therapistId}/upload-picture`);
    console.log('Conteúdo do FormData:', formData.get('profilePicture'));
    
    const response = await api.post(`/api/therapists/${therapistId}/upload-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Converter a URL relativa para URL completa
    if (response.data && response.data.profilePicture) {
      response.data.profilePicture = getFullImageUrl(response.data.profilePicture);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erro detalhado no upload:', error);
    
    // Verificar se é um erro relacionado ao tamanho do arquivo
    if (error.response && error.response.status === 413) {
      throw new Error('A imagem é muito grande. O tamanho máximo permitido é 10MB.');
    }
    
    // Verificar se é um erro de tipo de arquivo
    if (error.response && error.response.data && error.response.data.message && 
        error.response.data.message.includes('Formato de arquivo não suportado')) {
      throw new Error('Formato de arquivo não suportado. Envie apenas imagens (JPEG, PNG, JPG, GIF).');
    }
    
    // Erro genérico de upload
    throw new Error(error.response?.data?.message || 'Erro ao fazer upload da imagem. Por favor, tente novamente.');
  }
}; 