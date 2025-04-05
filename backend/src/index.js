/**
 * Versão simplificada do servidor para diagnóstico no Render
 * Esta versão reduz o uso de memória e remove funcionalidades pesadas
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Inicializar Prisma com configurações de log mínimas para reduzir uso de memória
const prisma = new PrismaClient({
  log: ['error'],
});

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' })); // Limitar tamanho das requisições

// Rotas básicas
app.get('/', (req, res) => {
  res.send('API TerapiaConect - Versão de Diagnóstico');
});

// Rota para verificar status da API
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// Rota para testar a conexão com o banco de dados
app.get('/api/db-test', async (req, res) => {
  try {
    // Operação leve para testar conexão
    const count = await prisma.user.count();
    res.json({ 
      status: 'connected', 
      userCount: count,
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

// Inicia o servidor com Express diretamente (sem Socket.IO e outras dependências pesadas)
app.listen(PORT, () => {
  console.log(`TerapiaConect API rodando na porta ${PORT} - Versão de Diagnóstico`);
});

// Tratamento de erros não capturados para prevenir crashes
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
  // Não encerra o processo, apenas loga o erro
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  // Não encerra o processo, apenas loga o erro
}); 