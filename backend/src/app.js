import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

// Configuração de caminhos para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rotas serão carregadas dinamicamente com tratamento de erro
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

// Registrar as rotas - carregando arquivos .cjs do diretório routes
console.log('\nCarregando rotas da API:');

// Função para carregar um router usando require (para arquivos .cjs)
async function loadCjsRouter(routePath) {
  try {
    // Na produção, os arquivos estão em dist
    const fullPath = path.resolve(__dirname, routePath);
    
    // Verificar se o arquivo existe antes de tentar carregá-lo
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Arquivo não encontrado: ${fullPath}`);
      return null;
    }
    
    // Usando require dinâmico (CommonJS)
    let router;
    try {
      // No Node.js, quando se usa o 'import' como palavra-chave do ESM,
      // você ainda pode usar require() como uma função, mas isso gera um erro
      // em tempo de execução no ambiente ESM, então precisamos usar 'createRequire'
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      
      router = require(fullPath);
      
      // Verificar se router é um objeto (pode ser o caso de module.exports = router)
      if (typeof router === 'object' && router.default) {
        router = router.default;
      }
      
      return router;
    } catch (error) {
      console.error(`❌ Erro ao carregar ${routePath}:`, error.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${routePath}:`, error.message);
    return null;
  }
}

// Carregar rotas dinamicamente
(async function loadRoutes() {
  try {
    // Definir o diretório de rotas (baseado no ambiente)
    // Em produção, procura no mesmo diretório que o app.js
    const routesPath = path.join(__dirname, 'routes');
    
    console.log(`📂 Buscando rotas em: ${routesPath}`);
    console.log(`📂 Diretório atual (__dirname): ${__dirname}`);
    
    // Verificar se o diretório existe
    if (!fs.existsSync(routesPath)) {
      console.error(`❌ Diretório de rotas não encontrado: ${routesPath}`);
      
      // Tentar caminhos alternativos
      const altPaths = [
        path.join(process.cwd(), 'dist/routes'),
        path.join(process.cwd(), 'routes'),
        path.join(__dirname, '../routes')
      ];
      
      for (const altPath of altPaths) {
        console.log(`🔍 Tentando caminho alternativo: ${altPath}`);
        if (fs.existsSync(altPath)) {
          console.log(`✅ Diretório alternativo encontrado: ${altPath}`);
          // Continuar com o caminho alternativo
          processRoutesDir(altPath);
          return;
        }
      }
      
      console.error('❌ Nenhum diretório de rotas encontrado após tentar caminhos alternativos');
      return;
    }
    
    // Processar o diretório de rotas encontrado
    processRoutesDir(routesPath);
  } catch (error) {
    console.error('❌ Erro ao carregar rotas:', error.message);
  }
})();

// Função para processar o diretório de rotas
async function processRoutesDir(routesPath) {
  // Listar todos os arquivos no diretório de rotas
  const routeFiles = fs.readdirSync(routesPath);
  console.log(`🔍 Arquivos encontrados: ${routeFiles.length}`);
  
  // Filtrar apenas arquivos .cjs
  const cjsRouteFiles = routeFiles.filter(file => file.endsWith('.cjs'));
  console.log(`🔍 Arquivos .cjs encontrados: ${cjsRouteFiles.length}`);
  
  // Ignorar completamente arquivos .js
  const jsFiles = routeFiles.filter(file => file.endsWith('.js') && !file.endsWith('.cjs'));
  if (jsFiles.length > 0) {
    console.log(`⚠️ Ignorando ${jsFiles.length} arquivos .js no diretório de rotas:`);
    jsFiles.forEach(file => console.log(`  - ${file}`));
  }
  
  // Carregar e registrar cada rota
  let loadedCount = 0;
  for (const file of cjsRouteFiles) {
    const routePath = path.join(routesPath, file);
    console.log(`⏳ Carregando rota: ${file}`);
    
    const router = await loadCjsRouter(routePath);
    if (router) {
      app.use('/api', router);
      console.log(`✅ Rota carregada: ${file}`);
      loadedCount++;
    }
  }
  
  console.log(`📊 Rotas carregadas: ${loadedCount}/${cjsRouteFiles.length}`);
}

// Rota padrão da API
app.get('/', (req, res) => {
  res.json({
    name: 'TerapiaConect API',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Rota de fallback (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.originalUrl}`
  });
});

// Adicionar o OpenAI como propriedade global do app para uso nos controladores
app.locals.openai = openai;
app.locals.prisma = prisma;

export default app; 