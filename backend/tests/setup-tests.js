// Configurar mocks globais para os testes
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');

// Mock do Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    // Mock dos métodos do Prisma que são usados nos testes
    $connect: jest.fn().mockResolvedValue(true),
    $disconnect: jest.fn().mockResolvedValue(true),
    aIInsight: {
      create: jest.fn().mockResolvedValue({ id: 'mock-id', content: 'Conteúdo mockado' })
    },
    session: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'mock-session-id',
        therapist: { userId: 'mock-therapist-id', name: 'Terapeuta Teste' },
        client: { userId: 'mock-client-id', name: 'Cliente Teste' },
        date: new Date()
      }),
      findMany: jest.fn().mockResolvedValue([])
    },
    message: {
      findMany: jest.fn().mockResolvedValue([])
    },
    sessionTranscript: {
      findMany: jest.fn().mockResolvedValue([])
    },
    trainingMaterial: {
      findMany: jest.fn().mockResolvedValue([])
    }
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

// Mock do OpenAI
jest.mock('openai', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Resposta mockada da OpenAI'
              }
            }
          ]
        })
      }
    }
  };

  return {
    OpenAI: jest.fn(() => mockOpenAI)
  };
});

// Mock de outros módulos se necessário
jest.mock('../src/services/ai/training.service', () => ({
  enhanceSessionAnalysis: jest.fn().mockResolvedValue('Análise enriquecida mockada')
}));

// Configuração para silenciar logs durante os testes
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}; 