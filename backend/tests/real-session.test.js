const { OpenAI } = require('openai');
const { PrismaClient } = require('@prisma/client');

// Mock para o controlador de IA
let aiController;

// Antes de importar, mockamos os módulos necessários
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'test-session-id',
          therapist: { 
            userId: 'therapist-user-id',
            name: 'Dr. Teste'
          },
          client: { 
            userId: 'client-user-id',
            name: 'Paciente Teste'
          },
          date: new Date('2025-03-28'),
          therapistId: 'test-therapist-id',
          clientId: 'test-client-id'
        }),
        findMany: jest.fn().mockResolvedValue([])
      },
      aIInsight: {
        create: jest.fn().mockImplementation((data) => Promise.resolve({
          id: 'insight-id',
          ...data.data
        }))
      },
      message: {
        findMany: jest.fn().mockResolvedValue([])
      },
      sessionTranscript: {
        findMany: jest.fn().mockResolvedValue([])
      }
    }))
  };
});

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async (params) => {
            // Verificar se a chamada está relacionada ao pré-processamento ou à análise principal
            if (params.model === "gpt-3.5-turbo") {
              // Esta é a chamada para preprocessLongTranscript
              return {
                choices: [
                  {
                    message: {
                      content: "Terapeuta: Resumo da sessão. Como você está se sentindo hoje?\nPaciente: Estou me sentindo melhor, mas ainda com algumas preocupações.\nTerapeuta: Vamos trabalhar nisso juntos."
                    }
                  }
                ]
              };
            } else {
              // Esta é a chamada principal para a análise/relatório/sugestão
              return {
                choices: [
                  {
                    message: {
                      content: `# Análise da Sessão\n
                      O paciente demonstrou progresso em relação às sessões anteriores, mas ainda apresenta sinais de ansiedade relacionados ao trabalho.\n
                      ## Principais pontos observados:\n
                      1. Melhora no padrão de sono\n
                      2. Persistência de preocupações profissionais\n
                      3. Bom engajamento nas técnicas de respiração sugeridas`
                    }
                  }
                ]
              };
            }
          })
        }
      }
    }))
  };
});

// Agora podemos importar o controlador
aiController = require('../src/controllers/ai.controller');

