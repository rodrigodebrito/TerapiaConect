import axios from 'axios';

// Criar instância do axios com configuração base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log de erros
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interceptador para incluir token de autenticação se disponível
// e adicionar prefixo /api a todas as URLs que não o tenham
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Adicionar prefixo /api a todas as URLs
  if (config.url && !config.url.startsWith('/api')) {
    config.url = `/api${config.url}`;
  }
  
  return config;
});

export default api; 