/**
 * Rotas para administração de usuários
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { users, therapists, findTherapistById } = require('../models/data');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const upload = require('../middleware/upload.middleware');

const router = express.Router();

/**
 * @route GET /users
 * @desc Listar todos os usuários
 * @access Privado (apenas administradores)
 */
router.get('/', authenticate, authorize(['ADMIN']), (req, res) => {
  try {
    // Mapear apenas os dados necessários para listagem
    const mappedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }));
    
    return res.json(mappedUsers);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

/**
 * @route DELETE /users/:userId
 * @desc Remover um usuário
 * @access Privado (apenas administradores)
 */
router.delete('/:userId', authenticate, authorize(['ADMIN']), (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Remover o usuário
    users.splice(userIndex, 1);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return res.status(500).json({ message: 'Erro ao remover usuário' });
  }
});

/**
 * @route POST /users/therapists/approve
 * @desc Aprovar cadastro de terapeuta
 * @access Privado (apenas administradores)
 */
router.post('/therapists/approve', authenticate, authorize(['ADMIN']), (req, res) => {
  try {
    const { therapistId } = req.body;
    
    if (!therapistId) {
      return res.status(400).json({ message: 'ID do terapeuta é obrigatório' });
    }
    
    // Verificar se o terapeuta existe
    const therapist = findTherapistById(therapistId);
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Aprovar o terapeuta
    therapist.isApproved = true;
    
    return res.json({ message: 'Terapeuta aprovado com sucesso', therapist });
  } catch (error) {
    console.error('Erro ao aprovar terapeuta:', error);
    return res.status(500).json({ message: 'Erro ao aprovar terapeuta' });
  }
});

/**
 * @route GET /users/therapists/pending
 * @desc Listar terapeutas pendentes de aprovação
 * @access Privado (apenas administradores)
 */
router.get('/therapists/pending', authenticate, authorize(['ADMIN']), (req, res) => {
  try {
    // Filtrar terapeutas pendentes
    const pendingTherapists = therapists.filter(t => !t.isApproved);
    
    return res.json(pendingTherapists);
  } catch (error) {
    console.error('Erro ao listar terapeutas pendentes:', error);
    return res.status(500).json({ message: 'Erro ao buscar terapeutas pendentes' });
  }
});

/**
 * @route GET /users/:userId/profile
 * @desc Obter o perfil do usuário
 * @access Privado
 */
router.get('/:userId/profile', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('GET /users/:userId/profile - Iniciando busca', {
      requestUserId: req.user.id,
      paramUserId: userId
    });

    // Verificar se o usuário está tentando acessar seu próprio perfil
    if (req.user.id !== userId) {
      console.log('Acesso não autorizado - IDs diferentes', {
        requestUserId: req.user.id,
        paramUserId: userId
      });
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    console.log('Buscando perfil no banco de dados...');

    // Primeiro, verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('Usuário não encontrado no banco de dados');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log('Usuário encontrado, buscando perfil do cliente...');

    // Agora buscar o perfil do cliente
    const profile = await prisma.client.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Se não encontrar o perfil, criar um perfil básico com os dados do usuário
    if (!profile) {
      console.log('Perfil não encontrado, criando perfil básico...');
      const basicProfile = {
        userId,
        user: {
          name: user.name,
          email: user.email
        }
      };
      return res.json(basicProfile);
    }

    console.log('Perfil encontrado com sucesso:', profile);
    return res.json(profile);
  } catch (error) {
    console.error('Erro detalhado ao buscar perfil:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return res.status(500).json({ 
      message: 'Erro ao buscar perfil',
      details: error.message
    });
  }
});

/**
 * @route POST /users/:userId/profile
 * @desc Criar ou atualizar o perfil do usuário
 * @access Privado
 */
router.post('/:userId/profile', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    console.log('Dados recebidos:', {
      userId,
      profileData,
      requestUser: req.user
    });

    // Verificar se o usuário está tentando atualizar seu próprio perfil
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    // Remover campos que não devem ser atualizados diretamente
    const { email, id, createdAt, updatedAt, ...cleanedData } = profileData;

    console.log('Dados limpos para atualização:', cleanedData);

    // Criar ou atualizar o perfil
    const profile = await prisma.client.upsert({
      where: { userId },
      update: {
        phone: cleanedData.phone || null,
        birthDate: cleanedData.birthDate ? new Date(cleanedData.birthDate) : null,
        gender: cleanedData.gender || null,
        profilePicture: cleanedData.profilePicture || null,
        // Campos de endereço
        street: cleanedData.street || null,
        number: cleanedData.number || null,
        complement: cleanedData.complement || null,
        neighborhood: cleanedData.neighborhood || null,
        city: cleanedData.city || null,
        state: cleanedData.state || null,
        zipCode: cleanedData.zipCode || null
      },
      create: {
        userId,
        phone: cleanedData.phone || null,
        birthDate: cleanedData.birthDate ? new Date(cleanedData.birthDate) : null,
        gender: cleanedData.gender || null,
        profilePicture: cleanedData.profilePicture || null,
        // Campos de endereço
        street: cleanedData.street || null,
        number: cleanedData.number || null,
        complement: cleanedData.complement || null,
        neighborhood: cleanedData.neighborhood || null,
        city: cleanedData.city || null,
        state: cleanedData.state || null,
        zipCode: cleanedData.zipCode || null
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Perfil atualizado com sucesso:', profile);
    return res.json(profile);
  } catch (error) {
    console.error('Erro detalhado ao atualizar perfil:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return res.status(500).json({ 
      message: 'Erro ao atualizar perfil',
      details: error.message
    });
  }
});

