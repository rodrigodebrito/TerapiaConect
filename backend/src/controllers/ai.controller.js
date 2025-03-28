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
 * Estima o número de tokens em um texto
 * Esta é uma estimativa aproximada (4 caracteres ≈ 1 token)
 * @param {string} text - O texto para estimar tokens
 * @returns {number} - Número aproximado de tokens
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Pré-processa uma transcrição longa para garantir que não exceda os limites de tokens da OpenAI
 * @param {string} transcript - A transcrição completa
 * @param {number} maxTokens - Máximo de tokens permitidos (padrão: 4000)
 * @returns {Promise<string>} - A transcrição resumida ou original, dependendo do tamanho
 */
async function preprocessLongTranscript(transcript, maxTokens = 4000) {
  // Estimar tokens na transcrição
  const estimatedTokens = estimateTokens(transcript);
  
  console.log(`AI Controller: Transcrição com estimativa de ${estimatedTokens} tokens`);
  
  // Se a transcrição estiver dentro do limite, retorná-la como está
  if (estimatedTokens <= maxTokens) {
    return transcript;
  }
  
  console.log(`AI Controller: Transcrição excede limite de ${maxTokens} tokens, gerando resumo`);
  
  try {
    // Gerar um resumo usando GPT-3.5-Turbo (mais rápido e mais barato)
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em resumir sessões de terapia.
          Seu trabalho é condensar transcrições longas mantendo:
          1. Os principais temas discutidos
          2. Padrões emocionais importantes
          3. Insights ou momentos de progresso
          4. Desafios ou obstáculos mencionados
          5. A estrutura geral da conversa
          
          Formate o resumo da mesma forma que a transcrição original, alternando entre "Terapeuta:" e "Paciente:".
          Seu resumo deve ser detalhado o suficiente para uma análise posterior, mas reduzido para caber no limite de tokens.`
        },
        {
          role: "user",
          content: `Resumir esta transcrição de sessão terapêutica para análise posterior:\n\n${transcript}`
        }
      ],
      max_tokens: 1500,
    });
    
    const summarizedTranscript = summaryCompletion.choices[0].message.content;
    console.log(`AI Controller: Resumo gerado com sucesso. Tamanho original: ${transcript.length}, Resumo: ${summarizedTranscript.length}`);
    
    return summarizedTranscript;
  } catch (error) {
    console.error('AI Controller: Erro ao resumir transcrição longa:', error);
    
    // Em caso de erro, fazer um truncamento manual simples
    // Isso é um fallback para garantir que o sistema continue funcionando
    console.log('AI Controller: Realizando truncamento manual como fallback');
    
    // Dividir por linhas para tentar manter a estrutura da conversa
    const lines = transcript.split('\n');
    let truncatedTranscript = '';
    let currentTokens = 0;
    
    // Pegar o início (1/3) e o final (2/3) da transcrição
    const startLines = Math.floor(lines.length / 3);
    const endLines = Math.floor(lines.length * 2 / 3);
    
    // Adicionar nota sobre o truncamento
    truncatedTranscript += "NOTA: Esta transcrição foi truncada devido ao tamanho.\n\n";
    truncatedTranscript += "--- INÍCIO DA SESSÃO ---\n";
    
    // Adicionar o primeiro terço das linhas
    for (let i = 0; i < startLines && currentTokens < maxTokens / 2; i++) {
      const lineTokens = estimateTokens(lines[i]);
      if (currentTokens + lineTokens <= maxTokens / 2) {
        truncatedTranscript += lines[i] + '\n';
        currentTokens += lineTokens;
      } else {
        break;
      }
    }
    
    truncatedTranscript += "\n--- PARTE INTERMEDIÁRIA OMITIDA ---\n\n";
    
    // Adicionar o último terço das linhas
    currentTokens += 100; // Considerar os tokens da nota
    for (let i = endLines; i < lines.length && currentTokens < maxTokens; i++) {
      const lineTokens = estimateTokens(lines[i]);
      if (currentTokens + lineTokens <= maxTokens) {
        truncatedTranscript += lines[i] + '\n';
        currentTokens += lineTokens;
      } else {
        break;
      }
    }
    
    truncatedTranscript += "\n--- FIM DA SESSÃO ---";
    
    console.log(`AI Controller: Transcrição truncada manualmente. Novo tamanho: ${truncatedTranscript.length}`);
    return truncatedTranscript;
  }
}

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
   * Analisar sessão de terapia
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  analyzeSession: async (req, res) => {
    try {
      console.log('AI Controller: Iniciando análise de sessão');
      
      // Obter sessionId do parâmetro de rota ou do corpo da requisição
      let sessionId;
      if (req.params.sessionId) {
        sessionId = req.params.sessionId;
      } else if (req.body.sessionId) {
        sessionId = req.body.sessionId;
      } else {
        console.error('AI Controller: sessionId não fornecido na requisição');
        return res.status(400).json({
          message: 'sessionId é obrigatório',
          success: false
        });
      }
      
      const { transcript } = req.body;
      const userId = req.user?.id;
      
      console.log(`AI Controller: Processando análise para sessão ${sessionId}, usuário ${userId}`);

      // Verificar se a sessão existe e se o usuário tem acesso
      const session = await prisma.session.findUnique({
        where: {
          id: sessionId
        },
        include: {
          therapist: true,
          client: true
        }
      });

      if (!session) {
        console.log('AI Controller: Sessão não encontrada');
        return res.status(404).json({ 
          message: 'Sessão não encontrada',
          success: false,
          type: 'analysis',
          analysis: 'A sessão solicitada não foi encontrada no sistema.' 
        });
      }

      // Para testes ou desenvolvimento, permitir acesso mais amplo
      const isDevMode = process.env.NODE_ENV === 'development';
      const isTesting = process.env.TESTING === 'true';
      
      // Verificar se o usuário é o terapeuta da sessão
      if (!isDevMode && !isTesting && session.therapist?.userId !== userId) {
        console.log(`AI Controller: Acesso não autorizado. Terapeuta: ${session.therapist?.userId}, Usuário: ${userId}`);
        return res.status(403).json({ 
          message: 'Apenas o terapeuta pode analisar sessões',
          success: false,
          type: 'analysis',
          analysis: 'Você não tem permissão para analisar esta sessão.' 
        });
      }

      // Construir ou buscar transcrição
      let processedTranscript = transcript;
      if (!processedTranscript) {
        console.log(`AI Controller: Transcript não fornecido, buscando mensagens do banco de dados`);
        
        // Se não foi fornecido, tentar obter do banco
        let messages = [];
        
        try {
          // Tentar buscar de diferentes modelos possíveis
          try {
            messages = await prisma.message.findMany({
              where: {
                sessionId: sessionId
              },
              orderBy: {
                timestamp: 'asc'
              }
            });
          } catch (err) {
            console.log(`AI Controller: Erro ao buscar de Message, tentando SessionTranscript`);
            
            const transcripts = await prisma.sessionTranscript.findMany({
              where: {
                sessionId: sessionId
              },
              orderBy: {
                timestamp: 'asc'
              }
            });
            
            messages = transcripts.map(t => ({
              sender: t.speaker,
              content: t.content,
              timestamp: t.timestamp
            }));
          }
          
          if (!messages || messages.length === 0) {
            console.error(`AI Controller: Nenhuma mensagem encontrada para a sessão ${sessionId}`);
            return res.status(400).json({
              error: 'Não há mensagens na sessão para analisar',
              success: false,
              type: 'analysis',
              analysis: 'Não há mensagens registradas nesta sessão para analisar.'
            });
          }
          
          // Montar o transcript a partir das mensagens
          processedTranscript = messages.map(msg => {
            // Determinar quem é o sender (pode variar dependendo do modelo)
            let sender;
            if (typeof msg.sender === 'string') {
              sender = msg.sender.toUpperCase() === 'THERAPIST' || 
                      msg.sender.toUpperCase() === 'TERAPEUTA' ? 
                      'Terapeuta' : 'Paciente';
            } else {
              sender = 'Participante';
            }
            
            return `${sender}: ${msg.content}`;
          }).join('\n');
          
        } catch (dbError) {
          console.error(`AI Controller: Erro ao buscar transcrições do banco: ${dbError.message}`);
          return res.status(500).json({
            error: 'Erro ao buscar transcrições da sessão',
            success: false,
            type: 'analysis',
            analysis: 'Ocorreu um erro ao buscar o histórico da sessão. Tente novamente mais tarde.'
          });
        }
      }

      if (!processedTranscript || processedTranscript.length < 100) {
        console.error(`AI Controller: Transcript muito curto (${processedTranscript?.length || 0} caracteres)`);
        return res.status(400).json({
          error: 'Conteúdo insuficiente para análise',
          success: false,
          type: 'analysis',
          analysis: 'A sessão não possui conteúdo suficiente para uma análise detalhada.'
        });
      }

      // NOVO: Pré-processar a transcrição se for muito longa
      processedTranscript = await preprocessLongTranscript(processedTranscript, 6000);

      // Gerar análise da sessão usando OpenAI
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
              content: `Extraia os temas principais desta transcrição de sessão terapêutica:\n\n${processedTranscript}`
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
              processedTranscript, 
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
                content: `Analise a seguinte transcrição de sessão de terapia:\n\n${processedTranscript}`
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
      let processedTranscript = transcript;
      if (!processedTranscript) {
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
          processedTranscript = transcriptRecords
            .map(record => `${record.speaker}: ${record.content}`)
            .join('\n');
        }
      }

      if (!processedTranscript) {
        console.log('AI Controller: Sem transcrição disponível para sugestões');
        return res.status(400).json({ 
          message: 'Nenhuma transcrição disponível para sugestões',
          type: 'suggestions',
          suggestions: ['Não há transcrição disponível para analisar. Inicie uma conversa primeiro.'] 
        });
      }

      // NOVO: Pré-processar a transcrição se for muito longa
      processedTranscript = await preprocessLongTranscript(processedTranscript, 6000);

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
              content: `Extraia os temas principais desta transcrição de sessão terapêutica:\n\n${processedTranscript}`
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
                  ${processedTranscript}
                  
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
                
                ${processedTranscript}`
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
   * Gerar relatório de sessão
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
          therapist: true,
          client: true
        }
      });

      if (!session) {
        console.log('AI Controller: Sessão não encontrada');
        return res.status(404).json({ 
          message: 'Sessão não encontrada',
          success: false,
          type: 'report',
          report: 'A sessão solicitada não foi encontrada no sistema.' 
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
          success: false,
          type: 'report',
          report: 'Você não tem permissão para gerar relatórios para esta sessão.' 
        });
      }

      // Construir ou buscar transcrição
      let processedTranscript = transcript;
      if (!processedTranscript) {
        console.log(`AI Controller: Transcript não fornecido, buscando mensagens do banco de dados`);
        
        // Se não foi fornecido, tentar obter do banco
        let messages = [];
        
        try {
          // Tentar buscar de diferentes modelos possíveis
          try {
            messages = await prisma.message.findMany({
              where: {
                sessionId: sessionId
              },
              orderBy: {
                timestamp: 'asc'
              }
            });
          } catch (err) {
            console.log(`AI Controller: Erro ao buscar de Message, tentando SessionTranscript`);
            
            const transcripts = await prisma.sessionTranscript.findMany({
              where: {
                sessionId: sessionId
              },
              orderBy: {
                timestamp: 'asc'
              }
            });
            
            messages = transcripts.map(t => ({
              sender: t.speaker,
              content: t.content,
              timestamp: t.timestamp
            }));
          }
          
          if (!messages || messages.length === 0) {
            console.error(`AI Controller: Nenhuma mensagem encontrada para a sessão ${sessionId}`);
            return res.status(400).json({
              error: 'Não há mensagens na sessão para gerar um relatório',
              success: false,
              type: 'report',
              report: 'Não há mensagens registradas nesta sessão para gerar um relatório.'
            });
          }
          
          // Montar o transcript a partir das mensagens
          processedTranscript = messages.map(msg => {
            // Determinar quem é o sender (pode variar dependendo do modelo)
            let sender;
            if (typeof msg.sender === 'string') {
              sender = msg.sender.toUpperCase() === 'THERAPIST' || 
                      msg.sender.toUpperCase() === 'TERAPEUTA' ? 
                      'Terapeuta' : 'Paciente';
            } else {
              sender = 'Participante';
            }
            
            return `${sender}: ${msg.content}`;
          }).join('\n');
          
        } catch (dbError) {
          console.error(`AI Controller: Erro ao buscar transcrições do banco: ${dbError.message}`);
          return res.status(500).json({
            error: 'Erro ao buscar transcrições da sessão',
            success: false,
            type: 'report',
            report: 'Ocorreu um erro ao buscar o histórico da sessão. Tente novamente mais tarde.'
          });
        }
      }

      if (!processedTranscript || processedTranscript.length < 100) {
        console.error(`AI Controller: Transcript muito curto (${processedTranscript?.length || 0} caracteres)`);
        return res.status(400).json({
          error: 'Conteúdo insuficiente para gerar um relatório',
          success: false,
          type: 'report',
          report: 'A sessão não possui conteúdo suficiente para gerar um relatório detalhado.'
        });
      }

      // NOVO: Pré-processar a transcrição se for muito longa
      processedTranscript = await preprocessLongTranscript(processedTranscript, 6000);

      // Gerar o relatório usando OpenAI
      try {
        console.log('AI Controller: Gerando relatório via OpenAI');
        
        // Recuperar informações do paciente e terapeuta para personalizar o relatório
        const patientName = session.client?.name || 'Paciente';
        const therapistName = session.therapist?.name || 'Terapeuta';
        
        // Verificar se tem sessões anteriores para referência
        let previousSessionsInfo = "Não há informações sobre sessões anteriores disponíveis.";
        try {
          const previousSessions = await prisma.session.findMany({
            where: {
              therapistId: session.therapistId,
              clientId: session.clientId,
              status: 'COMPLETED',
              id: { not: sessionId },
              date: { lt: session.date }
            },
            orderBy: {
              date: 'desc'
            },
            take: 5
          });
          
          if (previousSessions && previousSessions.length > 0) {
            previousSessionsInfo = `Existem ${previousSessions.length} sessões anteriores registradas com este paciente. A última sessão ocorreu em ${new Date(previousSessions[0].date).toLocaleDateString()}.`;
          }
        } catch (prevSessionsError) {
          console.error('Erro ao buscar sessões anteriores:', prevSessionsError);
          // Continuar mesmo sem info das sessões anteriores
        }
        
        // Realizar a chamada à API
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `Você é um assistente especializado na elaboração de relatórios de sessões de terapia.

              Gere um relatório profissional, estruturado e completo com base na transcrição da sessão terapêutica, seguindo as melhores práticas de documentação clínica.
              
              Informações importantes:
              - Nome do paciente: ${patientName}
              - Nome do terapeuta: ${therapistName}
              - Data da sessão: ${new Date(session.date).toLocaleDateString()}
              - ${previousSessionsInfo}
              
              O relatório deve incluir as seguintes seções:
              
              1. RESUMO DA SESSÃO
              - Breve resumo dos principais tópicos abordados
              
              2. TEMAS PRINCIPAIS
              - Lista e descrição dos principais temas discutidos
              
              3. ESTADO EMOCIONAL E COMPORTAMENTO
              - Observações sobre o estado emocional do paciente durante a sessão
              - Padrões de comportamento relevantes
              
              4. PROGRESSO
              - Avanços e insights alcançados na sessão
              - Relação com objetivos terapêuticos (se evidentes)
              
              5. DESAFIOS E OBSTÁCULOS
              - Principais dificuldades identificadas
              - Resistências ou padrões disfuncionais observados
              
              6. INTERVENÇÕES E TÉCNICAS
              - Abordagens e técnicas utilizadas pelo terapeuta
              - Eficácia das intervenções (quando observável)
              
              7. PLANO E RECOMENDAÇÕES
              - Sugestões para o paciente até a próxima sessão
              - Áreas a focar nas próximas sessões
              - Exercícios ou práticas recomendadas
              
              Formatação:
              - Use linguagem profissional, clara e objetiva
              - Evite jargão excessivo
              - Seja factual e baseado na evidência da transcrição
              - Use marcadores para facilitar a leitura quando apropriado
              - Use cabeçalhos para estruturar o documento
              - Mantenha o relatório conciso mas informativo`
            },
            {
              role: "user",
              content: `Gere um relatório completo para a seguinte sessão de terapia:
              
              ${processedTranscript}`
            }
          ],
          max_tokens: 2000,
        });
        
        const reportText = completion.choices[0].message.content;
        
        // Salvar o relatório no banco de dados
        const savedReport = await prisma.aIInsight.create({
          data: {
            sessionId,
            content: reportText,
            type: 'REPORT',
            keywords: 'relatório, sessão, progresso'
          }
        });
        
        // Responder com o relatório gerado
        res.status(200).json({
          message: 'Relatório gerado com sucesso',
          success: true,
          type: 'report',
          report: reportText,
          data: {
            report: reportText,
            id: savedReport.id
          }
        });
        
      } catch (openaiError) {
        console.error('AI Controller: Erro na chamada da API OpenAI:', openaiError);
        return res.status(500).json({
          message: 'Erro ao processar com a IA',
          error: openaiError.message,
          success: false,
          type: 'report',
          report: 'Ocorreu um erro ao gerar o relatório com a IA. Tente novamente em alguns instantes.'
        });
      }
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

// Exportar as funções para testes
module.exports = {
  ...aiController,
  
  // Exportar funções auxiliares apenas para teste
  // Em produção, estas exportações adicionais serão ignoradas
  estimateTokens,
  preprocessLongTranscript
}; 