import axios from 'axios';

// Verificar explicitamente se estamos no ambiente Vercel
const isVercel = typeof window !== 'undefined' && 
                window.location.hostname.includes('vercel.app');

// Configurações do baseURL, dependendo do ambiente
const baseURL = isVercel 
  ? 'https://terapiaconect.onrender.com/api'
  : (process.env.NODE_ENV === 'production'
     ? (process.env.REACT_APP_API_URL || '/api')
     : 'http://localhost:3000/api');

console.log('Services API Base URL:', baseURL, 'Is Vercel:', isVercel);

// Criar uma instância do axios com configuração básica
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autorização em todas requisições
api.interceptors.request.use(
  (config) => {
    // Verificar e corrigir formatação da URL
    const isUrlStartingWithSlash = config.url.startsWith('/');
    
    // Construir URL completa para logging
    let fullUrl = '';
    if (config.baseURL.endsWith('/api') && isUrlStartingWithSlash) {
      // Remover possível duplicação de /api/ no início da URL
      if (config.url.startsWith('/api/')) {
        config.url = config.url.substring(4); // Remove o /api/ duplicado
        fullUrl = `${config.baseURL}${config.url}`;
        console.log(`URL corrigida para evitar duplicação: ${fullUrl}`);
      } else {
        fullUrl = `${config.baseURL}${config.url}`;
      }
    } else {
      fullUrl = `${config.baseURL}${config.url}`;
    }
    
    console.log(`Enviando requisição para: ${config.method} ${fullUrl}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros nas respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log detalhado do erro
    console.error('Erro na API:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Verificar se o erro é de autenticação (401)
    if (error.response && error.response.status === 401) {
      // Remover token inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Verificar se estamos em uma rota administrativa
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      
      // Redirecionar para a página de login apropriada
      if (isAdminRoute) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    
    // Verificar se é erro 404 ou 500 (para API específicas que não são críticas)
    if (error.response && (error.response.status === 404 || error.response.status === 500)) {
      // Verificar se a URL da API está em uma lista de bypass (APIs opcionais)
      const bypassAPIs = ['/api/suggestions', '/api/analyze', '/api/report'];
      const requestUrl = error.config.url;
      
      if (bypassAPIs.some(api => requestUrl.includes(api))) {
        console.log(`Erro 404/500, verificando se é uma API que tem bypass: ${requestUrl}`);
        // Retornar um erro amigável que pode ser tratado pelo cliente
        return Promise.resolve({
          data: {
            error: 'service_unavailable',
            message: 'Serviço temporariamente indisponível'
          }
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 