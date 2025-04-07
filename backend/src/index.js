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
import bcrypt from 'bcryptjs';

// Utilitários e configurações
// Removendo a importação do prisma para evitar duplicação
// import prisma from './utils/prisma.js';

// Obter o diretório atual em um módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Função auxiliar para processar JSON com segurança
function safeParseJSON(jsonString, defaultValue) {
  if (!jsonString) return defaultValue;
  
  try {
    if (typeof jsonString === 'object') return jsonString;
    return JSON.parse(jsonString);
  } catch (e) {
    console.log(`Erro ao processar JSON: ${e.message}, usando valor original`);
    return jsonString;
  }
}

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
// Rota base de auth para testes
app.get('/api/auth', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API de autenticação está funcionando',
    endpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh-token',
      '/api/auth/logout'
    ]
  });
});

// Rota POST /api/auth
app.post('/api/auth', (req, res) => {
  console.log('POST /api/auth recebido - redirecionando para /api/auth/login');
  
  // Lógica inline de login
  try {
    const { email, password } = req.body;
    console.log(`👤 Tentativa de login para: ${email} (via /api/auth)`);
    console.log(`🔐 Senha fornecida: ${password ? '*'.repeat(password.length) : 'não fornecida'}`);
    
    // Verificar credenciais e retornar resposta
    prisma.user.findUnique({
      where: { email }
    }).then(async user => {
      if (!user) {
        console.log(`❌ Usuário não encontrado: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }
      
      console.log(`✅ Usuário encontrado: ${user.name} (${user.id})`);
      console.log(`🔑 Senha armazenada (hash): ${user.password ? user.password.substring(0, 15) + '...' : 'não definida'}`);
      
      // Verificação da senha com múltiplos métodos
      let senhaCorreta = false;
      
      // Verificar se estamos lidando com uma senha hashed
      if (user.password && user.password.startsWith('$2a$')) {
        try {
          console.log(`🔐 Detectado hash bcrypt, comparando...`);
          
          // Verificação de hash com bcrypt
          try {
            const bcryptResult = await bcrypt.compare(password, user.password);
            if (bcryptResult) {
              console.log(`✅ Verificação bcrypt: senha correta`);
              senhaCorreta = true;
            } else {
              console.log(`❌ Verificação bcrypt: senha incorreta`);
            }
          } catch (bcryptError) {
            console.error(`❌ Erro na verificação bcrypt:`, bcryptError.message);
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar senha com bcrypt:`, error.message);
        }
      } 
      // Método 1: Comparação exata para senhas não-hashed
      else if (password === user.password) {
        console.log(`✅ Senha corresponde exatamente`);
        senhaCorreta = true;
      }
      // Método 2: Comparação case-insensitive
      else if (password.toLowerCase() === (user.password || '').toLowerCase()) {
        console.log(`⚠️ Senha corresponde (case insensitive)`);
        senhaCorreta = true;
      }
      
      // Método 3: Modo de desenvolvimento 
      if (!senhaCorreta && process.env.NODE_ENV !== 'production') {
        // Em ambiente de desenvolvimento, aceitar qualquer senha se o email for correto
        console.log(`⚠️ MODO TESTE: Aceitando login em ambiente não-produção`);
        senhaCorreta = true;
      }
      
      if (!senhaCorreta) {
        console.log(`❌ Senha incorreta para: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
      }
      
      // Gerar token JWT (implementação básica)
      const token = 'jwt-token-simulado'; 
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }).catch(error => {
      console.error('Erro ao processar login:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    });
  } catch (error) {
    console.error('Erro na rota POST /api/auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Logging para debug
    console.log(`👤 Tentativa de login para: ${email}`);
    console.log(`🔐 Senha fornecida: ${password ? '*'.repeat(password.length) : 'não fornecida'}`);
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    console.log(`✅ Usuário encontrado: ${user.name} (${user.id})`);
    console.log(`🔑 Senha armazenada (hash): ${user.password ? user.password.substring(0, 15) + '...' : 'não definida'}`);
    
    // Verificação da senha com múltiplos métodos
    let senhaCorreta = false;
    
    // Verificar se estamos lidando com uma senha hashed
    if (user.password && user.password.startsWith('$2a$')) {
      try {
        console.log(`🔐 Detectado hash bcrypt, comparando...`);
        
        // Verificação de hash com bcrypt
        try {
          const bcryptResult = await bcrypt.compare(password, user.password);
          if (bcryptResult) {
            console.log(`✅ Verificação bcrypt: senha correta`);
            senhaCorreta = true;
          } else {
            console.log(`❌ Verificação bcrypt: senha incorreta`);
          }
        } catch (bcryptError) {
          console.error(`❌ Erro na verificação bcrypt:`, bcryptError.message);
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar senha com bcrypt:`, error.message);
      }
    } 
    // Método 1: Comparação exata para senhas não-hashed
    else if (password === user.password) {
      console.log(`✅ Senha corresponde exatamente`);
      senhaCorreta = true;
    }
    // Método 2: Comparação case-insensitive
    else if (password.toLowerCase() === (user.password || '').toLowerCase()) {
      console.log(`⚠️ Senha corresponde (case insensitive)`);
      senhaCorreta = true;
    }
    
    // Método 3: Modo de desenvolvimento 
    if (!senhaCorreta && process.env.NODE_ENV !== 'production') {
      // Em ambiente de desenvolvimento, aceitar qualquer senha se o email for correto
      console.log(`⚠️ MODO TESTE: Aceitando login em ambiente não-produção`);
      senhaCorreta = true;
    }
    
    if (!senhaCorreta) {
      console.log(`❌ Senha incorreta para: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    console.log(`✅ Login bem-sucedido para: ${email}`);
    
    // Gerar token JWT (implementação básica)
    const token = 'jwt-token-simulado'; // Em produção, use jwt.sign
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
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

// Rota de registro (simplificada)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'CLIENT' } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'E-mail já está em uso'
      });
    }
    
    // Criar novo usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // Em produção, use bcrypt.hash
        role
      }
    });
    
    // Gerar token JWT
    const token = 'jwt-token-simulado'; // Em produção, use jwt.sign
    
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro na rota /api/auth/register:', error);
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
        user: true
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
        user: true
      },
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Terapeuta não encontrado'
      });
    }
    
    // Processar campos JSON
    const processedTherapist = {
      ...therapist,
      niches: safeParseJSON(therapist.niches, []),
      customNiches: safeParseJSON(therapist.customNiches, []),
      customTools: safeParseJSON(therapist.customTools, []),
      targetAudience: safeParseJSON(therapist.targetAudience, therapist.targetAudience || '')
    };

    return res.status(200).json({
      success: true,
      data: processedTherapist,
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
        isApproved: true,
      },
      include: {
        user: true
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
        therapist: true
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

// Adicionar rota específica para terapeutas
app.get('/api/therapists/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`[Rota direta]: Buscando terapeuta para userId: ${userId}, solicitado por: ${req.user?.id || 'não autenticado'}`);
    
    const therapist = await prisma.therapist.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Terapeuta não encontrado'
      });
    }
    
    // Processar campos JSON
    const processedTherapist = {
      ...therapist,
      niches: safeParseJSON(therapist.niches, []),
      customNiches: safeParseJSON(therapist.customNiches, []),
      customTools: safeParseJSON(therapist.customTools, []),
      targetAudience: safeParseJSON(therapist.targetAudience, therapist.targetAudience || '')
    };
    
    return res.status(200).json({
      success: true,
      data: processedTherapist
    });
  } catch (error) {
    console.error('Erro ao buscar terapeuta por ID de usuário:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar dados do terapeuta',
      error: error.message
    });
  }
});

// Rota para atualizar perfil de terapeuta
app.put('/api/therapists/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body;
    
    console.log(`[Rota direta]: Atualizando perfil de terapeuta ID: ${id}`);
    console.log('Dados recebidos:', JSON.stringify(profileData, null, 2));
    
    // Verificar se o terapeuta existe
    const existingTherapist = await prisma.therapist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (!existingTherapist) {
      return res.status(404).json({
        success: false,
        message: 'Terapeuta não encontrado'
      });
    }
    
    // Preparar dados para atualização - extraindo apenas os campos que existem no modelo
    const {
      shortBio,
      niches,
      customNiches,
      tools,
      customTools,
      education,
      experience,
      targetAudience,
      differential,
      baseSessionPrice,
      sessionDuration,
      attendanceMode,
      city,
      state,
      offersFreeSession,
      freeSessionDuration
    } = profileData;
    
    // Atualizar o terapeuta no banco de dados com apenas os campos válidos
    const updatedTherapist = await prisma.therapist.update({
      where: { id },
      data: {
        shortBio,
        niches: typeof niches === 'object' ? JSON.stringify(niches) : niches,
        customNiches: typeof customNiches === 'object' ? JSON.stringify(customNiches) : customNiches,
        customTools: typeof customTools === 'object' ? JSON.stringify(customTools) : customTools,
        education,
        experience,
        targetAudience: typeof targetAudience === 'object' ? JSON.stringify(targetAudience) : targetAudience,
        differential,
        baseSessionPrice: parseFloat(baseSessionPrice) || 0,
        sessionDuration: parseInt(sessionDuration) || 60,
        attendanceMode,
        city,
        state,
        offersFreeSession: Boolean(offersFreeSession),
        freeSessionDuration: parseInt(freeSessionDuration) || 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Atualizar ferramentas (simplificado)
    console.log(`Ferramentas recebidas: ${tools ? tools.length : 0}`);
    
    // Processar campos JSON para garantir consistência com o formato do GET
    const processedTherapist = {
      ...updatedTherapist,
      niches: safeParseJSON(updatedTherapist.niches, []),
      customNiches: safeParseJSON(updatedTherapist.customNiches, []),
      customTools: safeParseJSON(updatedTherapist.customTools, []),
      targetAudience: safeParseJSON(updatedTherapist.targetAudience, updatedTherapist.targetAudience || '')
    };
    
    // Retornar no mesmo formato da rota GET /api/therapists/:id
    return res.status(200).json({
      success: true,
      data: processedTherapist
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil do terapeuta:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar dados do terapeuta', 
      error: error.message 
    });
  }
});

// Rota para buscar e atualizar disponibilidade do terapeuta
app.get('/api/therapists/:therapistId/availability', authMiddleware, async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { month, year } = req.query;
    
    console.log(`[Disponibilidade] Buscando disponibilidade para terapeuta: ${therapistId}, Mês: ${month}, Ano: ${year}`);
    
    // Verificar se o terapeuta existe
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    });
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Terapeuta não encontrado'
      });
    }
    
    // Buscar disponibilidade
    const availability = await prisma.availability.findMany({
      where: { therapistId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    console.log(`[Disponibilidade] Encontradas ${availability.length} disponibilidades para o terapeuta ${therapistId}`);
    
    return res.status(200).json(availability);
  } catch (error) {
    console.error('Erro ao buscar disponibilidade do terapeuta:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar disponibilidade',
      error: error.message
    });
  }
});

app.post('/api/therapists/:therapistId/availability', authMiddleware, async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { availability } = req.body;
    
    console.log(`[Disponibilidade] Atualizando disponibilidade para terapeuta: ${therapistId}`);
    
    // Verificar se o terapeuta existe
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    });
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Terapeuta não encontrado'
      });
    }
    
    // Validar dados da disponibilidade
    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'A disponibilidade deve ser um array'
      });
    }
    
    console.log(`[Disponibilidade] Removendo disponibilidade atual e adicionando ${availability.length} novos slots`);
    
    // Atualizar disponibilidade (remover existente e adicionar nova)
    // Primeiro, excluir todos os slots existentes
    await prisma.availability.deleteMany({
      where: { therapistId }
    });
    
    // Depois, criar os novos slots
    const createdSlots = [];
    for (const slot of availability) {
      console.log(`Processando slot:`, slot);
      // Transformar date em string se existir
      let dateValue = null;
      if (slot.date) {
        // Se já for string, usa direto, senão converte para string ISO
        dateValue = typeof slot.date === 'string' 
          ? slot.date 
          : new Date(slot.date).toISOString().split('T')[0]; // Formato YYYY-MM-DD
        console.log(`Data convertida: ${dateValue}`);
      }
      
      const newSlot = await prisma.availability.create({
        data: {
          therapistId,
          dayOfWeek: slot.dayOfWeek || 0,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isRecurring: slot.isRecurring || false,
          date: dateValue
        }
      });
      createdSlots.push(newSlot);
    }
    
    return res.status(200).json({
      success: true,
      message: `${createdSlots.length} slots de disponibilidade atualizados`,
      data: createdSlots
    });
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade do terapeuta:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar disponibilidade',
      error: error.message
    });
  }
});

// Rota específica para atualizar as ferramentas do terapeuta
app.put('/api/therapists/:therapistId/tools', authMiddleware, async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { tools = [], customTools = [] } = req.body;
    
    console.log(`[Ferramentas] Dados completos recebidos:`, JSON.stringify(req.body));
    
    // Array vazio é um caso especial - significa remover todas as ferramentas
    // Vamos tratar isso explicitamente
    if (Array.isArray(tools) && tools.length === 0) {
      console.log('[Ferramentas] Array vazio recebido - removendo todas as ferramentas');
      
      // Verificar se o terapeuta existe
      const therapist = await prisma.therapist.findUnique({
        where: { id: therapistId }
      });
      
      if (!therapist) {
        return res.status(404).json({
          success: false,
          message: 'Terapeuta não encontrado'
        });
      }
      
      // Verificar permissões - só o próprio terapeuta pode atualizar
      if (therapist.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para atualizar este perfil'
        });
      }
      
      // Remover todas as ferramentas do terapeuta sem criar novas
      const updatedTherapist = await prisma.therapist.update({
        where: { id: therapistId },
        data: {
          tools: {
            deleteMany: {}  // Remove todas as relações existentes
          },
          // Atualizar ferramentas customizadas se existirem
          customTools: Array.isArray(customTools) && customTools.length > 0 
            ? JSON.stringify(customTools) 
            : therapist.customTools // Manter as existentes se não recebeu novas
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
      
      // Processar ferramentas customizadas para a resposta
      const customToolsResponse = 
        (typeof updatedTherapist.customTools === 'string' && updatedTherapist.customTools)
          ? safeParseJSON(updatedTherapist.customTools, [])
          : [];
      
      console.log(`[Ferramentas] Todas as ferramentas removidas com sucesso`);
      console.log(`[Ferramentas] Ferramentas customizadas:`, JSON.stringify(customToolsResponse));
      
      return res.status(200).json({
        success: true,
        message: `Todas as ferramentas foram removidas com sucesso`,
        data: {
          tools: [],
          customTools: customToolsResponse
        }
      });
    }
    
    // Continuar com o código original para arrays não vazios
    if (!Array.isArray(tools)) {
      return res.status(400).json({
        success: false,
        message: 'As ferramentas devem ser um array'
      });
    }
    
    console.log(`[Ferramentas] Atualizando ferramentas para terapeuta: ${therapistId}`);
    console.log(`[Ferramentas] Ferramentas recebidas:`, JSON.stringify(tools));
    
    // Verificar se o terapeuta existe
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    });
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Terapeuta não encontrado'
      });
    }
    
    // Verificar permissões - só o próprio terapeuta pode atualizar
    if (therapist.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para atualizar este perfil'
      });
    }
    
    // Preparar as conexões com ferramentas com verificação de segurança
    const toolConnections = tools
      .filter(tool => tool && (tool.id || tool.toolId)) // Filtrar ferramentas inválidas
      .map(tool => {
        // Verificar se a ferramenta tem id ou toolId (compatibilidade)
        const toolId = tool.id || tool.toolId;
        
        if (!toolId) {
          console.warn(`Ferramenta sem ID encontrada: ${JSON.stringify(tool)}`);
          return null;
        }
        
        return {
          toolId,
          // Garantir que a duração e o preço são números válidos, caso contrário usar valor padrão
          duration: tool.duration ? parseInt(tool.duration) : (parseInt(therapist.sessionDuration) || 60),
          price: tool.price ? parseFloat(tool.price) : (parseFloat(therapist.baseSessionPrice) || 0)
        };
      })
      .filter(Boolean); // Remover ferramentas nulas
    
    console.log(`[Ferramentas] Conexões a serem criadas:`, JSON.stringify(toolConnections));
    
    // Processar ferramentas customizadas (se existirem)
    let processedCustomTools = [];
    if (Array.isArray(customTools) && customTools.length > 0) {
      processedCustomTools = customTools
        .filter(tool => tool && tool.name) // Filtrar ferramentas inválidas
        .map(tool => ({
          name: tool.name,
          duration: tool.duration ? parseInt(tool.duration) : (parseInt(therapist.sessionDuration) || 60),
          price: tool.price ? parseFloat(tool.price) : (parseFloat(therapist.baseSessionPrice) || 0)
        }));
    }
    
    // Atualizar ferramentas do terapeuta: excluir todas e depois criar as novas
    const updatedTherapist = await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        tools: {
          deleteMany: {},  // Remove todas as relações existentes
          create: toolConnections  // Cria as novas relações
        },
        // Atualizar ferramentas customizadas se existirem
        customTools: Array.isArray(processedCustomTools) && processedCustomTools.length > 0 
          ? JSON.stringify(processedCustomTools) 
          : therapist.customTools // Manter as existentes se não recebeu novas
      },
      include: {
        tools: {
          include: {
            tool: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    // Mapear a resposta para incluir as ferramentas formatadas
    const formattedTools = updatedTherapist.tools.map(t => {
      // Verificar se t.tool existe antes de acessar suas propriedades
      if (!t.tool) {
        console.warn(`Ferramenta sem detalhes encontrada: ${JSON.stringify(t)}`);
        return {
          id: t.toolId,
          name: "Ferramenta desconhecida",
          duration: t.duration,
          price: t.price
        };
      }
      
      return {
        id: t.tool.id,
        name: t.tool.name,
        duration: t.duration,
        price: t.price
      };
    });
    
    // Processar ferramentas customizadas para a resposta
    const customToolsResponse = 
      (typeof updatedTherapist.customTools === 'string' && updatedTherapist.customTools)
        ? safeParseJSON(updatedTherapist.customTools, [])
        : [];
    
    console.log(`[Ferramentas] Ferramentas atualizadas:`, JSON.stringify(formattedTools));
    console.log(`[Ferramentas] Ferramentas customizadas:`, JSON.stringify(customToolsResponse));
    
    return res.status(200).json({
      success: true,
      message: `${formattedTools.length} ferramentas padrão e ${customToolsResponse.length} ferramentas customizadas atualizadas com sucesso`,
      data: {
        tools: formattedTools,
        customTools: customToolsResponse
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar ferramentas do terapeuta:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar ferramentas',
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

// Adicionar rotas do Daily.co
app.post('/api/daily/room', authMiddleware, async (req, res) => {
  try {
    const { roomName, expiresInMinutes = 60 } = req.body;
    
    console.log(`[Daily.co] Criando sala: ${roomName}, expira em: ${expiresInMinutes} minutos`);
    
    // Simular criação de sala do Daily.co
    const roomData = {
      id: `room-${Date.now()}`,
      name: roomName || `room-${Date.now()}`,
      url: `https://teraconect.daily.co/${roomName || `room-${Date.now()}`}`,
      created_at: new Date().toISOString(),
      privacy: 'private',
      expires_in: expiresInMinutes * 60
    };
    
    return res.status(200).json({
      success: true,
      data: roomData
    });
  } catch (error) {
    console.error('Erro ao criar sala Daily.co:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar sala de videoconferência',
      error: error.message
    });
  }
});

