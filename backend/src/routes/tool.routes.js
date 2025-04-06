/**
 * Rotas para ferramentas terapêuticas
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const prisma = require('../utils/prisma');

const router = express.Router();

/**
 * @route GET /tools
 * @desc Listar todas as ferramentas
 * @access Público
 */
router.get('/', async (req, res) => {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return res.json(tools);
  } catch (error) {
    console.error('Erro ao listar ferramentas:', error);
    return res.status(500).json({ message: 'Erro ao listar ferramentas' });
  }
});

/**
 * @route POST /tools
 * @desc Criar uma nova ferramenta
 * @access Privado (apenas admin)
 */
router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { name, duration } = req.body;
    
    // Validar dados
    if (!name || !duration) {
      return res.status(400).json({ message: 'Nome e duração são obrigatórios' });
    }
    
    // Verificar se já existe uma ferramenta com o mesmo nome
    const existingTool = await prisma.tool.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
    
    if (existingTool) {
      return res.status(409).json({ message: 'Já existe uma ferramenta com este nome' });
    }
    
    // Criar a ferramenta
    const tool = await prisma.tool.create({
      data: {
        name,
        duration: parseInt(duration)
      }
    });
    
    return res.status(201).json(tool);
  } catch (error) {
    console.error('Erro ao criar ferramenta:', error);
    return res.status(500).json({ message: 'Erro ao criar ferramenta' });
  }
});

/**
 * @route PUT /tools/:id
 * @desc Atualizar uma ferramenta
 * @access Privado (apenas admin)
 */
router.put('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration } = req.body;
    
    // Validar dados
    if (!name || !duration) {
      return res.status(400).json({ message: 'Nome e duração são obrigatórios' });
    }
    
    // Verificar se a ferramenta existe
    const tool = await prisma.tool.findUnique({
      where: { id }
    });
    
    if (!tool) {
      return res.status(404).json({ message: 'Ferramenta não encontrada' });
    }
    
    // Verificar se já existe outra ferramenta com o mesmo nome
    const existingTool = await prisma.tool.findFirst({
      where: {
        AND: [
          {
            name: {
              equals: name,
              mode: 'insensitive'
            }
          },
          {
            id: {
              not: id
            }
          }
        ]
      }
    });
    
    if (existingTool) {
      return res.status(409).json({ message: 'Já existe uma ferramenta com este nome' });
    }
    
    // Atualizar a ferramenta
    const updatedTool = await prisma.tool.update({
      where: { id },
      data: {
        name,
        duration: parseInt(duration)
      }
    });
    
    return res.json(updatedTool);
  } catch (error) {
    console.error('Erro ao atualizar ferramenta:', error);
    return res.status(500).json({ message: 'Erro ao atualizar ferramenta' });
  }
});

/**
 * @route DELETE /tools/:id
 * @desc Excluir uma ferramenta
 * @access Privado (apenas admin)
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a ferramenta existe
    const tool = await prisma.tool.findUnique({
      where: { id }
    });
    
    if (!tool) {
      return res.status(404).json({ message: 'Ferramenta não encontrada' });
    }
    
    // Verificar se existem agendamentos usando esta ferramenta
    const appointments = await prisma.appointment.findFirst({
      where: { toolId: id }
    });
    
    if (appointments) {
      return res.status(409).json({ message: 'Esta ferramenta não pode ser excluída pois está sendo usada em agendamentos' });
    }
    
    // Excluir a ferramenta
    await prisma.tool.delete({
      where: { id }
    });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir ferramenta:', error);
    return res.status(500).json({ message: 'Erro ao excluir ferramenta' });
  }
});

module.exports = router; 