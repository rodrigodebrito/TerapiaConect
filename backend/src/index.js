/**
 * Versão com funcionalidades básicas para o TerapiaConect
 * Esta versão mantém o uso de memória controlado
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Importação das rotas essenciais
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const therapistRoutes = require('./routes/therapist.routes');
const clientRoutes = require('./routes/client.routes');
const toolRoutes = require('./routes/tool.routes');

// Inicializar Prisma com configurações de log mínimas
const prisma = new PrismaClient({
  log: ['error'],
});

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://terapiaconect.com', 'https://www.terapiaconect.com', '*'] 
    : ['http://localhost:3001', 'http://localhost:5173', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Limitar tamanho das requisições para economizar memória
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Definição das rotas essenciais
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tools', toolRoutes);

// Rota padrão
app.get('/', (req, res) => {
  res.send('API TerapiaConect - Versão com Funcionalidades Básicas');
});

// Rota para verificar status da API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-basic',
    env: process.env.NODE_ENV || 'development'
  });
});

// Rota para testar a conexão com o banco de dados
app.get('/api/db-test', async (req, res) => {
  try {
    // Operação leve para testar conexão
    const userCount = await prisma.user.count();
    const toolCount = await prisma.tool.count();
    
    res.json({ 
      status: 'connected', 
      stats: {
        users: userCount,
        tools: toolCount
      },
      message: 'Conexão com o banco de dados estabelecida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao conectar com o banco de dados',
      error: error.message
    });
  }
});

// Inicia o servidor com Express diretamente (sem Socket.IO por enquanto)
app.listen(PORT, () => {
  console.log(`TerapiaConect API rodando na porta ${PORT} - Versão com Funcionalidades Básicas`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  // Não encerra o processo, apenas loga o erro
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  // Não encerra o processo, apenas loga o erro
}); 