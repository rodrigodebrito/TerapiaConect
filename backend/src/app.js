const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

// Configuração CORS simplificada
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Origin', 
    'Accept'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar o CORS em todas as rotas
app.use(cors(corsOptions));

// Middleware para JSON
app.use(express.json());

// Configurar pasta de uploads para ser acessível publicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use('/api/auth', routes.authRoutes);
app.use('/api/training', routes.trainingRoutes);
app.use('/api/ai', routes.aiRoutes);
app.use('/api/transcription', routes.transcriptionRoutes);
app.use(routes.routes); 