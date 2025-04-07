import axios from 'axios';
import config from '../environments';

// Verificar explicitamente se estamos em ambiente de produção (Vercel)
const isVercel = typeof window !== 'undefined' && 
                 window.location.hostname.includes('vercel.app');

// Forçar a URL completa do backend no Vercel
const baseURL = isVercel 
  ? 'https://terapiaconect.onrender.com/api'
  : (process.env.NODE_ENV === 'production' ? config.apiUrl : 'http://localhost:3000');

console.log('API Base URL:', baseURL, 'Is Vercel:', isVercel);

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
    
    // Log detalhado da requisição
    const fullUrl = config.baseURL ? 
      (config.baseURL.endsWith('/') && config.url.startsWith('/') 
        ? config.baseURL + config.url.substring(1) 
        : config.baseURL + config.url)
      : config.url;
    
    console.log('Requisição completa:', {
      método: config.method,
      url: fullUrl,
      baseURL: config.baseURL,
      urlPath: config.url
    });
    
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
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  response => response,
  error => {
    // Log detalhado do erro
    console.error('Erro na requisição:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
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
    console.error('Erro na requisição de upload:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
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