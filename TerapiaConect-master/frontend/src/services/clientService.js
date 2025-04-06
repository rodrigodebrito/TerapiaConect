import api from './api';

// Obter o perfil do cliente pelo ID do usuário
export const getClientByUserId = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Retorna null se o cliente não for encontrado
    }
    throw error;
  }
};

// Obter o perfil do cliente pelo ID do cliente
export const getClientById = async (clientId) => {
  try {
    const response = await api.get(`/clients/${clientId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Criar ou atualizar o perfil do cliente
export const createClientProfile = async (profileData) => {
  try {
    if (!profileData.userId) {
      throw new Error('userId é obrigatório');
    }
    const { userId, ...data } = profileData;
    console.log('Criando perfil para userId:', userId, 'com dados:', data);
    const response = await api.post(`/users/${userId}/profile`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    throw error;
  }
};

// Atualizar o perfil do cliente
export const updateClientProfile = async (userId, profileData) => {
  try {
    const response = await api.put(`/users/${userId}/profile`, profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to get full image URL
const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // O backend está rodando na porta 3000
  const baseUrl = window.location.origin.replace('3001', '3000');
  
  // Garantir que o caminho comece com /
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${formattedPath}`;
};

// Enviar a foto de perfil (upload de arquivo)
export const uploadProfilePicture = async (userId, formData) => {
  try {
    console.log('Iniciando upload da imagem para o usuário:', userId);
    
    if (!formData.get('profilePicture')) {
      throw new Error('Nenhuma imagem enviada');
    }

    // Preservar o token de autenticação antes da requisição
    const token = localStorage.getItem('token');
    
    const response = await api.post(`/users/${userId}/upload-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}` // Garantir que o token é enviado
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Progresso do upload:', percentCompleted + '%');
      },
    });

    console.log('Resposta completa do servidor após upload:', response);
    console.log('Resposta do servidor após upload:', response.data);

    if (!response.data || !response.data.url) {
      throw new Error('Resposta inválida do servidor: URL da imagem não encontrada');
    }

    // Garantir que o token permanece no localStorage após a resposta
    if (token && !localStorage.getItem('token')) {
      localStorage.setItem('token', token);
    }

    // Converter a URL relativa para URL completa
    const imageUrl = getFullImageUrl(response.data.url);
    console.log('URL da imagem recebida do servidor:', imageUrl);

    return {
      ...response.data,
      url: imageUrl
    };
  } catch (error) {
    console.error('Erro detalhado no upload:', error);
    throw error;
  }
}; 