app.post('/api/daily/token', authMiddleware, async (req, res) => {
  try {
    const { roomName, isOwner, userName, userId } = req.body;
    
    console.log(`[Daily.co] Gerando token para sala: ${roomName}, usuário: ${userName}, isOwner: ${isOwner}`);
    
    // Simular criação de token do Daily.co
    const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    return res.status(200).json({
      success: true,
      token,
      roomName,
      userName,
      userId,
      isOwner
    });
  } catch (error) {
    console.error('Erro ao gerar token Daily.co:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar token de videoconferência',
      error: error.message
    });
  }
});

// Rotas para o sistema de chat e mensagens
app.get('/api/messages/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`[Mensagens] Buscando mensagens para sessão: ${sessionId}`);
    
    // Buscar mensagens da sessão
    const messages = await prisma.message.findMany({
      where: { 
        sessionId 
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens',
      error: error.message
    });
  }
});

app.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { content, sessionId, senderId, type = 'TEXT' } = req.body;
    
    console.log(`[Mensagens] Nova mensagem para sessão: ${sessionId}, tipo: ${type}`);
    
    // Criar nova mensagem
    const message = await prisma.message.create({
      data: {
        content,
        type,
        session: {
          connect: { id: sessionId }
        },
        sender: {
          connect: { id: senderId }
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    // Aqui, em uma implementação completa, você emitiria um evento via Socket.io
    
    return res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message
    });
  }
});

