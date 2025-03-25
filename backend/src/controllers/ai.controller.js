const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');
const openAIService = require('../services/ai/openai.service');

/**
 * Controlador para operações relacionadas a IA
 */
const aiController = {
  /**
   * Adicionar uma nova transcrição
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  addTranscription: async (req, res) => {
    try {
      // Validar request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId, speaker, content } = req.body;
      const timestamp = req.body.timestamp || new Date();

      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
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
        return res.status(403).json({ message: 'Não autorizado a adicionar transcrições a esta sessão' });
      }

      // Adicionar a transcrição
      const transcription = await prisma.sessionTranscript.create({
        data: {
          sessionId,
          speaker,
          content,
          timestamp
        }
      });

      // Se a sessão estiver em andamento, verificar se precisamos gerar insights
      if (session.status === 'ACTIVE') {
        // Aqui poderíamos chamar um serviço de IA para gerar insights
        // de forma assíncrona em uma fila de processamento
        // Por enquanto, simulamos o comportamento
        this.generateInsightsForSession(sessionId).catch(err => {
          console.error('Erro ao gerar insights:', err);
        });
      }

      res.status(201).json(transcription);
    } catch (error) {
      console.error('Erro ao adicionar transcrição:', error);
      res.status(500).json({ message: 'Erro ao adicionar transcrição' });
    }
  },

  /**
   * Listar transcrições de uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  getSessionTranscripts: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
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
        return res.status(403).json({ message: 'Não autorizado a visualizar transcrições desta sessão' });
      }

      // Buscar as transcrições
      const transcripts = await prisma.sessionTranscript.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit
      });

      // Contar o total para paginação
      const total = await prisma.sessionTranscript.count({
        where: { sessionId }
      });

      res.json({
        data: transcripts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao listar transcrições:', error);
      res.status(500).json({ message: 'Erro ao listar transcrições' });
    }
  },

  /**
   * Gerar insights para uma sessão usando OpenAI
   * @param {string} sessionId - ID da sessão
   * @private
   */
  generateInsightsForSession: async (sessionId) => {
    try {
      // Buscar as últimas 10 transcrições
      const recentTranscripts = await prisma.sessionTranscript.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      if (recentTranscripts.length < 3) {
        // Não gerar insights com poucas transcrições
        return;
      }

      // Preparar o texto para análise
      const transcriptText = recentTranscripts
        .reverse()
        .map(t => `${t.speaker}: ${t.content}`)
        .join('\n');

      // Gerar insights usando OpenAI
      const analysis = await openAIService.analyzeText(transcriptText);
      
      // Criar o insight
      await prisma.aIInsight.create({
        data: {
          sessionId,
          content: analysis,
          type: 'ANALYSIS',
          keywords: 'emoções, padrão, comunicação'
        }
      });
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      throw error;
    }
  },

  /**
   * Manualmente solicitar geração de insights
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  requestInsight: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode solicitar insights
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode solicitar insights' });
      }

      // Gerar o insight de forma síncrona para demonstração
      const content = req.body.prompt 
        ? `Análise baseada no prompt: ${req.body.prompt}`
        : "Análise gerada a partir das transcrições recentes. Observe como o cliente demonstra padrões emocionais que podem estar relacionados a experiências passadas.";
      
      const insight = await prisma.aIInsight.create({
        data: {
          sessionId,
          content,
          type: 'MANUAL_REQUEST',
          keywords: req.body.keywords || 'análise, emoções, padrões'
        }
      });

      res.status(201).json(insight);
    } catch (error) {
      console.error('Erro ao solicitar insight:', error);
      res.status(500).json({ message: 'Erro ao solicitar insight' });
    }
  },

  /**
   * Listar insights de uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  getSessionInsights: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
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
        return res.status(403).json({ message: 'Não autorizado a visualizar insights desta sessão' });
      }

      // Insights só são mostrados para terapeuta, a menos que esteja configurado para compartilhar
      if (isClient && !session.shareInsightsWithClient) {
        return res.status(403).json({ message: 'Insights não disponíveis para o cliente' });
      }

      // Buscar os insights
      const insights = await prisma.aIInsight.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'desc' }
      });

      res.json(insights);
    } catch (error) {
      console.error('Erro ao listar insights:', error);
      res.status(500).json({ message: 'Erro ao listar insights' });
    }
  },

  /**
   * Gerar resumo de sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  generateSessionSummary: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true,
          transcripts: {
            orderBy: {
              timestamp: 'asc'
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode gerar resumo
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode gerar resumo da sessão' });
      }

      // Verificar se tem transcrições suficientes
      if (session.transcripts.length < 5) {
        return res.status(400).json({ message: 'Não há transcrições suficientes para gerar um resumo' });
      }

      // Simulação de resumo
      // Em um cenário real, enviaria as transcrições para uma API de IA
      const summary = {
        title: session.title,
        date: session.startTime,
        duration: session.actualDuration || session.scheduledDuration,
        mainTopics: ["Ansiedade", "Relacionamentos", "Trabalho"],
        keyPoints: [
          "Cliente relatou episódios de ansiedade no ambiente de trabalho",
          "Discutidos padrões de comunicação em relacionamentos",
          "Identificado gatilho relacionado a experiências passadas"
        ],
        nextSteps: [
          "Explorar técnicas de gerenciamento de ansiedade",
          "Trabalhar na identificação precoce de gatilhos",
          "Desenvolver estratégias de comunicação assertiva"
        ],
        overallProgress: "Progresso significativo na identificação de padrões emocionais"
      };

      res.json(summary);
    } catch (error) {
      console.error('Erro ao gerar resumo da sessão:', error);
      res.status(500).json({ message: 'Erro ao gerar resumo da sessão' });
    }
  },

  /**
   * Analisar uma sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  analyzeSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verificar se a sessão existe
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          therapist: true,
          transcripts: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Apenas o terapeuta pode analisar a sessão
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode analisar a sessão' });
      }

      // Preparar o texto da sessão para análise
      const sessionText = session.transcripts
        .map(t => `${t.speaker}: ${t.content}`)
        .join('\n');

      // Analisar a sessão com OpenAI
      const analysis = await openAIService.analyzeText(sessionText);

      res.json({ analysis });
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      res.status(500).json({ message: 'Erro ao analisar sessão' });
    }
  },

  /**
   * Gerar sugestões em tempo real
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  generateSuggestions: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verificar se a sessão existe e está ativa
      const session = await prisma.session.findUnique({
        where: { 
          id: sessionId,
          status: 'ACTIVE'
        },
        include: {
          therapist: true,
          transcripts: {
            orderBy: { timestamp: 'desc' },
            take: 5 // Últimas 5 transcrições para contexto
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada ou não está ativa' });
      }

      // Apenas o terapeuta pode receber sugestões
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode receber sugestões' });
      }

      // Preparar o contexto atual
      const context = session.transcripts
        .reverse()
        .map(t => `${t.speaker}: ${t.content}`)
        .join('\n');

      // Gerar sugestões com OpenAI
      const suggestions = await openAIService.generateSuggestions(context);

      res.json({ suggestions });
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      res.status(500).json({ message: 'Erro ao gerar sugestões' });
    }
  },

  /**
   * Gerar relatório da sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  generateReport: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Verificar se a sessão existe e está finalizada
      const session = await prisma.session.findUnique({
        where: { 
          id: sessionId,
          status: 'COMPLETED'
        },
        include: {
          therapist: true,
          client: true,
          transcripts: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada ou não está finalizada' });
      }

      // Apenas o terapeuta pode gerar relatórios
      const userId = req.user.id;
      if (session.therapist.userId !== userId) {
        return res.status(403).json({ message: 'Apenas o terapeuta pode gerar relatórios' });
      }

      // Preparar o conteúdo completo da sessão
      const sessionContent = `
Sessão de Terapia
Data: ${session.date}
Terapeuta: ${session.therapist.name}
Cliente: ${session.client.name}

Transcrição:
${session.transcripts.map(t => `${t.speaker}: ${t.content}`).join('\n')}
      `.trim();

      // Gerar relatório com OpenAI
      const report = await openAIService.generateReport(sessionContent);

      // Salvar o relatório
      const savedReport = await prisma.sessionReport.create({
        data: {
          sessionId,
          content: report,
          generatedBy: 'AI'
        }
      });

      res.json({ report: savedReport });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ message: 'Erro ao gerar relatório' });
    }
  }
};

module.exports = aiController; 