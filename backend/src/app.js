import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

// Configuração de caminhos para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rotas serão carregadas dinamicamente com tratamento de erro
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

// Registrar as rotas - carregando arquivos .cjs do diretório routes
console.log('\nCarregando rotas da API:');

// Função para carregar um router usando require (para arquivos .cjs)
function loadCjsRouter(routePath) {
  try {
    // Na produção, os arquivos estão em dist
    const isProduction = process.env.NODE_ENV === 'production';
    let fullPath;
    
    if (isProduction) {
      fullPath = path.join(__dirname, routePath);
    } else {
      fullPath = path.join(__dirname, routePath);
    }
    
    // Verificar se o arquivo existe antes de tentar carregá-lo
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Arquivo não encontrado: ${fullPath}`);
      return null;
    }
    
    // Usando require dinâmico (CommonJS)
    let router;
    try {
      router = require(fullPath);
      
      // Verificar se router é um objeto (pode ser o caso de module.exports = router)
      if (typeof router === 'object' && router.default) {
        router = router.default;
      }
      
      return router;
    } catch (error) {
      console.error(`❌ Erro ao carregar ${routePath}:`, error.message);
      
      // Tentar alternativa sem a extensão .cjs
      const alternativePath = fullPath.replace('.cjs', '');
      if (fs.existsSync(alternativePath)) {
        try {
          router = require(alternativePath);
          if (typeof router === 'object' && router.default) {
            router = router.default;
          }
          return router;
        } catch (err) {
          console.error(`❌ Também falhou ao carregar alternativa ${alternativePath}:`, err.message);
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${routePath}:`, error.message);
    return null;
  }
}

// Mapeamento de rotas para seus arquivos
const routes = [
  { path: '/api/auth', file: './routes/auth.routes.cjs' },
  { path: '/api/users', file: './routes/user.route.cjs' },
  { path: '/api/admin', file: './routes/admin.route.cjs' },
  { path: '/api/therapists', file: './routes/therapist.route.cjs' },
  { path: '/api/clients', file: './routes/client.route.cjs' },
  { path: '/api/subscriptions', file: './routes/subscription.route.cjs' },
  { path: '/api/sessions', file: './routes/session.route.cjs' },
  { path: '/api/meeting', file: './routes/meeting.routes.cjs' },
  { path: '/api/payments', file: './routes/payment.route.cjs' },
  { path: '/api/ai', file: './routes/ai.routes.cjs' },
  { path: '/api/embed', file: './routes/embedding.route.cjs' },
  { path: '/api/chat', file: './routes/chat.route.cjs' },
  { path: '/api/insights', file: './routes/insight.routes.cjs' },
  { path: '/api/training', file: './routes/training.routes.cjs' },
  { path: '/api/transcription', file: './routes/transcription.routes.cjs' },
  { path: '/api/upload', file: './routes/upload.routes.cjs' }
];

// Registrar cada rota
let routesRegistered = 0;
routes.forEach(route => {
  try {
    const router = loadCjsRouter(route.file);
    if (router) {
      app.use(route.path, router);
      console.log(`✅ Rota registrada: ${route.path}`);
      routesRegistered++;
    } else {
      console.log(`❌ Rota não carregada: ${route.path}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao registrar rota ${route.path}:`, error.message);
  }
});

console.log(`\n📊 Rotas registradas: ${routesRegistered}/${routes.length}`);

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

export default app; 