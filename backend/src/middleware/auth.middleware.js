/**
 * Middleware de autenticação
 * 
 * Este arquivo contém middlewares para autenticação e autorização.
 */

const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * Middleware para verificar se o usuário está autenticado
 */
const authenticate = (req, res, next) => {
  // TEMPORÁRIO: Permitir acesso à rota de transcrição sem autenticação
  if (req.path === '/api/ai/whisper/transcribe' || req.path === '/ai/whisper/transcribe' || req.path === '/whisper/transcribe') {
    console.log('Bypass de autenticação para rota de transcrição:', req.path);
    // Adicionar um usuário fictício para testes
    req.user = { id: 'test-user', name: 'Test User', role: 'CLIENT' };
    return next();
  }
  
  // Obter o token do cabeçalho Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  }
  
  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }
  
  const token = parts[1];
  
  // Verificar o token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    
    // Adicionar os dados do usuário ao objeto de requisição
    req.user = decoded;
    
    return next();
  });
};

// Alias para o middleware de autenticação - usado nas novas rotas
const authMiddleware = authenticate;

/**
 * Middleware para verificar se o usuário está autenticado (versão alternativa)
 * Mantido para compatibilidade com novas rotas
 */
const authenticateToken = (req, res, next) => {
  // Obter o token do cabeçalho Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido' });
  }
  
  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }
  
  const token = parts[1];
  
  // Verificar o token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    
    // Adicionar os dados do usuário ao objeto de requisição
    req.user = decoded;
    
    return next();
  });
};

/**
 * Middleware para verificar se o usuário tem determinado papel
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    // A autenticação deve ser verificada primeiro
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    // Verificar se o usuário tem um dos papéis permitidos
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Não autorizado' });
    }
    
    return next();
  };
};

/**
 * Middleware para validar o refresh token
 */
const validateRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token não fornecido' });
  }
  
  try {
    // Verificar o refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    // Adicionar os dados do usuário ao objeto de requisição
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    return next();
  } catch (error) {
    console.error('Erro ao validar refresh token:', error);
    return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
  }
};

module.exports = {
  authenticate,
  authorize,
  validateRefreshToken,
  authenticateToken,
  authMiddleware
}; 