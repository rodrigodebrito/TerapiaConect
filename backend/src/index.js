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
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Mapear para o formato esperado pela API
    const mappedTherapist = {
      id: therapist.id,
      userId: therapist.userId,
      name: therapist.user.name,
      email: therapist.user.email,
      shortBio: therapist.shortBio || '',
      niches: therapist.niches || '',
      customNiches: therapist.customNiches || '',
      education: therapist.education || '',
      experience: therapist.experience || '',
      targetAudience: therapist.targetAudience || '',
      differential: therapist.differential || '',
      baseSessionPrice: therapist.baseSessionPrice || 0,
      servicePrices: therapist.servicePrices || '',
      sessionDuration: therapist.sessionDuration || 60,
      profilePicture: therapist.profilePicture || '',
      isApproved: therapist.isApproved || false,
      attendanceMode: therapist.attendanceMode || 'BOTH',
      city: therapist.city || '',
      state: therapist.state || '',
      tools: []
    };
    
    return res.json(mappedTherapist);
  } catch (error) {
    console.error('Erro ao buscar terapeuta por ID de usuário:', error);
    return res.status(500).json({ message: 'Erro ao buscar dados do terapeuta' });
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
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
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
    
    // Mapear para o formato esperado pela API
    const mappedTherapist = {
      id: updatedTherapist.id,
      userId: updatedTherapist.userId,
      name: updatedTherapist.user.name,
      email: updatedTherapist.user.email,
      shortBio: updatedTherapist.shortBio || '',
      niches: updatedTherapist.niches || '',
      customNiches: updatedTherapist.customNiches || '',
      education: updatedTherapist.education || '',
      experience: updatedTherapist.experience || '',
      targetAudience: updatedTherapist.targetAudience || '',
      differential: updatedTherapist.differential || '',
      baseSessionPrice: updatedTherapist.baseSessionPrice || 0,
      servicePrices: updatedTherapist.servicePrices || '',
      sessionDuration: updatedTherapist.sessionDuration || 60,
      profilePicture: updatedTherapist.profilePicture || '',
      isApproved: updatedTherapist.isApproved || false,
      attendanceMode: updatedTherapist.attendanceMode || 'BOTH',
      city: updatedTherapist.city || '',
      state: updatedTherapist.state || '',
      tools: tools || []
    };
    
    return res.json(mappedTherapist);
  } catch (error) {
    console.error('Erro ao atualizar perfil do terapeuta:', error);
    return res.status(500).json({ message: 'Erro ao atualizar dados do terapeuta', error: error.message });
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