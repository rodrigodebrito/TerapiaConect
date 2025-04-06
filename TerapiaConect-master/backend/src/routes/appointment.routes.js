/**
 * Rotas para agendamentos
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const prisma = require('../utils/prisma');
const { PrismaClient } = require('@prisma/client');
const { startOfDay, endOfDay } = require('date-fns');

const router = express.Router();
const prismaClient = new PrismaClient();

/**
 * @route GET /appointments/therapist/:therapistId
 * @desc Obter agendamentos de um terapeuta
 * @access Privado (apenas o próprio terapeuta)
 */
router.get('/therapist/:therapistId', authenticate, authorize(['THERAPIST']), async (req, res) => {
  try {
    const { therapistId } = req.params;
    
    // Verificar se o terapeuta existe
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    });
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Verificar se o usuário logado é o dono do perfil
    if (therapist.userId !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar estes agendamentos' });
    }
    
    // Buscar os agendamentos com os dados do cliente e da ferramenta
    const appointments = await prisma.appointment.findMany({
      where: { therapistId },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        tool: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Formatar os agendamentos para o frontend
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      date: appointment.date,
      endDate: appointment.endDate,
      status: appointment.status,
      notes: appointment.notes,
      client: {
        id: appointment.client.id,
        name: appointment.client.user.name
      },
      toolName: appointment.tool.name,
      duration: appointment.duration
    }));
    
    return res.json(formattedAppointments);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return res.status(500).json({ message: 'Erro ao buscar agendamentos do terapeuta' });
  }
});

/**
 * @route GET /appointments/client/:clientId
 * @desc Obter agendamentos de um cliente
 * @access Privado (apenas o próprio cliente)
 */
router.get('/client/:clientId', authenticate, authorize(['CLIENT']), async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Verificar se o usuário logado é o dono do perfil
    if (client.userId !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar estes agendamentos' });
    }
    
    // Buscar os agendamentos com os dados do terapeuta e da ferramenta
    const appointments = await prisma.appointment.findMany({
      where: { clientId },
      include: {
        therapist: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        tool: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Formatar os agendamentos para o frontend
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      date: appointment.date,
      endDate: appointment.endDate,
      status: appointment.status,
      notes: appointment.notes,
      therapist: {
        id: appointment.therapist.id,
        name: appointment.therapist.user.name
      },
      toolName: appointment.tool.name,
      duration: appointment.duration
    }));
    
    return res.json(formattedAppointments);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return res.status(500).json({ message: 'Erro ao buscar agendamentos do cliente' });
  }
});

/**
 * @route POST /appointments
 * @desc Criar um novo agendamento
 * @access Privado
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      therapistId,
      clientId,
      date,
      time,
      toolId,
      mode
    } = req.body;

    // Validar dados obrigatórios
    if (!therapistId || !clientId || !date || !time || !toolId) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    // Verificar se o terapeuta existe e está aprovado
    const therapist = await prismaClient.therapist.findUnique({
      where: { id: therapistId },
      include: {
        tools: {
          where: { toolId },
          include: { tool: true }
        }
      }
    });

    if (!therapist) {
      return res.status(404).json({ error: 'Terapeuta não encontrado' });
    }

    // Verificar se o terapeuta oferece a ferramenta selecionada
    const therapistTool = therapist.tools[0];
    if (!therapistTool) {
      return res.status(400).json({ error: 'Ferramenta não disponível para este terapeuta' });
    }

    // Verificar se o clientId é na verdade o userId (compatibilidade com frontend)
    let finalClientId = clientId;
    
    // Tentar buscar o cliente pelo userId (se o clientId fornecido for o userId)
    const clientByUser = await prismaClient.client.findFirst({
      where: { userId: clientId }
    });
    
    if (clientByUser) {
      console.log(`Cliente encontrado com userId ${clientId}: ${clientByUser.id}`);
      finalClientId = clientByUser.id;
    } else {
      // Verificar se o cliente existe com o ID fornecido
      const clientExists = await prismaClient.client.findUnique({
        where: { id: clientId }
      });
      
      if (!clientExists) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
    }

    // Verificar disponibilidade do horário
    const appointmentDate = new Date(`${date}T${time}Z`);
    const appointmentEndDate = new Date(appointmentDate.getTime() + therapistTool.tool.duration * 60000);

    // Verificar se já existe agendamento para o horário
    const existingAppointment = await prismaClient.appointment.findFirst({
      where: {
        therapistId,
        date,
        time,
        NOT: {
          status: 'CANCELLED'
        }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'Horário já está ocupado' });
    }

    // Criar o agendamento
    const appointment = await prismaClient.appointment.create({
      data: {
        therapistId,
        clientId: finalClientId, // Usar o ID correto do cliente
        date,
        time,
        toolId,
        mode,
        status: 'SCHEDULED',
        price: therapistTool.price,
        duration: therapistTool.tool.duration
      },
      include: {
        therapist: {
          include: {
            user: true
          }
        },
        client: {
          include: {
            user: true
          }
        },
        tool: true
      }
    });

    res.json(appointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

/**
 * @route PUT /appointments/:id/status
 * @desc Atualizar o status de um agendamento
 * @access Privado (apenas o terapeuta do agendamento)
 */
