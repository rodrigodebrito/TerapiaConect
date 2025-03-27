import axios from 'axios';

// Cria uma instância do axios com a URL base da API
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
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
      console.log(`Enviando token de autenticação para: ${config.url}`);
    } else {
      console.warn(`Requisição sem token de autenticação para: ${config.url}`);
    }
    console.log(`Enviando requisição para: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error(`Erro no interceptador de requisição: ${error.message}`);
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
  async (error) => {
    // Se for erro 401 (não autorizado) e não for na rota de login, 
    // pode ser token expirado - tentar renovar e repetir
    if (error.response && error.response.status === 401 && 
        !error.config.url.includes('/auth/login')) {
      try {
        // Tentar renovar o token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', { refreshToken });
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            
            // Refazer a requisição original com o novo token
            error.config.headers.Authorization = `Bearer ${response.data.token}`;
            return api(error.config);
          }
        }
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
        // Se falhar, deslogar o usuário
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Redirecionar para login se estiver no navegador
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // Se for erro 404 ou 500, tentar rotas de bypass para APIs essenciais
    if (error.response && (error.response.status === 404 || error.response.status === 500)) {
      console.log('Erro 404/500, verificando se é uma API que tem bypass:', error.config.url);
      
      // Verificar se é uma requisição para criação de appointment
      if (error.config.method === 'post' && error.config.url.includes('/appointments')) {
        console.log('Detectada tentativa de criar agendamento. Tentando usar rota de bypass...');
        try {
          // Recriar a requisição para a rota de bypass
          const bypassUrl = '/appointments/bypass';
          const bypassResponse = await api.post(bypassUrl, error.config.data);
          console.log('Resposta do bypass de agendamento:', bypassResponse);
          return bypassResponse;
        } catch (bypassError) {
          console.error('Erro também no bypass de agendamento:', bypassError);
        }
      }
      
      // Verificar se é uma requisição para criação de sessão
      if (error.config.method === 'post' && error.config.url.includes('/sessions')) {
        console.log('Detectada tentativa de criar sessão. Tentando usar rota de bypass...');
        try {
          // Recriar a requisição para a rota de bypass
          const bypassUrl = '/sessions/bypass';
          const bypassResponse = await api.post(bypassUrl, error.config.data);
          console.log('Resposta do bypass de sessão:', bypassResponse);
          return bypassResponse;
        } catch (bypassError) {
          console.error('Erro também no bypass de sessão:', bypassError);
        }
      }
      
      // Verificar se é uma requisição para IA
      if (error.config.method === 'post' && error.config.url.includes('/ai/')) {
        console.log('Detectada tentativa de acessar IA. Tentando usar modo local...');
        try {
          // Extrair a parte após /ai/
          const parts = error.config.url.split('/ai/');
          if (parts.length > 1) {
            const aiEndpoint = parts[1]; 
            const bypassUrl = `/ai/${aiEndpoint}/local`;
            console.log(`Tentando acessar endpoint local para IA: ${bypassUrl}`);
            
            const bypassResponse = await api.post(bypassUrl, error.config.data);
            console.log('Resposta do modo local de IA:', bypassResponse);
            return bypassResponse;
          }
        } catch (bypassError) {
          console.error('Erro também no modo local de IA:', bypassError);
        }
      }
    }
    
    // Se chegou aqui, propagar o erro
    return Promise.reject(error);
  }
);

export default api; 