const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

// Configuração avançada de CORS para permitir WebSockets e acesso ao Dyte
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3001',
    'https://api.dyte.io',
    'https://socket.dyte.io',
    'https://fallback-socket.dyte.io',
    // Permitir subdomínios do Dyte
    /\.dyte\.io$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Origin', 
    'Accept',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar o CORS em todas as rotas
app.use(cors(corsOptions));

// Habilitar cabeçalhos especiais para a API do Dyte
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Opções específicas para solicitações Preflight
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(204).json({});
  }
  
  next();
});

app.use(express.json());

// Configurar pasta de uploads para ser acessível publicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use(routes); 