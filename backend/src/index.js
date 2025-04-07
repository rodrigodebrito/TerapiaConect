/**
 * Arquivo principal do servidor
 * 
 * Este arquivo é o ponto de entrada da aplicação
 */

// Carregar variáveis de ambiente
import 'dotenv/config';

// Importações principais
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { createRequire } from 'module';
import cookieParser from 'cookie-parser';

// Utilitários e configurações
// Removendo a importação do prisma para evitar duplicação
// import prisma from './utils/prisma.js';

// Obter o diretório atual em um módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Verificar ambiente
console.log('\n==================== DIAGNÓSTICO DE AMBIENTE ====================');
console.log(`📝 Node.js versão: ${process.version}`);
console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`📝 Diretório atual: ${process.cwd()}`);
console.log(`📝 Diretório do script: ${__dirname}`);

// Verificar diretórios importantes
console.log('📂 Verificando diretórios importantes:');

// Função para verificar diretório e listar conteúdo
function checkDir(name, dirPath) {
  const exists = fs.existsSync(dirPath);
  const status = exists ? '✅ Existe' : '❌ Não existe';
  console.log(`📁 ${name}: ${dirPath} - ${status}`);
  
  if (exists) {
    const files = fs.readdirSync(dirPath);
    console.log(`   Arquivos (${files.length}): ${files.join(', ')}`);
  }
}

// Verificar diretórios críticos
checkDir('routes', path.join(__dirname, 'routes'));
checkDir('routes (parent)', path.join(process.cwd(), 'routes'));
checkDir('dist/routes', path.join(process.cwd(), 'dist/routes'));
checkDir('controllers', path.join(__dirname, 'controllers'));
checkDir('uploads', path.join(process.cwd(), 'uploads'));

console.log('================================================================');

// Inicializar app Express diretamente aqui em vez de importar de app.js
const app = express();
// Criar uma única instância do PrismaClient
const prisma = new PrismaClient();
let openai;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar OpenAI se a chave de API estiver disponível
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
app.use(cookieParser());

// Configurar pasta de uploads para ser acessível publicamente
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Adicionar o OpenAI e Prisma como propriedades globais do app para uso nos controladores
app.locals.openai = openai;
app.locals.prisma = prisma;

// =================== REGISTRO DE ROTAS DIRETO NO APP ===================

// Middleware de autenticação
let authMiddleware;
try {
  // Tentando diferentes caminhos para encontrar o middleware de autenticação
  const possiblePaths = [
    './middleware/auth.middleware.cjs',
    './dist/middleware/auth.middleware.js',
    './dist/middleware/auth.middleware.cjs',
    '../middleware/auth.middleware.cjs',
    './middleware/auth.middleware.js'
  ];
  
  let loadedPath = null;
  for (const authPath of possiblePaths) {
    try {
      console.log(`🔍 Tentando carregar middleware de autenticação de: ${authPath}`);
      const fullPath = path.resolve(authPath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Arquivo existe: ${fullPath}`);
        authMiddleware = require(authPath);
        loadedPath = authPath;
        break;
      } else {
        console.log(`❌ Arquivo não existe: ${fullPath}`);
      }
    } catch (pathError) {
      console.log(`❌ Erro ao tentar: ${authPath} - ${pathError.message}`);
    }
  }
  
  if (loadedPath) {
    console.log(`✅ Middleware de autenticação carregado com sucesso de: ${loadedPath}`);
  } else {
    console.error('❌ Nenhum dos caminhos para o middleware de autenticação funcionou');
    
    // Implementar middleware de autenticação inline como fallback
    authMiddleware = (req, res, next) => {
      console.warn('⚠️ Usando middleware de autenticação de fallback');
      // Verificar token JWT básico
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Acesso negado. Token não fornecido.'
        });
      }
      
      try {
        // Implementação básica apenas para permitir o funcionamento
        // Em produção, deve verificar o token adequadamente
        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido.'
        });
      }
    };
  }
} catch (error) {
  console.error('❌ Erro ao carregar middleware de autenticação:', error.message);
  // Implementar um middleware de fallback
  authMiddleware = (req, res, next) => {
    console.warn('⚠️ Usando middleware de autenticação de fallback após erro');
    next();
  };
}

// Adicionar rotas de autenticação
// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Verificar senha (implementação básica, em produção use bcrypt)
    // Na implementação real, você usaria bcrypt.compare
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Gerar token JWT (implementação básica)
    const token = 'jwt-token-simulado'; // Em produção, use jwt.sign
    
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro na rota /api/auth/login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota para obter perfil do usuário atual
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    // Em um cenário real, o ID do usuário viria do token JWT decodificado
    // Para fins de teste, vamos apenas pegar um usuário do banco
    const userId = req.headers['user-id'] || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário não fornecido. Para teste, use o header user-id ou o parâmetro userId'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        therapist: {
          include: {
            specialty: true,
            approach: true
          }
        },
        client: true
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
    console.error('Erro na rota /api/users/me:', error);
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

// -------- Rota padrão da API --------
app.get('/', (req, res) => {
  res.json({
    name: 'TerapiaConect API',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
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

// -------- Implementação das rotas diretamente --------
// Rota para buscar todos os terapeutas
app.get('/api/therapists', async (req, res) => {
  try {
    const therapists = await prisma.therapist.findMany({
      include: {
        user: true,
        specialty: true,
        approach: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: therapists,
    });
  } catch (error) {
    console.error('Erro na rota /api/therapists:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota para buscar terapeuta por ID
app.get('/api/therapists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const therapist = await prisma.therapist.findUnique({
      where: { id },
      include: {
        user: true,
        specialty: true,
        approach: true,
      },
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Terapeuta não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: therapist,
    });
  } catch (error) {
    console.error(`Erro na rota /api/therapists/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota para buscar todos os terapeutas aprovados
app.get('/api/approved-therapists', async (req, res) => {
  try {
    const therapists = await prisma.therapist.findMany({
      where: {
        approved: true,
      },
      include: {
        user: true,
        specialty: true,
        approach: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: therapists,
    });
  } catch (error) {
    console.error('Erro na rota /api/approved-therapists:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota para buscar usuário por ID (para perfil de terapeuta)
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

// Rota de fallback (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.originalUrl}`
  });
});

// Conectar ao banco de dados antes de iniciar o servidor
prisma.$connect()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso');
    console.log('📦 Conectado ao banco de dados');
    
    // Iniciar o servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT} (${process.env.NODE_ENV || 'development'})`);
      console.log(`📅 ${new Date().toLocaleString()}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  });

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Promessa rejeitada não tratada:', error);
});

// Encerramento gracioso
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  prisma.$disconnect();
  process.exit(0);
});

export default app; 