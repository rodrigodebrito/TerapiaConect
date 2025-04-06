import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:3000';

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Para requisições que envolvem upload de arquivos, precisamos de um interceptor especial
export const uploadApi = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Adicionar prefixo /api a todas as URLs
    if (!config.url.startsWith('/api')) {
      config.url = `/api${config.url}`;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Mesmo interceptor para uploadApi
uploadApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Adicionar prefixo /api a todas as URLs
    if (!config.url.startsWith('/api')) {
      config.url = `/api${config.url}`;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Tratamento de erro 401 (não autorizado)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirecionar para login se necessário
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Mesmo tratamento para uploadApi
uploadApi.interceptors.response.use(
  response => response,
  error => {
    console.error('Upload API Error:', error.response?.data || error.message);
    
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 