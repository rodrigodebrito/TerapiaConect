const express = require('express');
const router = express.Router();

// Importar rotas
const aiRoutes = require('./ai.routes');
const trainingRoutes = require('./training.routes');
const authRoutes = require('./auth.routes');
const transcriptionRoutes = require('./transcription.routes');
const therapistRoutes = require('./therapist.routes');

// Usar rotas da IA
router.use('/api/ai', aiRoutes);

// Usar rotas de treinamento
router.use('/api/training', trainingRoutes);

// Usar rotas de autenticação
router.use('/api/auth', authRoutes);

// Registrar rotas de transcrição
router.use('/api/transcription', transcriptionRoutes);

// Registrar rotas de terapeutas
router.use('/api/therapists', therapistRoutes);

// ... resto das rotas existentes ...

// Exportar todas as rotas
module.exports = {
  routes: router,
  aiRoutes,
  trainingRoutes,
  authRoutes,
  transcriptionRoutes,
  therapistRoutes
}; 