// Configuração do Socket.io
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware do Socket.io para autenticação
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }
  
  // Em uma implementação real, verificaria o token JWT
  // Para fins de demonstração, aceitamos qualquer token
  socket.user = { id: 'user-id-placeholder' };
  next();
});

// Eventos do Socket.io
io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);
  
  // Entrar em uma sala específica
  socket.on('join', (sessionId) => {
    console.log(`Usuário entrando na sala: ${sessionId}`);
    socket.join(sessionId);
    socket.emit('joined', { sessionId });
  });
  
  // Enviar mensagem
  socket.on('message', async (data) => {
    try {
      const { content, sessionId, senderId, type = 'TEXT' } = data;
      
      console.log(`[Socket] Nova mensagem para sessão: ${sessionId}, tipo: ${type}`);
      
      // Criar mensagem no banco de dados
      const message = await prisma.message.create({
        data: {
          content,
          type,
          session: {
            connect: { id: sessionId }
          },
          sender: {
            connect: { id: senderId }
          }
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });
      
      // Emitir para todos na sala
      io.to(sessionId).emit('message', message);
    } catch (error) {
      console.error('Erro ao processar mensagem via Socket:', error);
      socket.emit('error', { message: 'Erro ao processar mensagem' });
    }
  });
  
  // Status de digitação
  socket.on('typing', (data) => {
    const { sessionId, user, isTyping } = data;
    socket.to(sessionId).emit('typing', { user, isTyping });
  });
  
  // Deixar a sala
  socket.on('leave', (sessionId) => {
    console.log(`Usuário saindo da sala: ${sessionId}`);
    socket.leave(sessionId);
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log(`Socket desconectado: ${socket.id}`);
  });
});

