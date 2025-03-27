/**
 * Arquivo principal do servidor
 * 
 * Comandos para instalar dependências:
 * New-Item -ItemType Directory -Path backend
 * Set-Location backend
 * npm init -y
 * npm install express cors jsonwebtoken bcryptjs dotenv morgan body-parser nodemon @prisma/client
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const prisma = require('./utils/prisma');

// Importação das rotas
const authRoutes = require('./routes/auth.routes');
const therapistRoutes = require('./routes/therapist.routes');
const clientRoutes = require('./routes/client.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const userRoutes = require('./routes/user.routes');
const toolRoutes = require('./routes/tool.routes');
const uploadRoutes = require('./routes/upload.routes');
const sessionRoutes = require('./routes/session.routes');
const aiRoutes = require('./routes/ai.routes');
const transcriptRoutes = require('./routes/transcript.routes');
const insightRoutes = require('./routes/insight.routes');
const meetingRoutes = require('./routes/meeting.routes');
const trainingRoutes = require('./routes/training.routes');

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
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

// Rota padrão
app.get('/', (req, res) => {
  res.send('API da Plataforma Terapeuta - Versão 1.0.0');
});

// Iniciar o servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Middleware para tratar erros do Prisma
app.use((err, req, res, next) => {
  // Tratamento específico para erros do Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: 'O arquivo é muito grande. O tamanho máximo permitido é 10MB.'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Campo de arquivo inesperado.'
      });
    }
    
    return res.status(400).json({
      message: `Erro no upload de arquivo: ${err.message}`
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    console.error('Erro de Prisma:', err.message);
    return res.status(400).json({ message: 'Erro na operação do banco de dados', code: err.code });
  }
  
  if (err.name === 'PrismaClientValidationError') {
    console.error('Erro de validação do Prisma:', err.message);
    return res.status(400).json({ message: 'Erro de validação nos dados fornecidos' });
  }
  
  console.error('Erro não tratado:', err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

// Graceful shutdown
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

async function shutDown() {
  console.log('Recebido sinal para encerramento');
  
  server.close(() => {
    console.log('Servidor HTTP fechado');
  });
  
  try {
    await prisma.$disconnect();
    console.log('Conexão com o banco de dados fechada');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao desconectar do banco de dados:', error);
    process.exit(1);
  }
}

// Para testes
module.exports = app; 