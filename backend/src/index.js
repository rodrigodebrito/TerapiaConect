/**
 * Arquivo principal do servidor
 * 
 * Este arquivo é o ponto de entrada da aplicação
 */

// Carregar variáveis de ambiente
import dotenv from 'dotenv';
dotenv.config();

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

// Utilitários e configurações
import prisma from './utils/prisma.js';

// Obter o diretório atual em um módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importação das rotas de forma dinâmica
const routesDir = path.join(__dirname, 'routes');
const routesFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

// Criar servidor HTTP com Express
const server = http.createServer(app);

// Definir as origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:5173',
  'https://terapiaconect.com', 
  'https://www.terapiaconect.com',
  'https://terapiaconect.vercel.app', 
  'https://terapia-conect-frontend.vercel.app',
  'https://terapiaconect.com.br',
  'https://theraconnect.com.br'
];

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins
    : (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Configurar body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));

// Middleware para debugging adicional
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
  next();
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Carregar todas as rotas dinamicamente
console.log('Carregando rotas da API:');
const routePromises = routesFiles.map(async file => {
  try {
    const routePath = `./routes/${file}`;
    const routeModule = await import(routePath);
    const router = routeModule.default;
    const apiPath = `/api/${file.replace('.js', '').replace('.routes', '')}`;
    
    if (router && typeof router === 'function') {
      app.use(apiPath, router);
      console.log(`✅ Rota carregada: ${apiPath} -> ${routePath}`);
      return { success: true, path: apiPath };
    } else {
      console.error(`❌ Erro: Arquivo ${file} não exporta um router válido`);
      return { success: false, path: apiPath, error: 'Router inválido' };
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar rota ${file}:`, error.message);
    return { success: false, path: file, error: error.message };
  }
});

// Configurar Socket.IO
const io = new SocketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? allowedOrigins 
      : (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  transports: ['polling', 'websocket']
});

// Configuração de debug para Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err);
});

// Expor o objeto io para que os controladores possam usá-lo
app.locals.io = io;

// Logs de diagnóstico do ambiente
console.log('==================== DIAGNÓSTICO DE AMBIENTE ====================');
console.log(`📝 Node.js versão: ${process.version}`);
console.log(`📝 Ambiente: ${ENV}`);
console.log(`📝 Diretório atual: ${process.cwd()}`);
console.log(`📝 Diretório do script: ${__dirname}`);

// Verificar diretórios importantes
const directories = [
  { name: 'routes', path: path.join(__dirname, 'routes') },
  { name: 'routes (parent)', path: path.join(__dirname, '../routes') },
  { name: 'dist/routes', path: path.join(process.cwd(), 'dist/routes') },
  { name: 'controllers', path: path.join(__dirname, 'controllers') },
  { name: 'uploads', path: path.join(__dirname, '../uploads') }
];

console.log('\n📂 Verificando diretórios importantes:');
directories.forEach(dir => {
  const exists = fs.existsSync(dir.path);
  console.log(`📁 ${dir.name}: ${dir.path} - ${exists ? '✅ Existe' : '❌ Não existe'}`);
  
  if (exists && dir.name.includes('routes')) {
    try {
      const files = fs.readdirSync(dir.path);
      console.log(`   Arquivos (${files.length}): ${files.join(', ')}`);
    } catch (error) {
      console.error(`   ❌ Erro ao listar arquivos: ${error.message}`);
    }
  }
});

console.log('================================================================\n');

// Prisma client
const prismaClient = new PrismaClient();

// Iniciar o servidor
Promise.all(routePromises).then(results => {
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`\n📊 Rotas carregadas: ${successCount}/${results.length} (${failCount} falhas)`);
  
  // Rota padrão
  app.get('/', (req, res) => {
    res.send({
      name: 'TerapiaConect API',
      version: '1.0.0',
      status: 'online',
      environment: ENV,
      timestamp: new Date().toISOString()
    });
  });
  
  // Rota de fallback (404)
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Rota não encontrada: ${req.originalUrl}`,
      availableRoutes: results.filter(r => r.success).map(r => r.path)
    });
  });

  // Iniciar o servidor na porta especificada
  server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} (${ENV})`);
    console.log(`📅 ${new Date().toLocaleString()}`);
    
    // Verificar conexão com banco de dados
    prismaClient
      .$connect()
      .then(() => {
        console.log('📦 Conectado ao banco de dados');
        console.log('Conexão com o banco de dados estabelecida com sucesso');
      })
      .catch(err => {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
        console.error('❌ Erro detalhado:', err);
        process.exit(1);
      });
  });
  
  // Configuração do Socket.IO
  io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    
    // Manipular entrada em uma sala de sessão
    socket.on('join-session', (data) => {
      if (data && data.sessionId) {
        console.log(`Cliente ${socket.id} entrou na sala: ${data.sessionId}`);
        socket.join(data.sessionId);
        
        // Notificar outros na sala que um novo cliente entrou
        socket.to(data.sessionId).emit('user-joined', {
          socketId: socket.id,
          sessionId: data.sessionId,
          timestamp: Date.now()
        });
      }
    });
    
    // Manipular eventos de desconexão
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
}).catch(error => {
  console.error('❌ Erro fatal ao iniciar o servidor:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando conexões...');
  server.close(() => {
    console.log('Servidor HTTP fechado');
    prismaClient.$disconnect()
      .then(() => {
        console.log('Conexão do banco de dados fechada');
        process.exit(0);
      })
      .catch(error => {
        console.error('Erro ao desconectar banco de dados:', error);
        process.exit(1);
      });
  });
});

export default server; 