const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

/**
 * Controlador para gerenciar sessões
 */
const sessionController = {
  /**
   * Criar uma nova sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  createSession: async (req, res) => {
    try {
      // Validar request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentId, title, scheduledDuration, toolsUsed } = req.body;

      // Buscar o agendamento para obter therapistId e clientId
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          therapist: true,
          client: true
        }
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
      }

      // Verificar se o usuário atual é o terapeuta ou cliente envolvido
      const userId = req.user.id;
      const isTherapist = appointment.therapist.userId === userId;
      const isClient = appointment.client.userId === userId;

      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Não autorizado a criar sessão para este agendamento' });
      }

      // Verificar se já existe uma sessão para este agendamento
      const existingSession = await prisma.session.findFirst({
        where: { appointmentId }
      });

      if (existingSession) {
        return res.status(400).json({ message: 'Já existe uma sessão para este agendamento' });
      }

      // Criar a sessão
      const session = await prisma.session.create({
        data: {
          appointmentId,
          therapistId: appointment.therapistId,
          clientId: appointment.clientId,
          title: title || `Sessão - ${new Date().toLocaleDateString('pt-BR')}`,
          status: 'SCHEDULED',
          scheduledDuration: scheduledDuration || appointment.duration,
          toolsUsed: toolsUsed || {}
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.status(201).json(session);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      res.status(500).json({ message: 'Erro ao criar sessão' });
    }
  },

  /**
   * Obter detalhes de uma sessão por ID
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  getSessionById: async (req, res) => {
    try {
      const { id } = req.params;

      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Verificar se o usuário atual tem permissão para ver a sessão
      const userId = req.user.id;
      const isTherapist = session.therapist.userId === userId;
      const isClient = session.client.userId === userId;

      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Não autorizado a acessar esta sessão' });
      }

      res.json(session);
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      res.status(500).json({ message: 'Erro ao buscar sessão' });
    }
  },

  /**
   * Listar sessões do usuário (terapeuta ou cliente)
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  getUserSessions: async (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      let sessions = [];

      if (role === 'THERAPIST') {
        // Buscar o id do terapeuta
        const therapist = await prisma.therapist.findFirst({
          where: { userId }
        });

        if (!therapist) {
          return res.status(404).json({ message: 'Terapeuta não encontrado' });
        }

        // Buscar sessões como terapeuta
        sessions = await prisma.session.findMany({
          where: { therapistId: therapist.id },
          include: {
            client: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: { startTime: 'desc' }
        });
      } else if (role === 'CLIENT') {
        // Buscar o id do cliente
        const client = await prisma.client.findFirst({
          where: { userId }
        });

        if (!client) {
          return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        // Buscar sessões como cliente
        sessions = await prisma.session.findMany({
          where: { clientId: client.id },
          include: {
            therapist: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: { startTime: 'desc' }
        });
      }

      res.json(sessions);
    } catch (error) {
      console.error('Erro ao listar sessões:', error);
      res.status(500).json({ message: 'Erro ao listar sessões' });
    }
  },

  /**
   * Iniciar uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  startSession: async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar a sessão
      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode iniciar a sessão
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode iniciar a sessão' });
      }

      // Verificar se a sessão já foi iniciada
      if (session.status !== 'SCHEDULED') {
        return res.status(400).json({ message: `Sessão não pode ser iniciada, status atual: ${session.status}` });
      }

      // Atualizar a sessão para ACTIVE
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          startTime: new Date()
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      res.status(500).json({ message: 'Erro ao iniciar sessão' });
    }
  },

  /**
   * Pausar uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  pauseSession: async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar a sessão
      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode pausar a sessão
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode pausar a sessão' });
      }

      // Verificar se a sessão está ativa
      if (session.status !== 'ACTIVE') {
        return res.status(400).json({ message: `Sessão não pode ser pausada, status atual: ${session.status}` });
      }

      // Atualizar a sessão para PAUSED
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status: 'PAUSED'
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Erro ao pausar sessão:', error);
      res.status(500).json({ message: 'Erro ao pausar sessão' });
    }
  },

  /**
   * Retomar uma sessão pausada
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  resumeSession: async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar a sessão
      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode retomar a sessão
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode retomar a sessão' });
      }

      // Verificar se a sessão está pausada
      if (session.status !== 'PAUSED') {
        return res.status(400).json({ message: `Sessão não pode ser retomada, status atual: ${session.status}` });
      }

      // Atualizar a sessão para ACTIVE
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status: 'ACTIVE'
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Erro ao retomar sessão:', error);
      res.status(500).json({ message: 'Erro ao retomar sessão' });
    }
  },

  /**
   * Finalizar uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  endSession: async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar a sessão
      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode finalizar a sessão
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode finalizar a sessão' });
      }

      // Verificar se a sessão está ativa ou pausada
      if (session.status !== 'ACTIVE' && session.status !== 'PAUSED') {
        return res.status(400).json({ message: `Sessão não pode ser finalizada, status atual: ${session.status}` });
      }

      // Calcular a duração real da sessão (em minutos)
      let actualDuration = 0;
      if (session.startTime) {
        const startTime = new Date(session.startTime).getTime();
        const endTime = new Date().getTime();
        actualDuration = Math.round((endTime - startTime) / (1000 * 60));
      } else {
        actualDuration = session.scheduledDuration;
      }

      // Atualizar a sessão para COMPLETED
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
          actualDuration
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Atualizar o agendamento para COMPLETED
      await prisma.appointment.update({
        where: { id: session.appointmentId },
        data: { status: 'COMPLETED' }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      res.status(500).json({ message: 'Erro ao finalizar sessão' });
    }
  },

  /**
   * Cancelar uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  cancelSession: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Buscar a sessão
      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          therapist: true,
          client: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Verificar se o usuário atual é o terapeuta ou cliente envolvido
      const userId = req.user.id;
      const isTherapist = session.therapist.userId === userId;
      const isClient = session.client.userId === userId;

      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Não autorizado a cancelar esta sessão' });
      }

      // Verificar se a sessão já foi completada ou cancelada
      if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
        return res.status(400).json({ message: `Sessão não pode ser cancelada, status atual: ${session.status}` });
      }

      // Atualizar a sessão para CANCELLED
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: reason ? (session.notes ? `${session.notes}\n\nMotivo do cancelamento: ${reason}` : `Motivo do cancelamento: ${reason}`) : session.notes
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Atualizar o agendamento para CANCELLED
      await prisma.appointment.update({
        where: { id: session.appointmentId },
        data: { status: 'CANCELLED' }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error);
      res.status(500).json({ message: 'Erro ao cancelar sessão' });
    }
  },

  /**
   * Atualizar notas da sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  updateSessionNotes: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Buscar a sessão
      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode atualizar as notas
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode atualizar as notas da sessão' });
      }

      // Atualizar as notas
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          notes
        },
        include: {
          therapist: {
            include: {
              user: {
                select: {
                  id: true,
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
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Erro ao atualizar notas da sessão:', error);
      res.status(500).json({ message: 'Erro ao atualizar notas da sessão' });
    }
  }
};

module.exports = sessionController; 