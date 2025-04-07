import api from './api';
import { getFullImageUrl } from '../utils/constants';

// Obter o perfil de terapeuta pelo ID do usuário
export const getTherapistByUserId = async (userId) => {
  try {
    console.log(`Buscando terapeuta para o usuário com ID: ${userId}`);
    
    // Garantir que a rota não tenha /api/ duplicado
    const response = await api.get(`/api/therapists/user/${userId}`);
    
    console.log('Resposta do perfil de terapeuta por userId:', response.data);
    
    if (!response.data) {
      console.warn('Resposta vazia ao buscar perfil de terapeuta');
      return null;
    }
    
    // Verificar se há um objeto data na resposta (novo formato)
    if (response.data.success && response.data.data) {
      const therapistData = response.data.data;
      console.log('Resposta do perfil de terapeuta:', therapistData);
      return therapistData;
    }
    
    // Formato antigo (direto)
    if (response.data.id) {
      console.log('Resposta do perfil de terapeuta (formato antigo):', response.data);
      return response.data;
    }
    
    // Se chegou aqui, não encontrou dados válidos
    console.warn('O usuário não tem um perfil de terapeuta associado');
    return null;
  } catch (error) {
    // Se for erro 404, significa que não existe perfil de terapeuta para este usuário
    if (error.response && error.response.status === 404) {
      console.log('Perfil de terapeuta não encontrado para este usuário');
      
      // Log adicional para depuração
      console.log('Detalhes do erro 404:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`
      });
      
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
    
    // Verificar se a resposta está no novo formato com success e data
    let therapistData = response.data;
    if (response.data && response.data.success === true && response.data.data) {
      therapistData = response.data.data;
      console.log('Dados extraídos do formato success/data:', therapistData);
    }
    
    console.log('Dados do terapeuta para processamento:', therapistData);
    
    // Se não temos dados, retornar objeto vazio com arrays padrão
    if (!therapistData) {
      console.warn('Dados do terapeuta não encontrados');
      return {
        tools: [],
        customTools: [],
        niches: [],
        customNiches: []
      };
    }
    
    // Garantir que tools sempre seja um array válido
    let tools = [];
    
    if (therapistData.tools === null || therapistData.tools === undefined) {
      console.log('tools não definido, usando array vazio');
    } else if (Array.isArray(therapistData.tools)) {
      tools = therapistData.tools.filter(t => t !== null && t !== undefined);
      console.log(`tools é um array com ${tools.length} itens`);
    } else if (typeof therapistData.tools === 'string') {
      try {
        // Verificar se é um JSON válido
        if (isJsonString(therapistData.tools)) {
          tools = JSON.parse(therapistData.tools);
          console.log('tools convertido de string JSON para array:', tools);
        } else {
          console.warn('tools é uma string não-JSON:', therapistData.tools);
          tools = [];
        }
      } catch (e) {
        console.error('Erro ao converter tools de string para array:', e);
        tools = [];
      }
    } else if (typeof therapistData.tools === 'object') {
      // Se for um objeto mas não um array, converter para array
      console.warn('tools é um objeto não-array, tentando converter:', therapistData.tools);
      try {
        tools = Object.values(therapistData.tools).filter(t => t !== null && t !== undefined);
      } catch (e) {
        console.error('Erro ao converter tools objeto para array:', e);
        tools = [];
      }
    }
    
    // Garantir que customTools sempre seja um array válido
    let customTools = [];
    
    if (therapistData.customTools === null || therapistData.customTools === undefined) {
      console.log('customTools não definido, usando array vazio');
    } else if (Array.isArray(therapistData.customTools)) {
      customTools = therapistData.customTools.filter(t => t !== null && t !== undefined);
      console.log(`customTools é um array com ${customTools.length} itens`);
    } else if (typeof therapistData.customTools === 'string') {
      try {
        // Verificar se é um JSON válido
        if (isJsonString(therapistData.customTools)) {
          customTools = JSON.parse(therapistData.customTools);
          console.log('customTools convertido de string JSON para array:', customTools);
        } else {
          console.warn('customTools é uma string não-JSON:', therapistData.customTools);
          customTools = [];
        }
      } catch (e) {
        console.error('Erro ao converter customTools de string para array:', e);
        customTools = [];
      }
    } else if (typeof therapistData.customTools === 'object') {
      // Se for um objeto mas não um array, converter para array
      console.warn('customTools é um objeto não-array, tentando converter:', therapistData.customTools);
      try {
        customTools = Object.values(therapistData.customTools).filter(t => t !== null && t !== undefined);
      } catch (e) {
        console.error('Erro ao converter customTools objeto para array:', e);
        customTools = [];
      }
    }
    
    // Assegurar que os campos JSON são corretamente processados
    const therapist = {
      ...therapistData,
      niches: safeParseJSON(therapistData.niches, []),
      customNiches: safeParseJSON(therapistData.customNiches, []),
      customTools,
      targetAudience: isJsonString(therapistData.targetAudience) 
        ? safeParseJSON(therapistData.targetAudience, []) 
        : therapistData.targetAudience || '',
      sessionDuration: parseInt(therapistData.sessionDuration) || 60,
      baseSessionPrice: parseFloat(therapistData.baseSessionPrice) || 0,
      tools
    };
    
    console.log('Ferramentas do terapeuta:', therapist.tools);
    console.log('Ferramentas customizadas do terapeuta:', therapist.customTools);
    console.log('Perfil processado:', therapist);
    
    return therapist;
  } catch (error) {
    console.error('Erro ao buscar terapeuta por ID:', error);
    // Em caso de erro, retornar objeto vazio com arrays
    return {
      tools: [],
      customTools: [],
      niches: [],
      customNiches: [],
      error: error.message
    };
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
  try {
    console.log(`Buscando disponibilidade para terapeuta ID: ${therapistId}`);
    const response = await api.get(`/api/therapists/${therapistId}/availability`);
    console.log('Resposta da API de disponibilidade:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    throw error;
  }
};

// Atualizar disponibilidade do terapeuta
export const updateTherapistAvailability = async (therapistId, availabilityData) => {
  try {
    console.log(`Atualizando disponibilidade para terapeuta ID: ${therapistId}`);
    const response = await api.post(`/api/therapists/${therapistId}/availability`, { availability: availabilityData });
    console.log('Resposta da API de atualização de disponibilidade:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    throw error;
  }
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
    
    // Verificar se a resposta está no novo formato (success/data)
    let therapistsData = [];
    if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
      therapistsData = response.data.data;
      console.log('Dados de terapeutas extraídos do formato success/data:', therapistsData.length);
    } 
    // Formato antigo (array direto)
    else if (Array.isArray(response.data)) {
      therapistsData = response.data;
      console.log('Dados de terapeutas no formato antigo (array direto):', therapistsData.length);
    }
    else {
      console.error('Resposta inválida da API:', response.data);
      throw new Error('Formato de resposta inválido');
    }

    return therapistsData.map(therapist => {
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
  
  // Se já for um objeto (não string), retorna diretamente
  if (typeof value !== 'string') return value;
  
  try {
    // Verifica se a string parece um JSON válido antes de tentar parsear
    // Um JSON válido começa com { (objeto) ou [ (array)
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      console.warn(`JSON inválido detectado: "${value.substring(0, 20)}..." não começa com { ou [, usando valor original`);
      return value;
    }
    
    return JSON.parse(value);
  } catch (error) {
    console.warn(`Erro ao fazer parse de JSON: ${error.message}, usando valor padrão`);
    return defaultValue;
  }
}

// Função melhorada para verificar se uma string é um JSON válido
function isJsonString(str) {
  if (!str || typeof str !== 'string') return false;
  
  // Verificação rápida: um JSON válido deve começar com { ou [
  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false;
  }
  
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

// Atualizar apenas as ferramentas do terapeuta
export const updateTherapistTools = async (therapistId, tools) => {
  try {
    console.log('Atualizando ferramentas do terapeuta:', therapistId);
    console.log('Ferramentas para atualização:', tools);
    
    const response = await api.put(`/api/therapists/${therapistId}/tools`, { tools });
    
    console.log('Resposta da atualização de ferramentas:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar ferramentas do terapeuta:', error);
    throw error;
  }
}; 