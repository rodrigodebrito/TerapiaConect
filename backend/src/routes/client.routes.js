/**
 * Rotas para clientes
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const prisma = require('../utils/prisma');

const router = express.Router();

/**
 * @route GET /clients/user
 * @desc Obter ID do cliente pelo usuário logado
 * @access Privado (apenas clientes)
 */
router.get('/user', authenticate, authorize(['CLIENT']), async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Perfil de cliente não encontrado' });
    }
    
    return res.json(client);
  } catch (error) {
    console.error('Erro ao buscar ID do cliente:', error);
    return res.status(500).json({ message: 'Erro ao buscar ID do cliente' });
  }
});

/**
 * @route GET /clients/profile
 * @desc Obter perfil do cliente logado
 * @access Privado (apenas o próprio cliente)
 */
router.get('/profile', authenticate, authorize(['CLIENT']), async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Perfil de cliente não encontrado' });
    }
    
    return res.json(client);
  } catch (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return res.status(500).json({ message: 'Erro ao buscar perfil do cliente' });
  }
});

/**
 * @route PUT /clients/profile
 * @desc Atualizar perfil do cliente
 * @access Privado (apenas o próprio cliente)
 */
router.put('/profile', authenticate, authorize(['CLIENT']), async (req, res) => {
  try {
    const { preferences, notes } = req.body;
    
    const client = await prisma.client.update({
      where: { userId: req.user.id },
      data: {
        preferences: preferences || undefined,
        notes: notes || undefined
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
    
    return res.json(client);
  } catch (error) {
    console.error('Erro ao atualizar perfil do cliente:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil do cliente' });
  }
});

/**
 * @route GET /clients/:id
 * @desc Obter dados de um cliente específico
 * @access Privado (apenas terapeutas)
 */
router.get('/:id', authenticate, authorize(['THERAPIST']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    return res.json(client);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ message: 'Erro ao buscar cliente' });
  }
});

module.exports = router; 