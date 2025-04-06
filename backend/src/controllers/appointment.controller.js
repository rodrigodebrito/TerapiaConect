const prisma = require('../lib/prisma');
const { addHours, parseISO } = require('date-fns');

const appointmentController = {
  async create(req, res) {
    try {
      const { therapistId, date } = req.body;
      const clientId = req.user.id;

      // Verificar se o terapeuta existe
      const therapist = await prisma.therapist.findUnique({
        where: { id: therapistId }
      });

      if (!therapist) {
        return res.status(404).json({ error: 'Terapeuta não encontrado' });
      }

      // Verificar se o terapeuta tem preço e duração configurados
      if (!therapist.baseSessionPrice || !therapist.sessionDuration) {
        return res.status(400).json({ 
          error: 'O terapeuta ainda não configurou o preço e duração das sessões' 
        });
      }

      // Verificar disponibilidade
      const appointmentDate = parseISO(date);
      const dayOfWeek = appointmentDate.getDay();
      const timeStr = appointmentDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      const availability = await prisma.availability.findFirst({
        where: {
          therapistId,
          dayOfWeek,
          startTime: { lte: timeStr },
          endTime: { gte: timeStr },
          isRecurring: true
        }
      });

      if (!availability) {
        return res.status(400).json({ 
          error: 'O terapeuta não tem disponibilidade neste horário' 
        });
      }

      // Verificar se já existe agendamento neste horário
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          therapistId,
          date: appointmentDate,
          NOT: { status: 'CANCELLED' }
        }
      });

      if (existingAppointment) {
        return res.status(400).json({ 
          error: 'Já existe uma sessão agendada neste horário' 
        });
      }

      // Criar o agendamento
      const appointment = await prisma.appointment.create({
        data: {
          therapistId,
          clientId,
          date: appointmentDate,
          duration: therapist.sessionDuration,
          price: therapist.baseSessionPrice,
          status: 'PENDING'
        },
        include: {
          therapist: {
            include: {
              user: true
            }
          },
          client: true
        }
      });

      res.json(appointment);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
  },

  async getByTherapist(req, res) {
    try {
      const { therapistId } = req.params;
      const appointments = await prisma.appointment.findMany({
        where: { therapistId },
        include: {
          client: true
        },
        orderBy: { date: 'asc' }
      });
      res.json(appointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
  },

  async getByClient(req, res) {
    try {
      const clientId = req.user.id;
      const appointments = await prisma.appointment.findMany({
        where: { clientId },
        include: {
          therapist: {
            include: {
              user: true
            }
          }
        },
        orderBy: { date: 'asc' }
      });
      res.json(appointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
          therapist: {
            include: {
              user: true
            }
          },
          client: true
        }
      });

      res.json(appointment);
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      res.status(500).json({ error: 'Erro ao atualizar status do agendamento' });
    }
  }
};

module.exports = appointmentController; 