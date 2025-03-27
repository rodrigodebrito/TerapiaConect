const prisma = require('../lib/prisma');

const availabilityController = {
  async create(req, res) {
    try {
      const { therapistId } = req.params;
      const { dayOfWeek, startTime, endTime, isRecurring, date } = req.body;

      // Validar dados
      if (!dayOfWeek || !startTime || !endTime) {
        return res.status(400).json({ 
          error: 'Dia da semana, horário inicial e final são obrigatórios' 
        });
      }

      // Verificar se o terapeuta existe
      const therapist = await prisma.therapist.findUnique({
        where: { id: therapistId }
      });

      if (!therapist) {
        return res.status(404).json({ error: 'Terapeuta não encontrado' });
      }

      // Criar disponibilidade
      const availability = await prisma.availability.create({
        data: {
          therapistId,
          dayOfWeek,
          startTime,
          endTime,
          isRecurring: isRecurring ?? true,
          date
        }
      });

      res.json(availability);
    } catch (error) {
      console.error('Erro ao criar disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao criar disponibilidade' });
    }
  },

  async getByTherapist(req, res) {
    try {
      const { therapistId } = req.params;
      
      const availability = await prisma.availability.findMany({
        where: { therapistId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });

      res.json(availability);
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { dayOfWeek, startTime, endTime, isRecurring, date } = req.body;

      const availability = await prisma.availability.update({
        where: { id },
        data: {
          dayOfWeek,
          startTime,
          endTime,
          isRecurring,
          date
        }
      });

      res.json(availability);
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao atualizar disponibilidade' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      await prisma.availability.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao excluir disponibilidade' });
    }
  }
};

module.exports = availabilityController; 