// Mock do Request e Response do Express
const mockRequest = () => {
  return {
    body: {},
    params: {},
    user: {
      id: 'therapist-user-id'
    }
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Função para gerar uma transcrição longa
function gerarTranscricaoLonga(tamanho = 30000) {
  const frasesTerapeuta = [
    "Como você tem se sentido desde nossa última sessão?",
    "Pode me contar mais sobre isso?",
    "O que você acha que desencadeia essa ansiedade?",
    "Vamos explorar algumas estratégias para lidar com essas situações.",
    "Como você se sente quando pensa nesse evento?",
    "Você notou algum padrão nesses momentos?",
    "Que tipo de pensamentos surgem quando você está ansioso?",
    "Você já experimentou a técnica de respiração que discutimos?",
    "Como foi sua experiência com o exercício que sugeri?",
    "Vamos analisar isso de uma perspectiva diferente."
  ];
  
  const frasesPaciente = [
    "Tenho me sentido um pouco melhor, mas ainda estou ansioso.",
    "É difícil explicar, mas é como se algo ruim fosse acontecer a qualquer momento.",
    "Acho que começou depois daquela reunião de trabalho.",
    "Tentei algumas vezes, mas nem sempre consigo me acalmar.",
    "Sinto um aperto no peito e minha respiração fica acelerada.",
    "Geralmente acontece mais à noite, quando estou sozinho.",
    "Fico pensando que vou falhar ou decepcionar as pessoas.",
    "Experimentei algumas vezes e ajudou um pouco.",
    "Foi bom, consegui dormir melhor depois de fazer o exercício.",
    "Nunca tinha pensado dessa forma, faz sentido."
  ];
  
  let transcricao = "";
  let caracteresAtuais = 0;
  
  while (caracteresAtuais < tamanho) {
    const indiceTerapeuta = Math.floor(Math.random() * frasesTerapeuta.length);
    const indicePaciente = Math.floor(Math.random() * frasesPaciente.length);
    
    const linhaTerapeuta = `Terapeuta: ${frasesTerapeuta[indiceTerapeuta]}\n`;
    const linhaPaciente = `Paciente: ${frasesPaciente[indicePaciente]}\n`;
    
    transcricao += linhaTerapeuta + linhaPaciente;
    caracteresAtuais += linhaTerapeuta.length + linhaPaciente.length;
  }
  
  return transcricao;
}

describe('Simulação de Sessão Completa', () => {
  let req, res;
  
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configurar request e response
    req = mockRequest();
    res = mockResponse();
  });
  
  test('deve analisar com sucesso uma transcrição longa (analyzeSession)', async () => {
    // Configurar uma transcrição longa (mais de 6000 tokens)
    const transcricaoLonga = gerarTranscricaoLonga(30000); // Aproximadamente 7500 tokens
    
    // Configurar o request
    req.body = {
      sessionId: 'test-session-id',
      transcript: transcricaoLonga
    };
    
    // Chamar a função de análise
    await aiController.analyzeSession(req, res);
    
    // Verificar se o pré-processamento foi efetivamente utilizado
    // Isso é difícil de testar diretamente, mas podemos verificar se a resposta foi bem-sucedida
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    // Pegar o argumento passado para res.json
    const responseData = res.json.mock.calls[0][0];
    
    // Verificar se a resposta contém campos esperados
    expect(responseData.message).toBeDefined();
    expect(responseData.type).toBe('analysis');
    expect(responseData.analysis).toBeDefined();
    
    // Verificar se o objeto OpenAI.chat.completions.create foi chamado pelo menos duas vezes
    // Uma vez para o pré-processamento e uma vez para a análise
    const openaiInstance = new OpenAI();
    expect(openaiInstance.chat.completions.create.mock.calls.length).toBeGreaterThanOrEqual(2);
    
    // Verificar o número e os tipos de chamadas à OpenAI
    const calls = openaiInstance.chat.completions.create.mock.calls;
    const preprocessingCall = calls.find(call => call[0].model === 'gpt-3.5-turbo');
    const analysisCall = calls.find(call => call[0].model === 'gpt-4-turbo');
    
    expect(preprocessingCall).toBeDefined();
    expect(analysisCall).toBeDefined();
  });
  
  test('deve gerar sugestões para uma transcrição longa (generateSuggestions)', async () => {
    // Configurar uma transcrição longa
    const transcricaoLonga = gerarTranscricaoLonga(30000);
    
    // Configurar o request
    req.body = {
      sessionId: 'test-session-id',
      transcript: transcricaoLonga
    };
    
    // Chamar a função de sugestões
    await aiController.generateSuggestions(req, res);
    
    // Verificar se a resposta foi bem-sucedida
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    // Verificar se a resposta contém campos esperados
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.message).toBeDefined();
    expect(responseData.type).toBe('suggestions');
    expect(responseData.suggestions).toBeDefined();
    
    // Verificar chamadas à OpenAI
    const openaiInstance = new OpenAI();
    expect(openaiInstance.chat.completions.create.mock.calls.length).toBeGreaterThanOrEqual(2);
    
    // Verificar o número e os tipos de chamadas à OpenAI
    const calls = openaiInstance.chat.completions.create.mock.calls;
    const preprocessingCall = calls.find(call => call[0].model === 'gpt-3.5-turbo');
    const analysisCall = calls.find(call => call[0].model === 'gpt-4-turbo');
    
    expect(preprocessingCall).toBeDefined();
    expect(analysisCall).toBeDefined();
  });
  
  test('deve gerar relatório para uma transcrição longa (generateReport)', async () => {
    // Configurar uma transcrição longa
    const transcricaoLonga = gerarTranscricaoLonga(30000);
    
    // Configurar o request
    req.body = {
      sessionId: 'test-session-id',
      transcript: transcricaoLonga
    };
    
    // Chamar a função de relatório
    await aiController.generateReport(req, res);
    
    // Verificar se a resposta foi bem-sucedida
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    // Verificar se a resposta contém campos esperados
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.type).toBe('report');
    expect(responseData.report).toBeDefined();
    
    // Verificar chamadas à OpenAI
    const openaiInstance = new OpenAI();
    expect(openaiInstance.chat.completions.create.mock.calls.length).toBeGreaterThanOrEqual(2);
    
    // Verificar o número e os tipos de chamadas à OpenAI
    const calls = openaiInstance.chat.completions.create.mock.calls;
    const preprocessingCall = calls.find(call => call[0].model === 'gpt-3.5-turbo');
    const analysisCall = calls.find(call => call[0].model === 'gpt-4-turbo');
    
    expect(preprocessingCall).toBeDefined();
    expect(analysisCall).toBeDefined();
  });
});

// Modificar o ambiente para testes
process.env.NODE_ENV = 'development';
process.env.TESTING = 'true'; 