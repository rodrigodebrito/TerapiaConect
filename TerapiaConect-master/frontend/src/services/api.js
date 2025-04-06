import axios from 'axios';

// Cria uma instância do axios com a URL base da API
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepta todas as requisições para adicionar o token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`Enviando requisição para: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Rotas que não devem redirecionar automaticamente para o login
const noRedirectRoutes = [
  '/users/',
  '/upload-picture'
];

// Intercepta todas as respostas para tratar erros de autenticação
api.interceptors.response.use(
  (response) => {
    console.log(`Resposta recebida de: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    // Log detalhado do erro
    console.error(`Erro na requisição para: ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Verifica se é uma rota de upload ou atualização de perfil
    const isNoRedirectRoute = noRedirectRoutes.some(route => 
      error.config && error.config.url && error.config.url.includes(route)
    );

    // Se o erro for 401 (não autorizado) e NÃO for uma rota especial, limpa o localStorage e redireciona
    if (error.response && error.response.status === 401 && !isNoRedirectRoute) {
      console.log('Erro 401: Token inválido - Redirecionando para login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response && error.response.status === 401 && isNoRedirectRoute) {
      console.log('Erro 401 em rota especial, não redirecionando:', error.config.url);
    }
    
    return Promise.reject(error);
  }
);

export default api; 