// Rotas para gerenciamento de sessões de terapia
app.post('/api/sessions', authMiddleware, async (req, res) => {
  try {
    const { 
      therapistId, 
      clientId, 
      scheduledDate, 
      duration = 60, 
      status = 'SCHEDULED',
      price,
      description
    } = req.body;
    
    console.log(`[Sessões] Criando nova sessão: Terapeuta ${therapistId}, Cliente ${clientId}`);
    
    // Criar nova sessão no banco de dados
    const session = await prisma.session.create({
      data: {
        therapist: {
          connect: { id: therapistId }
        },
        client: {
          connect: { id: clientId }
        },
        scheduledDate: new Date(scheduledDate),
        duration,
        status,
        price: parseFloat(price) || 0,
        description
      },
      include: {
        therapist: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    return res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar sessão',
      error: error.message
    });
  }
});

app.get('/api/sessions', authMiddleware, async (req, res) => {
  try {
    const { userId, role, status, startDate, endDate } = req.query;
    
    console.log(`[Sessões] Buscando sessões para usuário: ${userId}, role: ${role}`);
    
    // Filtros para a consulta
    const where = {};
    
    // Filtrar por papel (terapeuta ou cliente)
    if (userId && role) {
      if (role.toUpperCase() === 'THERAPIST') {
        where.therapist = { userId };
      } else if (role.toUpperCase() === 'CLIENT') {
        where.client = { userId };
      }
    }
    
    // Filtrar por status
    if (status) {
      where.status = status;
    }
    
    // Filtrar por intervalo de datas
    if (startDate || endDate) {
      where.scheduledDate = {};
      
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate);
      }
    }
    
    // Buscar sessões no banco de dados
    const sessions = await prisma.session.findMany({
      where,
      orderBy: {
        scheduledDate: 'asc'
      },
      include: {
        therapist: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar sessões',
      error: error.message
    });
  }
});

app.get('/api/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[Sessões] Buscando detalhes da sessão: ${id}`);
    
    // Buscar sessão no banco de dados
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        therapist: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da sessão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes da sessão',
      error: error.message
    });
  }
});

app.put('/api/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`[Sessões] Atualizando sessão: ${id}`);
    console.log('Dados para atualização:', JSON.stringify(updateData, null, 2));
    
    // Verificar se a sessão existe
    const existingSession = await prisma.session.findUnique({
      where: { id }
    });
    
    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    // Atualizar sessão no banco de dados
    const updatedSession = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        therapist: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar sessão',
      error: error.message
    });
  }
});

// Conectar ao banco de dados antes de iniciar o servidor
prisma.$connect()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso');
    console.log('📦 Conectado ao banco de dados');
    
    // Iniciar o servidor usando o objeto server do Socket.io
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT} (${process.env.NODE_ENV || 'development'})`);
      console.log(`📅 ${new Date().toLocaleString()}`);
      console.log(`🔌 Socket.io configurado e pronto para conexões`);
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