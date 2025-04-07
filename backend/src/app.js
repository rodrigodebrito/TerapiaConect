import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

// Importar rotas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.route.js';
import adminRoutes from './routes/admin.route.js';
import therapistRoutes from './routes/therapist.route.js';
import clientRoutes from './routes/client.route.js';
import subscriptionRoutes from './routes/subscription.route.js';
import sessionRoutes from './routes/session.route.js';
import meetingRoutes from './routes/meeting.routes.js';
import paymentRoutes from './routes/payment.route.js';
import aiRoutes from './routes/ai.routes.js';
import embedRoutes from './routes/embedding.route.js';
import chatRoutes from './routes/chat.route.js';
import insightRoutes from './routes/insight.routes.js';
import trainingRoutes from './routes/training.routes.js';
import transcriptionRoutes from './routes/transcription.routes.js';

// Configuração de caminhos para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/meeting', meetingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/embed', embedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/transcription', transcriptionRoutes);

// Adicionar o OpenAI como propriedade global do app para uso nos controladores
app.locals.openai = openai;
app.locals.prisma = prisma;

export default app; 