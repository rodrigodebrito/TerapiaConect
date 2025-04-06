/**
 * Controlador de autenticação
 * 
 * Este controlador gerencia o login e atualização de tokens.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// Login de usuário
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar dados da requisição
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }
    
    // Buscar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    
    // Verificar a senha
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    
    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Gerar refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    
    // Retornar os tokens e dados do usuário
    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    return res.status(500).json({ message: 'Erro ao processar autenticação' });
  }
};

// Renovar token usando refresh token
const refreshToken = async (req, res) => {
  try {
    // O middleware validateRefreshToken já verificou o token e adicionou os dados do usuário
    const { user } = req;
    
    // Gerar novo token de acesso
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Retornar o novo token
    return res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return res.status(500).json({ message: 'Erro ao processar renovação de token' });
  }
};

// Registrar um novo usuário
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validar dados
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    
    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está em uso' });
    }
    
    // Validar o papel do usuário
    const validRoles = ['CLIENT', 'THERAPIST'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Papel de usuário inválido' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });
    
    // Criar perfil baseado no papel
    if (role === 'CLIENT') {
      await prisma.client.create({
        data: {
          userId: user.id
        }
      });
    } else if (role === 'THERAPIST') {
      await prisma.therapist.create({
        data: {
          userId: user.id,
          isApproved: false // Terapeutas precisam ser aprovados por um admin
        }
      });
    }
    
    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Gerar refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    
    return res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};

module.exports = {
  login,
  refreshToken,
  register
}; 