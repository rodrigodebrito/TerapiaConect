const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();

// Configurar o cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
   * Salvar transcrição da sessão com detecção de emoções
   * @param {Request} req - Requisição Express 
   * @param {Response} res - Resposta Express
   */
  saveTranscript: async (req, res) => {
    try {
      const { sessionId, transcript, emotions } = req.body;
      const userId = req.user.id;

      // Verificar se a sessão existe e se o usuário tem acesso
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          therapist: true,
          client: true
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Sessão não encontrada' });
      }

      // Verificar se o usuário é o terapeuta ou o cliente da sessão
      const isTherapist = session.therapist?.userId === userId;
      const isClient = session.client?.userId === userId;
      
      if (!isTherapist && !isClient) {
        return res.status(403).json({ message: 'Acesso não autorizado a esta sessão' });
      }

      // Salvar ou atualizar a transcrição
      const savedTranscript = await prisma.sessionTranscript.upsert({
        where: {
          sessionId_timestamp: {
            sessionId,
            timestamp: new Date()
          }
        },
        update: {
          content: transcript,
          metadata: emotions ? JSON.stringify(emotions) : null,
          speaker: isTherapist ? 'THERAPIST' : 'CLIENT'
        },
        create: {
          sessionId,
          content: transcript,
          metadata: emotions ? JSON.stringify(emotions) : null,
          speaker: isTherapist ? 'THERAPIST' : 'CLIENT',
          timestamp: new Date()
        }
      });

      res.status(200).json({
        message: 'Transcrição salva com sucesso',
        data: savedTranscript
      });
    } catch (error) {
      console.error('Erro ao salvar transcrição:', error);
      res.status(500).json({ message: 'Erro ao processar solicitação', error: error.message });
    }
  },

  /**
   * Analisar sessão com base na transcrição
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  analyzeSession: async (req, res) => {
    try {
      console.log('AI Controller: Iniciando análise de sessão');
      const { sessionId, transcript } = req.body;
      const userId = req.user?.id;
      
      console.log(`AI Controller: Processando análise para sessão ${sessionId}, usuário ${userId}`);

      // Verificar se a sessão existe e se o usuário tem acesso
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          therapist: true
        }
      });

      if (!session) {
        console.log('AI Controller: Sessão não encontrada');
        return res.status(404).json({ 
          message: 'Sessão não encontrada',
          type: 'analysis',
          analysis: 'A sessão solicitada não foi encontrada no sistema.' 
        });
      }

      // Para testes ou desenvolvimento, permitir acesso mais amplo
      const isDevMode = process.env.NODE_ENV === 'development';
      const isTesting = process.env.TESTING === 'true';
      
      // Verificar se o usuário é o terapeuta da sessão (apenas terapeutas podem analisar)
      if (!isDevMode && !isTesting && session.therapist?.userId !== userId) {
        console.log(`AI Controller: Acesso não autorizado. Terapeuta: ${session.therapist?.userId}, Usuário: ${userId}`);
        return res.status(403).json({ 
          message: 'Apenas o terapeuta pode analisar a sessão',
          type: 'analysis',
          analysis: 'Você não tem permissão para analisar esta sessão.' 
        });
      }

      // Obter transcrição do banco de dados se não foi fornecida
      let sessionTranscript = transcript;
      if (!sessionTranscript) {
        const transcriptRecords = await prisma.sessionTranscript.findMany({
          where: {
            sessionId,
          },
          orderBy: {
            timestamp: 'asc'
          },
          take: 50
        });

        if (transcriptRecords && transcriptRecords.length > 0) {
          sessionTranscript = transcriptRecords
            .map(record => `${record.speaker}: ${record.content}`)
            .join('\n');
        }
      }

      if (!sessionTranscript) {
        console.log('AI Controller: Sem transcrição disponível');
        return res.status(400).json({ 
          message: 'Nenhuma transcrição disponível para análise',
          type: 'analysis',
          analysis: 'Não há transcrição disponível para analisar. Inicie uma conversa primeiro.' 
        });
      }

      // Verificar se a API OpenAI está configurada
      if (!process.env.OPENAI_API_KEY) {
        console.error('AI Controller: API OpenAI não configurada');
        return res.status(500).json({
          message: 'Erro de configuração do serviço de IA',
          error: 'API OpenAI não configurada',
          type: 'analysis',
          analysis: 'O serviço de IA não está configurado corretamente. Entre em contato com o administrador do sistema.'
        });
      }

      try {
        console.log('AI Controller: Gerando análise via OpenAI');
        // Gerar análise usando OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em psicoterapia que ajuda terapeutas a analisar sessões. 
              Analise a transcrição da sessão e forneça insights sobre:
              1. Temas principais discutidos
              2. Padrões emocionais observados
              3. Possíveis questões subjacentes
              4. Progresso em relação a sessões anteriores (se mencionado)
              5. Pontos importantes para acompanhamento
              
              Formate a resposta de maneira clara, concisa e profissional.`
            },
            {
              role: "user",
              content: `Analise a seguinte transcrição de sessão de terapia:\n\n${sessionTranscript}`
            }
          ],
          max_tokens: 1000,
        });

        console.log('AI Controller: Resposta recebida do OpenAI');
        const analysisText = completion.choices[0].message.content;
        
        // Salvar a análise no banco de dados
        const savedAnalysis = await prisma.aIInsight.create({
          data: {
            sessionId,
            content: analysisText,
            type: 'ANALYSIS',
            keywords: 'temas, padrões, emoções, progresso, acompanhamento'
          }
        });

        console.log('AI Controller: Retornando resposta estruturada');
        res.status(200).json({
          message: 'Análise gerada com sucesso',
          type: 'analysis',
          content: 'Análise baseada na transcrição da sessão atual',
          analysis: analysisText,
          data: {
            analysis: analysisText,
            id: savedAnalysis.id
          }
        });
      } catch (openaiError) {
        console.error('AI Controller: Erro na chamada da API OpenAI:', openaiError);
        return res.status(500).json({
          message: 'Erro ao processar com a IA',
          error: openaiError.message,
          type: 'analysis',
          analysis: 'Ocorreu um erro ao gerar a análise com a IA. Tente novamente em alguns instantes.'
        });
      }
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      res.status(500).json({ 
        message: 'Erro ao processar solicitação', 
        error: error.message,
        type: 'analysis',
        analysis: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      });
    }
  },

  /**
   * Gerar sugestões para sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  generateSuggestions: async (req, res) => {
    try {
      console.log('AI Controller: Iniciando geração de sugestões');
      const { sessionId, transcript } = req.body;
      const userId = req.user?.id;
      
      console.log(`AI Controller: Processando sugestões para sessão ${sessionId}, usuário ${userId}`);

      // Verificar se a sessão existe e se o usuário tem acesso
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          therapist: true
        }
      });

      if (!session) {
        console.log('AI Controller: Sessão não encontrada');
        return res.status(404).json({ 
          message: 'Sessão não encontrada',
          type: 'suggestions',
          suggestions: ['A sessão não foi encontrada. Verifique o ID da sessão.'] 
        });
      }

      // Para testes ou desenvolvimento, permitir acesso mais amplo
      const isDevMode = process.env.NODE_ENV === 'development';
      const isTesting = process.env.TESTING === 'true';
      
      // Verificar se o usuário é o terapeuta da sessão
      if (!isDevMode && !isTesting && session.therapist?.userId !== userId) {
        console.log(`AI Controller: Acesso não autorizado. Terapeuta: ${session.therapist?.userId}, Usuário: ${userId}`);
        return res.status(403).json({ 
          message: 'Apenas o terapeuta pode gerar sugestões',
          type: 'suggestions',
          suggestions: ['Você não tem permissão para gerar sugestões para esta sessão.'] 
        });
      }

      // Obter transcrição do banco de dados se não foi fornecida
      let sessionTranscript = transcript;
      if (!sessionTranscript) {
        const transcriptRecords = await prisma.sessionTranscript.findMany({
          where: {
            sessionId,
          },
          orderBy: {
            timestamp: 'asc'
          },
          take: 50
        });

        if (transcriptRecords && transcriptRecords.length > 0) {
          sessionTranscript = transcriptRecords
            .map(record => `${record.speaker}: ${record.content}`)
            .join('\n');
        }
      }

      if (!sessionTranscript) {
        console.log('AI Controller: Sem transcrição disponível');
        return res.status(400).json({ 
          message: 'Nenhuma transcrição disponível para gerar sugestões',
          type: 'suggestions',
          suggestions: ['Não há transcrição disponível. Inicie uma conversa primeiro.'] 
        });
      }

      // Verificar se a API OpenAI está configurada
      if (!process.env.OPENAI_API_KEY) {
        console.error('AI Controller: API OpenAI não configurada');
        return res.status(500).json({
          message: 'Erro de configuração do serviço de IA',
          error: 'API OpenAI não configurada',
          type: 'suggestions',
          suggestions: [
            'O serviço de IA não está configurado corretamente.',
            'Entre em contato com o administrador do sistema.'
          ]
        });
      }

      try {
        console.log('AI Controller: Gerando sugestões via OpenAI');
        // Gerar sugestões usando OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em psicoterapia que ajuda terapeutas a desenvolver planos de tratamento.
              Com base na transcrição da sessão, forneça 5-7 sugestões práticas para:
              1. Técnicas terapêuticas que poderiam ser aplicadas
              2. Exercícios ou tarefas para o paciente
              3. Tópicos a explorar na próxima sessão
              4. Recursos adicionais que poderiam ser úteis
              
              Formate as sugestões de maneira clara, concisa e prática.`
            },
            {
              role: "user",
              content: `Gere sugestões para a seguinte transcrição de sessão de terapia:\n\n${sessionTranscript}`
            }
          ],
          max_tokens: 800,
        });

        console.log('AI Controller: Resposta recebida do OpenAI');
        const suggestionsText = completion.choices[0].message.content;
        
        // Processar texto em sugestões individuais
        const suggestionLines = suggestionsText
          .split(/\n+/)
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .filter(line => !line.match(/^[0-9]+\./) && !line.match(/^[A-Z]+:/)); // Remover numeração e títulos
        
        console.log('AI Controller: Sugestões processadas:', suggestionLines.length);

        // Salvar as sugestões no banco de dados
        const savedSuggestion = await prisma.aIInsight.create({
          data: {
            sessionId,
            content: suggestionsText,
            type: 'SUGGESTION',
            keywords: 'técnicas, exercícios, tópicos, recursos'
          }
        });

        console.log('AI Controller: Retornando resposta estruturada');
        res.status(200).json({
          message: 'Sugestões geradas com sucesso',
          type: 'suggestions',
          content: 'Sugestões baseadas na análise da sessão atual',
          suggestions: suggestionLines.length > 0 ? suggestionLines : [suggestionsText],
          data: {
            suggestions: suggestionsText,
            id: savedSuggestion.id
          }
        });
      } catch (openaiError) {
        console.error('AI Controller: Erro na chamada da API OpenAI:', openaiError);
        return res.status(500).json({
          message: 'Erro ao processar com a IA',
          error: openaiError.message,
          type: 'suggestions',
          suggestions: [
            'Ocorreu um erro ao gerar sugestões com a IA.',
            'Tente novamente em alguns instantes.'
          ]
        });
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      res.status(500).json({ 
        message: 'Erro ao processar solicitação', 
        error: error.message,
        type: 'suggestions',
        suggestions: ['Ocorreu um erro inesperado. Tente novamente mais tarde.']
      });
    }
  },

  /**
   * Gerar relatório da sessão
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  generateReport: async (req, res) => {
    try {
      console.log('AI Controller: Iniciando geração de relatório');
      const { sessionId, transcript } = req.body;
      const userId = req.user?.id;
      
      console.log(`AI Controller: Processando relatório para sessão ${sessionId}, usuário ${userId}`);

      // Verificar se a sessão existe e se o usuário tem acesso
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          therapist: true
        }
      });

      if (!session) {
        console.log('AI Controller: Sessão não encontrada');
        return res.status(404).json({ 
          message: 'Sessão não encontrada',
          type: 'report',
          report: 'A sessão solicitada não foi encontrada no sistema.',
          content: 'A sessão solicitada não foi encontrada no sistema.'
        });
      }

      // Para testes ou desenvolvimento, permitir acesso mais amplo
      const isDevMode = process.env.NODE_ENV === 'development';
      const isTesting = process.env.TESTING === 'true';
      
      // Verificar se o usuário é o terapeuta da sessão
      if (!isDevMode && !isTesting && session.therapist?.userId !== userId) {
        console.log(`AI Controller: Acesso não autorizado. Terapeuta: ${session.therapist?.userId}, Usuário: ${userId}`);
        return res.status(403).json({ 
          message: 'Apenas o terapeuta pode gerar relatórios',
          type: 'report',
          report: 'Você não tem permissão para gerar relatórios para esta sessão.',
          content: 'Você não tem permissão para gerar relatórios para esta sessão.'
        });
      }

      // Obter transcrição do banco de dados se não foi fornecida
      let sessionTranscript = transcript;
      if (!sessionTranscript) {
        const transcriptRecords = await prisma.sessionTranscript.findMany({
          where: {
            sessionId,
          },
          orderBy: {
            timestamp: 'asc'
          },
          take: 50
        });

        if (transcriptRecords && transcriptRecords.length > 0) {
          sessionTranscript = transcriptRecords
            .map(record => `${record.speaker}: ${record.content}`)
            .join('\n');
        }
      }

      if (!sessionTranscript) {
        console.log('AI Controller: Sem transcrição disponível');
        return res.status(400).json({ 
          message: 'Nenhuma transcrição disponível para gerar relatório',
          type: 'report',
          report: 'Não há transcrição disponível. Inicie uma conversa primeiro para gerar um relatório.',
          content: 'Não há transcrição disponível. Inicie uma conversa primeiro para gerar um relatório.'
        });
      }

      // Verificar se a API OpenAI está configurada
      if (!process.env.OPENAI_API_KEY) {
        console.error('AI Controller: API OpenAI não configurada');
        return res.status(500).json({
          message: 'Erro de configuração do serviço de IA',
          error: 'API OpenAI não configurada',
          type: 'report',
          report: 'O serviço de IA não está configurado corretamente. Entre em contato com o administrador do sistema.',
          content: 'O serviço de IA não está configurado corretamente.'
        });
      }

      try {
        console.log('AI Controller: Gerando relatório via OpenAI');
        // Gerar relatório usando OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado em psicoterapia que ajuda terapeutas a criar relatórios de sessão.
              Elabore um relatório formal e profissional da sessão com as seguintes seções:
              1. Resumo da Sessão
              2. Temas Principais
              3. Estado Emocional do Paciente
              4. Intervenções Realizadas
              5. Progresso Observado
              6. Plano de Tratamento Contínuo
              
              Mantenha o tom profissional e use linguagem apropriada para documentação clínica.`
            },
            {
              role: "user",
              content: `Gere um relatório profissional para a seguinte transcrição de sessão de terapia:\n\n${sessionTranscript}`
            }
          ],
          max_tokens: 1200,
        });

        console.log('AI Controller: Resposta recebida do OpenAI');
        const reportText = completion.choices[0].message.content;
        
        // Registrar o tamanho do relatório para depuração
        console.log(`AI Controller: Relatório gerado com ${reportText.length} caracteres`);
        console.log('AI Controller: Primeiros 100 caracteres:', reportText.substring(0, 100));
        
        // Salvar o relatório no banco de dados
        const savedReport = await prisma.aIInsight.create({
          data: {
            sessionId,
            content: reportText,
            type: 'REPORT',
            keywords: 'resumo, temas, emoções, intervenções, progresso, plano'
          }
        });

        console.log('AI Controller: Retornando resposta estruturada');
        // Colocar o relatório em TODOS os campos possíveis para garantir que o frontend possa acessá-lo
        res.status(200).json({
          message: 'Relatório gerado com sucesso',
          type: 'report',
          content: reportText,
          report: reportText,
          data: {
            report: reportText,
            id: savedReport.id
          },
          text: reportText, // Campo adicional para garantir
          reportText: reportText // Campo adicional para garantir
        });
      } catch (openaiError) {
        console.error('AI Controller: Erro na chamada da API OpenAI:', openaiError);
        return res.status(500).json({
          message: 'Erro ao processar com a IA',
          error: openaiError.message,
          type: 'report',
          report: 'Ocorreu um erro ao gerar o relatório com a IA. Tente novamente em alguns instantes.',
          content: 'Ocorreu um erro ao gerar o relatório com a IA. Tente novamente em alguns instantes.'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ 
        message: 'Erro ao processar solicitação', 
        error: error.message,
        type: 'report',
        report: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
        content: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      });
    }
  },

  /**
   * Verificar se a API OpenAI está configurada e funcionando
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  checkOpenAI: async (req, res) => {
    try {
      console.log('AI Controller: Verificando configuração da API OpenAI');
      
      // Verificar se a chave da API está configurada
      if (!process.env.OPENAI_API_KEY) {
        console.error('AI Controller: API OpenAI não configurada - chave ausente');
        return res.status(500).json({
          status: 'error',
          message: 'API OpenAI não configurada - chave ausente',
          configured: false
        });
      }
      
      // Testar a conexão com a API OpenAI
      try {
        const testPrompt = "Responda apenas com 'API funcionando': Este é um teste de conectividade.";
        console.log('AI Controller: Testando conexão com OpenAI');
        
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: "Você é um assistente que responde de forma muito concisa."
            },
            {
              role: "user",
              content: testPrompt
            }
          ],
          max_tokens: 20,
        });
        
        const response = completion.choices[0].message.content;
        console.log('AI Controller: Resposta do teste OpenAI:', response);
        
        res.status(200).json({
          status: 'success',
          message: 'API OpenAI configurada e funcionando',
          configured: true,
          test_response: response
        });
      } catch (openaiError) {
        console.error('AI Controller: Erro ao testar API OpenAI:', openaiError);
        return res.status(500).json({
          status: 'error',
          message: 'Erro ao conectar com a API OpenAI',
          error: openaiError.message,
          configured: false
        });
      }
    } catch (error) {
      console.error('Erro ao verificar API OpenAI:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Erro ao processar solicitação', 
        error: error.message,
        configured: false
      });
    }
  },
};

module.exports = aiController; 