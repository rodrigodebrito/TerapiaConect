/**
 * Arquivo principal do servidor
 * 
 * Comandos para instalar dependências:
 * New-Item -ItemType Directory -Path backend
 * Set-Location backend
 * npm init -y
 * npm install express cors jsonwebtoken bcryptjs dotenv morgan body-parser nodemon @prisma/client
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import prisma from './utils/prisma.js';

// Obter o diretório atual em um módulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importação das rotas (necessário converter esses arquivos também)
import authRoutes from './routes/auth.routes.js';
import therapistRoutes from './routes/therapist.routes.js';
import clientRoutes from './routes/client.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import userRoutes from './routes/user.routes.js';
import toolRoutes from './routes/tool.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import sessionRoutes from './routes/session.routes.js';
import aiRoutes from './routes/ai.routes.js';
import transcriptRoutes from './routes/transcript.routes.js';
import insightRoutes from './routes/insight.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import trainingRoutes from './routes/training.routes.js';
import transcriptionRoutes from './routes/transcription.routes.js';

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Criar servidor HTTP com Express
const server = http.createServer(app);

// Definir as origens permitidas
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:5173',
  'https://terapiaconect.com', 
  'https://www.terapiaconect.com',
  'https://terapiaconect.vercel.app', 
  'https://terapia-conect-frontend.vercel.app',
  'https://terapiaconect.com.br'
];

// Configurar Socket.IO com configurações otimizadas
const io = new SocketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? allowedOrigins 
      : (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  },
  allowEIO3: true, // Compatibilidade com Engine.IO versão 3
  pingTimeout: 60000, // Aumentar timeout para prevenir desconexões
  transports: ['polling', 'websocket'] // Permitir ambos polling e websocket
});

// Configuração de debug para Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err);
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins
    : (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Definição das rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/transcription', transcriptionRoutes);

// Rota padrão
app.get('/', (req, res) => {
  res.send('API da Plataforma Terapeuta - Versão 1.0.0');
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
  
  // Manipular rotação específica de representantes
  socket.on('representative_rotated', (data) => {
    if (data && data.sessionId && data.representativeId) {
      // Garantir que a rotação seja um número
      const numericRotation = typeof data.rotation === 'object' ? data.rotation.y || 0 : Number(data.rotation);
      
      console.log(`[${socket.id}] Rotação de representante recebida para ID ${data.representativeId} na sessão ${data.sessionId}: ${numericRotation}`);
      
      // Atualizar a rotação com valor numérico garantido
      const eventData = {
        ...data,
        rotation: numericRotation,
        forwardedBy: socket.id,
        timestamp: Date.now()
      };
      
      // Repassar a rotação para todos na mesma sala, exceto o remetente
      socket.to(data.sessionId).emit('representative_rotated', eventData);
    }
  });
  
  // Manipular sincronização completa de representantes
  socket.on('representatives_updated', (data) => {
    if (data && data.sessionId && data.representatives) {
      console.log(`[${socket.id}] Atualização completa de representantes para sessão ${data.sessionId}: ${data.representatives.length} representantes`);
      
      // Repassar a atualização para todos na mesma sala, exceto o remetente
      socket.to(data.sessionId).emit('representatives_updated', {
        ...data,
        forwardedBy: socket.id,
        timestamp: Date.now()
      });
    }
  });
  
  // Manipular comandos de constelação
  socket.on('constellation-command', (data) => {
    if (data && data.sessionId) {
      console.log(`Comando de constelação recebido: ${data.type} para sessão ${data.sessionId}`);
      
      // Repassar o comando para todos na mesma sala, exceto o remetente
      socket.to(data.sessionId).emit('constellation-command', data);
    }
  });
  
  // Manipular comandos de objetos de constelação (posicionamento, etc)
  socket.on('constellation-object', (data) => {
    if (data && data.sessionId) {
      try {
        // Verificar se o remetente está na sala
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(data.sessionId)) {
          console.log(`[${socket.id}] Socket não está na sala ${data.sessionId}, associando agora`);
          socket.join(data.sessionId);
        }

        // Adicionar logs detalhados para diferentes tipos de eventos
        if (data.type === 'plate') {
          console.log(`[${socket.id}] Atualização de rotação do prato para sessão ${data.sessionId}: ${data.rotation.toFixed(2)}`);
          
          // Verificar se precisamos forçar a atualização mesmo para quem tem controle
          if (data.forceUpdate) {
            console.log(`[${socket.id}] Forçando atualização de rotação do prato para todos`);
            // Enviar para todos na sala incluindo quem enviou
            io.to(data.sessionId).emit('constellation-object', {
              ...data,
              forwardedBy: socket.id,
              timestamp: Date.now()
            });
          } else {
            // Repassar somente para os outros na sala
            socket.to(data.sessionId).emit('constellation-object', {
              ...data,
              forwardedBy: socket.id,
              timestamp: Date.now()
            });
          }
        } 
        else if (data.type === 'camera') {
          console.log(`[${socket.id}] Atualização de câmera para sessão ${data.sessionId}: Pos(${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)})`);
          
          // Verificar se precisamos forçar a atualização mesmo para quem tem controle
          if (data.forceUpdate) {
            console.log(`[${socket.id}] Forçando atualização de câmera para todos`);
            // Enviar para todos na sala incluindo quem enviou
            io.to(data.sessionId).emit('constellation-object', {
              ...data,
              forwardedBy: socket.id,
              timestamp: Date.now()
            });
          } else {
            // Repassar somente para os outros na sala
            socket.to(data.sessionId).emit('constellation-object', {
              ...data,
              forwardedBy: socket.id,
              timestamp: Date.now()
            });
          }
        }
        else if (data.type === 'representative') {
          console.log(`[${socket.id}] Evento de representante para sessão ${data.sessionId} - ação: ${data.action}, ID: ${data.representative?.id || data.representativeId}`);
          
          // Repassar o comando para todos na mesma sala, exceto o remetente
          socket.to(data.sessionId).emit('constellation-object', {
            ...data,
            forwardedBy: socket.id,
            timestamp: Date.now()
          });
        } 
        else if (data.type === 'requestSync') {
          console.log(`[${socket.id}] Cliente solicitou sincronização para sessão ${data.sessionId}`);
          
          // Emitir um evento para o host da sessão pedindo para enviar a sincronização
          socket.to(data.sessionId).emit('constellation-sync-request', {
            clientId: data.clientId,
            sessionId: data.sessionId,
            timestamp: Date.now()
          });
        } 
        else if (data.type === 'fullSync') {
          console.log(`[${socket.id}] Sincronização completa para sessão ${data.sessionId} - ${data.representatives?.length || 0} representantes`);
          
          // Encaminhar para todos na sala, incluindo quem solicitou
          io.to(data.sessionId).emit('constellation-object', {
            ...data,
            forwardedBy: socket.id,
            timestamp: Date.now()
          });
        } 
        else if (data.type === 'control') {
          console.log(`[${socket.id}] Evento de controle para sessão ${data.sessionId} - ação: ${data.action}`);
          
          // Encaminhar para todos na sala
          io.to(data.sessionId).emit('constellation-object', {
            ...data,
            forwardedBy: socket.id,
            timestamp: Date.now()
          });
        }
        else {
          console.log(`[${socket.id}] Atualização de objeto de constelação para sessão ${data.sessionId} - tipo: ${data.type}, ação: ${data.action || 'none'}`);
          
          // Repassar o comando para todos na mesma sala, exceto o remetente
          socket.to(data.sessionId).emit('constellation-object', {
            ...data,
            forwardedBy: socket.id,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Erro ao processar evento constellation-object:`, error);
      }
    }
  });
  
  // Manipular desconexão do cliente
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar o servidor
async function startServer() {
  try {
    // Testar conexão com o banco de dados
    await prisma.$connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso');
    
    // Iniciar o servidor HTTP
    server.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Função para encerrar o servidor graciosamente
async function shutDown() {
  console.log('Recebido sinal para terminar, fechando servidor...');
  
  try {
    // Desconectar todos os clientes Socket.IO
    io.disconnectSockets(true);
    
    // Fechar o servidor HTTP
    server.close(() => {
      console.log('Servidor HTTP fechado.');
      
      // Fechar conexão com o banco de dados
      prisma.$disconnect()
        .then(() => {
          console.log('Conexão com o banco de dados fechada.');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Erro ao fechar conexão com o banco de dados:', err);
          process.exit(1);
        });
    });
  } catch (error) {
    console.error('Erro ao encerrar servidor:', error);
    process.exit(1);
  }
}

// Capturar sinais para shutdown gracioso
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
process.on('uncaughtException', (error) => {
  console.error('Exceção não capturada:', error);
  shutDown();
});

// Iniciar o servidor
startServer(); 