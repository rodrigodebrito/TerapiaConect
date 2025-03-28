const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const { validationResult } = require('express-validator');
const trainingService = require('../services/ai/training.service');
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

      // Se o transcript não foi fornecido, buscar do banco de dados
      if (!transcript) {
        console.log(`AI Controller: Transcript não fornecido, buscando do banco de dados`);
        
        let messages = [];
        
        // Tentar buscar de diferentes modelos possíveis no banco de dados
        try {
          // Verificar se existe o modelo Message
          messages = await prisma.message.findMany({
            where: {
              sessionId: sessionId
            },
            orderBy: {
              timestamp: 'asc'
            }
          });
        } catch (err) {
          console.log(`AI Controller: Erro ao buscar de Message, tentando SessionTranscript: ${err.message}`);
          
          // Se não existir Message, tentar SessionTranscript
          try {
            const transcripts = await prisma.sessionTranscript.findMany({
              where: {
                sessionId: sessionId
              },
              orderBy: {
                timestamp: 'asc'
              }
            });
            
            // Converter do formato SessionTranscript para um formato similar a Message
            messages = transcripts.map(t => ({
              sender: t.speaker,
              content: t.content,
              timestamp: t.timestamp
            }));
          } catch (err2) {
            console.error(`AI Controller: Erro ao buscar transcrições: ${err2.message}`);
          }
        }

        if (!messages || messages.length === 0) {
          console.error(`AI Controller: Nenhuma mensagem encontrada para a sessão ${sessionId}`);
          return res.status(400).json({
            error: 'Não há mensagens na sessão para gerar um relatório',
            success: false
          });
        }

        // Montar o transcript a partir das mensagens
        transcript = messages.map(msg => {
          // Determinar quem é o sender (pode variar dependendo do modelo)
          let sender;
          if (typeof msg.sender === 'string') {
            // Se já for uma string, tentar padronizar
            sender = msg.sender.toUpperCase() === 'THERAPIST' || 
                     msg.sender.toUpperCase() === 'TERAPEUTA' ? 
                     'Terapeuta' : 'Paciente';
          } else {
            // Caso contrário, usar um valor padrão
            sender = 'Participante';
          }
          
          return `${sender}: ${msg.content}`;
        }).join('\n');
      }

      if (!transcript || transcript.length < 50) {
        console.error(`AI Controller: Transcript muito curto (${transcript?.length || 0} caracteres)`);
        return res.status(400).json({
          error: 'Conteúdo insuficiente para gerar um relatório',
          success: false,
          report: 'A sessão não possui conteúdo suficiente para gerar um relatório detalhado.'
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
        
        // Extrair temas principais da transcrição para identificar materiais relevantes
        console.log('AI Controller: Extraindo temas da transcrição para buscar materiais relevantes');
        const themesCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Extraia os principais temas e conceitos da transcrição da sessão. Retorne apenas uma lista de palavras-chave separadas por vírgula, sem explicações adicionais."
            },
            {
              role: "user",
              content: `Extraia os temas principais desta transcrição de sessão terapêutica:\n\n${transcript}`
            }
          ],
          max_tokens: 100,
        });
        
        // Extrair os temas como uma array
        const keywords = themesCompletion.choices[0].message.content.split(',').map(k => k.trim());
        console.log('AI Controller: Temas identificados:', keywords);
        
        // Buscar materiais de treinamento relevantes para esses temas
        let allMaterials = [];
        try {
          // Buscar materiais para cada palavra-chave identificada
          const materialPromises = keywords.map(keyword => 
            prisma.trainingMaterial.findMany({
              where: {
                OR: [
                  { title: { contains: keyword, mode: 'insensitive' } },
                  { content: { contains: keyword, mode: 'insensitive' } },
                  { insights: { contains: keyword, mode: 'insensitive' } },
                  { category: { contains: keyword, mode: 'insensitive' } }
                ],
                status: 'processed'
              },
              select: {
                id: true,
                title: true,
                insights: true,
                category: true
              }
            })
          );
          
          const materialsArrays = await Promise.all(materialPromises);
          // Juntar todos os resultados e remover duplicatas por ID
          const materialsMap = new Map();
          materialsArrays.flat().forEach(m => {
            if (!materialsMap.has(m.id)) {
              materialsMap.set(m.id, m);
            }
          });
          
          allMaterials = Array.from(materialsMap.values());
          console.log(`AI Controller: Encontrados ${allMaterials.length} materiais relevantes`);
        } catch (materialError) {
          console.error('AI Controller: Erro ao buscar materiais de treinamento:', materialError);
          // Continuar mesmo se falhar a busca de materiais
          allMaterials = [];
        }
        
        let analysisText;
        let usedMaterials = [];
        
        // Se encontramos materiais relevantes, use o TrainingService para enriquecer a análise
        if (allMaterials.length > 0) {
          console.log('AI Controller: Usando TrainingService para enriquecer análise com materiais');
          
          try {
            // Extrair categorias dos materiais para usar no enhanceSessionAnalysis
            const categories = [...new Set(allMaterials.map(m => m.category))];
            
            // Usar o TrainingService para enriquecer a análise
            analysisText = await trainingService.enhanceSessionAnalysis(
              transcript, 
              categories
            );
            
            // Guardar os materiais usados para incluir na resposta
            usedMaterials = allMaterials.map(m => ({
              title: m.title,
              insights: m.insights ? m.insights.substring(0, 200) + "..." : "Sem insights disponíveis"
            }));
            
            console.log('AI Controller: Análise enriquecida com sucesso');
          } catch (enhanceError) {
            console.error('AI Controller: Erro ao enriquecer análise:', enhanceError);
            // Se falhar o enhancement, voltamos para a análise padrão
            analysisText = null;
          }
        }
        
        // Se não encontrou materiais ou falhou o enhancement, fazer análise padrão
        if (!analysisText) {
          console.log('AI Controller: Realizando análise padrão sem materiais de treinamento');
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
                content: `Analise a seguinte transcrição de sessão de terapia:\n\n${transcript}`
              }
            ],
            max_tokens: 1000,
          });
          
          analysisText = completion.choices[0].message.content;
        }

        console.log('AI Controller: Resposta gerada com sucesso');
        
        // Salvar a análise no banco de dados
        const savedAnalysis = await prisma.aIInsight.create({
          data: {
            sessionId,
            content: analysisText,
            type: 'ANALYSIS',
            keywords: keywords.join(', ')
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
            id: savedAnalysis.id,
            referencedMaterials: usedMaterials.length > 0 ? usedMaterials : null
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
        console.log('AI Controller: Sem transcrição disponível para sugestões');
        return res.status(400).json({ 
          message: 'Nenhuma transcrição disponível para sugestões',
          type: 'suggestions',
          suggestions: ['Não há transcrição disponível para analisar. Inicie uma conversa primeiro.'] 
        });
      }

      try {
        console.log('AI Controller: Gerando sugestões via OpenAI');
        
        // Extrair temas principais da transcrição para identificar materiais relevantes
        console.log('AI Controller: Extraindo temas da transcrição para buscar materiais relevantes');
        const themesCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Extraia os principais temas e conceitos da transcrição da sessão. Retorne apenas uma lista de palavras-chave separadas por vírgula, sem explicações adicionais."
            },
            {
              role: "user",
              content: `Extraia os temas principais desta transcrição de sessão terapêutica:\n\n${sessionTranscript}`
            }
          ],
          max_tokens: 100,
        });
        
        // Extrair os temas como uma array
        const keywords = themesCompletion.choices[0].message.content.split(',').map(k => k.trim());
        console.log('AI Controller: Temas identificados para sugestões:', keywords);
        
        // Buscar materiais de treinamento relevantes para esses temas
        let allMaterials = [];
        try {
          // Buscar materiais para cada palavra-chave identificada
          const materialPromises = keywords.map(keyword => 
            prisma.trainingMaterial.findMany({
              where: {
                OR: [
                  { title: { contains: keyword, mode: 'insensitive' } },
                  { content: { contains: keyword, mode: 'insensitive' } },
                  { insights: { contains: keyword, mode: 'insensitive' } },
                  { category: { contains: keyword, mode: 'insensitive' } }
                ],
                status: 'processed'
              },
              select: {
                id: true,
                title: true,
                insights: true,
                category: true
              }
            })
          );
          
          const materialsArrays = await Promise.all(materialPromises);
          // Juntar todos os resultados e remover duplicatas por ID
          const materialsMap = new Map();
          materialsArrays.flat().forEach(m => {
            if (!materialsMap.has(m.id)) {
              materialsMap.set(m.id, m);
            }
          });
          
          allMaterials = Array.from(materialsMap.values());
          console.log(`AI Controller: Encontrados ${allMaterials.length} materiais relevantes para sugestões`);
        } catch (materialError) {
          console.error('AI Controller: Erro ao buscar materiais de treinamento:', materialError);
          // Continuar mesmo se falhar a busca de materiais
          allMaterials = [];
        }
        
        let suggestionsResponse;
        let usedMaterials = [];
        
        // Se encontramos materiais relevantes, use o TrainingService para gerar sugestões enriquecidas
        if (allMaterials.length > 0) {
          console.log('AI Controller: Usando materiais para enriquecer sugestões');
          
          try {
            // Combinar insights dos materiais para usar na geração de sugestões
            const materialsContext = allMaterials
              .slice(0, 5) // Limitar para 5 materiais para não exceder o limite de tokens
              .map(m => `Título: ${m.title}\nInsights: ${m.insights || 'Sem insights disponíveis'}\n`)
              .join('\n\n');
            
            // Gerar sugestões usando os materiais
            const completion = await openai.chat.completions.create({
              model: "gpt-4-turbo",
              messages: [
                {
                  role: "system",
                  content: `Você é um assistente especializado em psicoterapia que ajuda terapeutas com sugestões práticas.
                  Use os insights dos materiais de treinamento para fornecer sugestões mais específicas e contextualizadas.`
                },
                {
                  role: "user",
                  content: `Com base na transcrição da sessão e nos materiais de treinamento, forneça 5-7 sugestões práticas 
                  que o terapeuta pode aplicar para melhorar a eficácia da terapia neste caso específico.
                  
                  Materiais de Referência:
                  ${materialsContext}
                  
                  Transcrição da Sessão:
                  ${sessionTranscript}
                  
                  Formate as sugestões como uma lista de recomendações claras e acionáveis.`
                }
              ],
              max_tokens: 1000,
            });
            
            // Processar a resposta e transformar em um array de sugestões
            const suggestionsText = completion.choices[0].message.content;
            
            // Extrair sugestões numeradas (1. Sugestão, 2. Sugestão, etc.) ou em listas com pontos (• Sugestão, - Sugestão)
            const suggestionLines = suggestionsText.split('\n')
              .filter(line => line.trim().match(/^(\d+\.|\-|\•|\*)\s+.+/))
              .map(line => line.replace(/^(\d+\.|\-|\•|\*)\s+/, '').trim());
            
            suggestionsResponse = suggestionLines.length > 0 ? suggestionLines : [suggestionsText];
            
            // Guardar os materiais usados para incluir na resposta
            usedMaterials = allMaterials.slice(0, 5).map(m => ({
              title: m.title,
              insights: m.insights ? m.insights.substring(0, 200) + "..." : "Sem insights disponíveis"
            }));
            
            console.log('AI Controller: Sugestões enriquecidas geradas com sucesso');
          } catch (enhanceError) {
            console.error('AI Controller: Erro ao enriquecer sugestões:', enhanceError);
            // Se falhar o enhancement, voltamos para as sugestões padrão
            suggestionsResponse = null;
          }
        }
        
        // Se não encontrou materiais ou falhou o enhancement, fazer sugestões padrão
        if (!suggestionsResponse) {
          console.log('AI Controller: Realizando sugestões padrão sem materiais de treinamento');
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              {
                role: "system",
                content: `Você é um assistente especializado em psicoterapia que ajuda terapeutas durante sessões.
                Forneça sugestões práticas e relevantes com base na transcrição da sessão.`
              },
              {
                role: "user",
                content: `Com base na seguinte transcrição de uma sessão de terapia, forneça 5-7 sugestões
                específicas que possam ajudar o terapeuta a conduzir a sessão de forma mais eficaz:
                
                ${sessionTranscript}`
              }
            ],
            max_tokens: 1000,
          });
          
          // Processar a resposta e transformar em um array de sugestões
          const suggestionsText = completion.choices[0].message.content;
          
          // Extrair sugestões numeradas ou em listas
          const suggestionLines = suggestionsText.split('\n')
            .filter(line => line.trim().match(/^(\d+\.|\-|\•|\*)\s+.+/))
            .map(line => line.replace(/^(\d+\.|\-|\•|\*)\s+/, '').trim());
          
          suggestionsResponse = suggestionLines.length > 0 ? suggestionLines : [suggestionsText];
        }

        console.log('AI Controller: Retornando sugestões estruturadas');
        res.status(200).json({
          message: 'Sugestões geradas com sucesso',
          type: 'suggestions',
          content: 'Sugestões baseadas na transcrição da sessão atual',
          suggestions: suggestionsResponse,
          data: {
            suggestions: suggestionsResponse,
            referencedMaterials: usedMaterials.length > 0 ? usedMaterials : null
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
    let sessionId;
    
    // Corrigir a obtenção do sessionId que estava causando erro
    if (req.params.sessionId) {
      sessionId = req.params.sessionId;
    } else if (req.body.sessionId) {
      sessionId = req.body.sessionId;
    } else {
      console.error('AI Controller: sessionId não fornecido na requisição');
      return res.status(400).json({
        error: 'sessionId é obrigatório',
        success: false
      });
    }
    
    let { transcript } = req.body;

    console.log(`AI Controller: Solicitação de relatório para sessão ${sessionId}`);
    
    // Verificar se sessionId é válido
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.error('AI Controller: sessionId inválido:', sessionId);
      return res.status(400).json({
        error: 'sessionId inválido',
        success: false
      });
    }
    
    try {
      // Verificar se a sessão existe e se o usuário tem acesso a ela
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          appointment: {
            include: {
              therapist: true,
              client: true
            }
          }
        }
      });

      if (!session) {
        console.error(`AI Controller: Sessão ${sessionId} não encontrada`);
        return res.status(404).json({
          error: 'Sessão não encontrada',
          success: false
        });
      }

      // Verificar se o usuário atual tem acesso a esta sessão
      const userId = req.user.id;
      
      // Verificar acesso baseado na estrutura de dados que pode existir
      let hasAccess = false;
      let therapistId = null;
      let clientId = null;
      
      // Verificar estrutura padrão
      if (session.appointment?.therapist?.userId) {
        therapistId = session.appointment.therapist.userId;
        if (therapistId === userId) {
          hasAccess = true;
        }
      }
      
      if (session.appointment?.client?.userId) {
        clientId = session.appointment.client.userId;
        if (clientId === userId) {
          hasAccess = true;
        }
      }
      
      // Verificar estrutura alternativa (para compatibilidade)
      if (session.therapist?.userId) {
        therapistId = session.therapist.userId;
        if (therapistId === userId) {
          hasAccess = true;
        }
      }
      
      if (session.client?.userId) {
        clientId = session.client.userId;
        if (clientId === userId) {
          hasAccess = true;
        }
      }
      
      // Caso debug esteja habilitado, permitir acesso (apenas em ambiente de desenvolvimento)
      if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SKIP_AUTH === 'true') {
        console.warn(`AI Controller: Ignorando verificação de acesso em ambiente de desenvolvimento`);
        hasAccess = true;
      }
      
      if (!hasAccess) {
        console.error(`AI Controller: Usuário ${userId} não tem acesso à sessão ${sessionId}`);
        return res.status(403).json({
          error: 'Você não tem acesso a esta sessão',
          success: false
        });
      }

      // Se o transcript não foi fornecido, buscar do banco de dados
      if (!transcript) {
        console.log(`AI Controller: Transcript não fornecido, buscando do banco de dados`);
        
        let messages = [];
        
        // Tentar buscar de diferentes modelos possíveis no banco de dados
        try {
          // Verificar se existe o modelo Message
          messages = await prisma.message.findMany({
            where: {
              sessionId: sessionId
            },
            orderBy: {
              timestamp: 'asc'
            }
          });
        } catch (err) {
          console.log(`AI Controller: Erro ao buscar de Message, tentando SessionTranscript: ${err.message}`);
          
          // Se não existir Message, tentar SessionTranscript
          try {
            const transcripts = await prisma.sessionTranscript.findMany({
              where: {
                sessionId: sessionId
              },
              orderBy: {
                timestamp: 'asc'
              }
            });
            
            // Converter do formato SessionTranscript para um formato similar a Message
            messages = transcripts.map(t => ({
              sender: t.speaker,
              content: t.content,
              timestamp: t.timestamp
            }));
          } catch (err2) {
            console.error(`AI Controller: Erro ao buscar transcrições: ${err2.message}`);
          }
        }

        if (!messages || messages.length === 0) {
          console.error(`AI Controller: Nenhuma mensagem encontrada para a sessão ${sessionId}`);
          return res.status(400).json({
            error: 'Não há mensagens na sessão para gerar um relatório',
            success: false
          });
        }

        // Montar o transcript a partir das mensagens
        transcript = messages.map(msg => {
          // Determinar quem é o sender (pode variar dependendo do modelo)
          let sender;
          if (typeof msg.sender === 'string') {
            // Se já for uma string, tentar padronizar
            sender = msg.sender.toUpperCase() === 'THERAPIST' || 
                     msg.sender.toUpperCase() === 'TERAPEUTA' ? 
                     'Terapeuta' : 'Paciente';
          } else {
            // Caso contrário, usar um valor padrão
            sender = 'Participante';
          }
          
          return `${sender}: ${msg.content}`;
        }).join('\n');
      }

      // Se o transcript é muito curto, retornar erro
      if (!transcript || transcript.length < 50) {
        console.error(`AI Controller: Transcript muito curto (${transcript?.length || 0} caracteres)`);
        return res.status(400).json({
          error: 'Conteúdo insuficiente para gerar um relatório',
          success: false,
          report: 'A sessão não possui conteúdo suficiente para gerar um relatório detalhado.'
        });
      }

      console.log(`AI Controller: Enviando solicitação para o OpenAI, transcript com ${transcript.length} caracteres`);

      // Verificar a configuração da API
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('AI Controller: Chave da API OpenAI não configurada');
        return res.status(500).json({
          error: 'Configuração do serviço de IA ausente',
          success: false
        });
      }

      // Usar a instância de OpenAI já criada no topo do arquivo
      // ao invés de criar uma nova
      
      // Criar um prompt estruturado para o modelo
      const prompt = `
        Você é um assistente especializado em psicologia e terapia. Gere um relatório profissional e completo
        com base na seguinte transcrição de uma sessão terapêutica. O relatório deve ser usado pelo terapeuta
        para documentar a sessão.
        
        O relatório deve incluir:
        - Um resumo das principais questões discutidas
        - Observações sobre o comportamento e estado emocional do paciente
        - Temas principais que emergiram durante a sessão
        - Progressos observados ou desafios identificados
        - Análise dos padrões de pensamento e comportamento
        
        Utilize uma linguagem profissional, objetiva e baseada em evidências. Organize o relatório em seções
        com títulos claros. Evite julgamentos e mantenha um tom respeitoso.
        
        IMPORTANTE: O relatório deve ser baseado EXCLUSIVAMENTE no conteúdo da transcrição fornecida. 
        NÃO INVENTE informações ou detalhes que não estejam presentes na transcrição.
        Se a transcrição for muito curta ou não contiver informações suficientes para um relatório detalhado,
        mencione isso no relatório e forneça apenas as informações que puderem ser extraídas diretamente da transcrição.
        
        Transcrição da sessão:
        ${transcript}
      `;

      // Consumir a API do OpenAI para gerar o relatório
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "Você é um assistente especializado em psicologia e terapia." },
          { role: "user", content: prompt }
        ],
        model: "gpt-4-turbo",
        temperature: 0.7,
        max_tokens: 3000
      });

      // Extrair o texto do relatório da resposta da API
      const reportText = completion.choices[0].message.content;
      
      if (!reportText || reportText.length < 100) {
        console.error(`AI Controller: Resposta da OpenAI muito curta ou vazia (${reportText?.length || 0} caracteres)`);
        return res.status(500).json({
          error: 'A resposta da IA foi insuficiente',
          success: false,
          report: 'Não foi possível gerar um relatório detalhado para esta sessão. Por favor, tente novamente mais tarde.'
        });
      }

      console.log(`AI Controller: Relatório gerado com sucesso, ${reportText.length} caracteres`);

      // Salvar o relatório no banco de dados
      let reportId = null;
      try {
        // Usar o modelo SessionReport que existe no schema
        const report = await prisma.sessionReport.create({
          data: {
            sessionId: sessionId,
            content: reportText,
            generatedBy: 'AI',  // O modelo usa generatedBy em vez de createdById
            timestamp: new Date()
          }
        });
        reportId = report.id;
      } catch (dbError) {
        // Logar o erro e continuar sem salvar no banco de dados
        console.error('AI Controller: Erro ao salvar relatório no banco:', dbError);
        console.log('AI Controller: Continuando sem salvar no banco de dados');
      }

      // Retornar a resposta com o relatório, mesmo se não conseguir salvar no banco
      return res.status(200).json({
        success: true,
        report: reportText,
        reportId: reportId
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return res.status(500).json({
        error: 'Erro ao gerar relatório: ' + error.message,
        success: false
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