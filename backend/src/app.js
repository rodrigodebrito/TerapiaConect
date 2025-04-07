import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

// Importar controladores diretamente
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Configuração de caminhos para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rotas serão registradas diretamente
const prisma = new PrismaClient();
const app = express();

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar OpenAI se a chave de API estiver disponível
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI configurada com sucesso');
} else {
  console.log('Chave da API OpenAI não encontrada');
}

// Middleware para CORS (Cross-Origin Resource Sharing)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://terapia-conect-frontend.vercel.app',
  'https://terapiaconect.vercel.app',
  'https://terapiaconect.com.br',
  'https://theraconnect.com.br'
];

// Configuração unificada de CORS - permitindo origens específicas em produção
app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitações sem origem (como aplicativos móveis ou curl)
    if (!origin) return callback(null, true);
    
    // Permitir origens da lista
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      // Para desenvolvimento, permitir qualquer origem
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      console.log(`Origem bloqueada: ${origin}`);
      return callback(null, true); // Temporariamente permitir todas as origens
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Adicionar headers para garantir compatibilidade
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Log para debug
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware para logs de requisições HTTP
app.use(morgan('dev'));

// Cookie parser
app.use(cookieParser());

// Middleware para debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
  next();
});

// Configurar pasta de uploads para ser acessível publicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// =================== REGISTRO DE ROTAS DIRETO NO APP ===================

// -------- Rotas de Autenticação (auth.routes) --------
// Middleware de autenticação
const authMiddleware = require('./middleware/auth.middleware.cjs');
// Controllers
const authController = require('./controllers/auth.controller.js');

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authController.login(req, res);
    return result;
  } catch (error) {
    console.error('Erro na rota /api/auth/login:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.post('/api/auth/refresh-token', async (req, res) => {
  try {
    const result = await authController.refreshToken(req, res);
    return result;
  } catch (error) {
    console.error('Erro na rota /api/auth/refresh-token:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const result = await authController.logout(req, res);
    return result;
  } catch (error) {
    console.error('Erro na rota /api/auth/logout:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// -------- Rotas de Usuário (user.routes) --------
const userController = require('./controllers/user.controller.js');

// Rota para criar um novo usuário
app.post('/api/users', async (req, res) => {
  try {
    const result = await userController.createUser(req, res);
    return result;
  } catch (error) {
    console.error('Erro na rota /api/users:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota para buscar usuário por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await userController.getUserById(req, res);
    return result;
  } catch (error) {
    console.error(`Erro na rota /api/users/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rotas protegidas com autenticação
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const result = await userController.getCurrentUser(req, res);
    return result;
  } catch (error) {
    console.error('Erro na rota /api/users/me:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// -------- Rotas de Terapeuta (therapist.routes) --------
const therapistController = require('./controllers/therapist.controller.js');

// Buscar todos os terapeutas
app.get('/api/therapists', async (req, res) => {
  try {
    const result = await therapistController.getAllTherapists(req, res);
    return result;
  } catch (error) {
    console.error('Erro na rota /api/therapists:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Buscar terapeuta por ID
app.get('/api/therapists/:id', async (req, res) => {
  try {
    const result = await therapistController.getTherapistById(req, res);
    return result;
  } catch (error) {
    console.error(`Erro na rota /api/therapists/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Buscar todos os terapeutas aprovados
app.get('/api/approved-therapists', async (req, res) => {
  try {
    const result = await therapistController.getApprovedTherapists(req, res);
    return result;
  } catch (error) {
    console.error('Erro na rota /api/approved-therapists:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Buscar usuário por ID (para perfil de terapeuta)
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        therapist: {
          include: {
            specialty: true,
            approach: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(`Erro na rota /api/user/${req.params.userId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// -------- Rotas de Teste (sempre funcionarão) --------
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'API funcionando - rota de teste fixa',
    success: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test/:id', (req, res) => {
  res.status(200).json({
    message: 'API funcionando - rota com parâmetro fixa',
    id: req.params.id,
    success: true,
    timestamp: new Date().toISOString()
  });
});

// ROTA PARA LISTAR TODAS AS ROTAS REGISTRADAS
app.get('/api/routes', (req, res) => {
  const registeredRoutes = [];
  
  // Extrair rotas do aplicativo principal
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Rotas diretamente no app
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());
      
      registeredRoutes.push({
        path,
        methods,
        type: 'app_route'
      });
    } else if (middleware.name === 'router') {
      // Rotas em sub-routers
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          const basePath = middleware.regexp.toString().includes('/api') ? '/api' : '';
          const fullPath = `${basePath}${path}`;
          
          const methods = Object.keys(handler.route.methods)
            .filter(method => handler.route.methods[method])
            .map(method => method.toUpperCase());
          
          registeredRoutes.push({
            path: fullPath,
            methods,
            type: 'router_route'
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    count: registeredRoutes.length,
    routes: registeredRoutes
  });
});

// Rota padrão da API
app.get('/', (req, res) => {
  res.json({
    name: 'TerapiaConect API',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Rota de fallback (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.originalUrl}`
  });
});

// Adicionar o OpenAI como propriedade global do app para uso nos controladores
app.locals.openai = openai;
app.locals.prisma = prisma;

console.log(`📊 Rotas registradas manualmente (${app._router.stack.filter(m => m.route).length} rotas diretas)`);

export default app; 