router.put('/:id/status', authenticate, authorize(['THERAPIST']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validar status
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }
    
    // Buscar o agendamento
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        therapist: true,
        client: {
          include: {
            user: true
          }
        },
        tool: true
      }
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    
    // Verificar se o terapeuta logado é o dono do agendamento
    if (appointment.therapist.userId !== req.user.id) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este agendamento' });
    }
    
    // Atualizar o status
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status }
    });
    
    // Criar notificação para o cliente
    let notificationMessage = '';
    switch (status) {
      case 'CONFIRMED':
        notificationMessage = `Seu agendamento de ${appointment.tool.name} com ${appointment.therapist.user.name} foi confirmado para ${appointment.date.toLocaleString()}`;
        break;
      case 'CANCELLED':
        notificationMessage = `Seu agendamento de ${appointment.tool.name} com ${appointment.therapist.user.name} foi cancelado`;
        break;
      case 'COMPLETED':
        notificationMessage = `Seu agendamento de ${appointment.tool.name} com ${appointment.therapist.user.name} foi marcado como concluído`;
        break;
    }
    
    if (notificationMessage) {
      await prisma.notification.create({
        data: {
          userId: appointment.client.userId,
          title: 'Atualização de Agendamento',
          message: notificationMessage
        }
      });
    }
    
    return res.json(updatedAppointment);
  } catch (error) {
    console.error('Erro ao atualizar status do agendamento:', error);
    return res.status(500).json({ message: 'Erro ao atualizar status do agendamento' });
  }
});

/**
 * @route GET /appointments
 * @desc Listar todos os agendamentos do usuário (terapeuta ou cliente)
 * @access Privado
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`Buscando agendamentos para usuário ${userId} com role ${userRole}`);

    let appointments = [];

    if (userRole === 'THERAPIST') {
      // Buscar o id do terapeuta relacionado ao usuário
      const therapist = await prisma.therapist.findFirst({
        where: { userId }
      });

      if (!therapist) {
        return res.status(404).json({ message: 'Perfil de terapeuta não encontrado' });
      }

      // Buscar agendamentos do terapeuta
      appointments = await prisma.appointment.findMany({
        where: { 
          therapistId: therapist.id
        },
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
        orderBy: {
          date: 'asc'
        }
      });

      console.log(`Encontrados ${appointments.length} agendamentos para o terapeuta ${therapist.id}`);
    } 
    else if (userRole === 'CLIENT') {
      // Buscar o id do cliente relacionado ao usuário
      const client = await prisma.client.findFirst({
        where: { userId }
      });

      if (!client) {
        return res.status(404).json({ message: 'Perfil de cliente não encontrado' });
      }

      // Buscar agendamentos do cliente
      appointments = await prisma.appointment.findMany({
        where: { 
          clientId: client.id
        },
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
        orderBy: {
          date: 'asc'
        }
      });

      console.log(`Encontrados ${appointments.length} agendamentos para o cliente ${client.id}`);
    }
    else {
      return res.status(403).json({ message: 'Papel de usuário não autorizado' });
    }

    // Formatar os dados para o frontend
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      clientId: appointment.clientId,
      therapistId: appointment.therapistId,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      mode: appointment.mode,
      price: appointment.price,
      duration: appointment.duration,
      client: appointment.client ? {
        id: appointment.client.id,
        name: appointment.client.user.name,
        email: appointment.client.user.email
      } : null,
      therapist: appointment.therapist ? {
        id: appointment.therapist.id,
        name: appointment.therapist.user.name,
        email: appointment.therapist.user.email
      } : null,
      tool: appointment.tool ? {
        id: appointment.tool.id,
        name: appointment.tool.name
      } : null,
      appointmentType: userRole.toLowerCase() // para distinguir a perspectiva
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
});

module.exports = router; 