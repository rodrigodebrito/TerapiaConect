import axios from 'axios';

// Configurações do baseURL, dependendo do ambiente
const baseURL = process.env.NODE_ENV === 'production'
  ? (process.env.REACT_APP_API_URL || '/api')
  : 'http://localhost:3000/api';

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
    console.log(`Enviando requisição para: ${config.baseURL}${config.url}`);
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