/**
 * @route POST /users/:userId/upload-picture
 * @desc Upload da foto de perfil do usuário
 * @access Privado
 */
router.post('/:userId/upload-picture', authenticate, upload.single('profilePicture'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar se o usuário está tentando atualizar seu próprio perfil
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Atualizar o perfil do cliente com a nova URL da imagem
    const profile = await prisma.client.upsert({
      where: { userId },
      update: {
        profilePicture: imageUrl
      },
      create: {
        userId,
        profilePicture: imageUrl
      }
    });

    return res.json({ url: imageUrl });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return res.status(500).json({ message: 'Erro ao fazer upload da imagem' });
  }
});

/**
 * @route GET /users/me
 * @desc Obter informações do usuário autenticado
 * @access Privado
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Buscar informações básicas do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Adicionar informações específicas com base no papel do usuário
    let profileData = {};
    
    if (userRole === 'THERAPIST') {
      const therapist = await prisma.therapist.findFirst({
        where: { userId }
      });
      
      if (therapist) {
        profileData = {
          therapistId: therapist.id,
          profilePicture: therapist.profilePicture,
          isApproved: therapist.isApproved,
          therapistProfile: therapist
        };
      }
    } 
    else if (userRole === 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { userId }
      });
      
      if (client) {
        profileData = {
          clientId: client.id,
          profilePicture: client.profilePicture,
          clientProfile: client
        };
      }
    }
    
    // Retornar dados completos
    return res.json({
      ...user,
      ...profileData
    });
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    return res.status(500).json({ message: 'Erro ao obter perfil do usuário' });
  }
});

/**
 * @route GET /users/appointments
 * @desc Obter todos os agendamentos do usuário
 * @access Privado
 */
router.get('/appointments', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let appointments = [];
    
    if (userRole === 'THERAPIST') {
      // Buscar o terapeuta relacionado ao usuário
      const therapist = await prisma.therapist.findFirst({
        where: { userId }
      });
      
      if (!therapist) {
        return res.status(404).json({ message: 'Perfil de terapeuta não encontrado' });
      }
      
      // Buscar agendamentos como terapeuta
      appointments = await prisma.appointment.findMany({
        where: { therapistId: therapist.id },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          tool: true
        },
        orderBy: { date: 'asc' }
      });
      
      // Formatar para o frontend
      appointments = appointments.map(app => ({
        id: app.id,
        date: app.date,
        time: app.time,
        status: app.status,
        client: {
          id: app.client.id,
          name: app.client.user.name
        },
        tool: app.tool.name,
        mode: app.mode,
        duration: app.duration,
        price: app.price,
        appointmentType: 'therapist' // Para indicar o papel no agendamento
      }));
    } 
    else if (userRole === 'CLIENT') {
      // Buscar o cliente relacionado ao usuário
      const client = await prisma.client.findFirst({
        where: { userId }
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Perfil de cliente não encontrado' });
      }
      
      // Buscar agendamentos como cliente
      appointments = await prisma.appointment.findMany({
        where: { clientId: client.id },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          tool: true
        },
        orderBy: { date: 'asc' }
      });
      
      // Formatar para o frontend
      appointments = appointments.map(app => ({
        id: app.id,
        date: app.date,
        time: app.time,
        status: app.status,
        therapist: {
          id: app.therapist.id,
          name: app.therapist.user.name
        },
        tool: app.tool.name,
        mode: app.mode,
        duration: app.duration,
        price: app.price,
        appointmentType: 'client' // Para indicar o papel no agendamento
      }));
    }
    
    return res.json(appointments);
  } catch (error) {
    console.error('Erro ao obter agendamentos do usuário:', error);
    return res.status(500).json({ message: 'Erro ao obter agendamentos' });
  }
});

module.exports = router; 