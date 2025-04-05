const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const THERAPY_TOOLS = [
  {
    id: 'constellations',
    name: 'Constelação Familiar',
    description: 'Técnica terapêutica que trabalha com as dinâmicas familiares e sistêmicas',
    duration: 120
  },
  {
    id: 'thetahealing',
    name: 'Thetahealing',
    description: 'Técnica de cura energética que trabalha com as ondas cerebrais theta',
    duration: 60
  },
  {
    id: 'cbt',
    name: 'Terapia Cognitivo-Comportamental (TCC)',
    description: 'Abordagem que trabalha a relação entre pensamentos, emoções e comportamentos',
    duration: 50
  },
  {
    id: 'hypnotherapy',
    name: 'Hipnoterapia',
    description: 'Terapia que utiliza o estado de transe hipnótico para promover mudanças',
    duration: 90
  },
  {
    id: 'reiki',
    name: 'Reiki',
    description: 'Técnica de cura energética japonesa',
    duration: 60
  },
  {
    id: 'nlp',
    name: 'PNL (Programação Neurolinguística)',
    description: 'Conjunto de técnicas que trabalham com padrões mentais e comportamentais',
    duration: 60
  },
  {
    id: 'meditation',
    name: 'Meditação Guiada',
    description: 'Prática de meditação conduzida para relaxamento e autoconhecimento',
    duration: 45
  },
  {
    id: 'eft',
    name: 'EFT (Técnica de Libertação Emocional)',
    description: 'Técnica que combina estímulos em pontos de acupuntura com foco mental',
    duration: 60
  },
  {
    id: 'psychotherapy',
    name: 'Psicoterapia Tradicional',
    description: 'Abordagem tradicional de terapia conversacional',
    duration: 50
  },
  {
    id: 'aromatherapy',
    name: 'Aromaterapia',
    description: 'Uso terapêutico de óleos essenciais',
    duration: 60
  },
  {
    id: 'tarot',
    name: 'Tarô',
    description: 'Ferramenta de autoconhecimento e orientação através das cartas',
    duration: 60
  },
  {
    id: 'radionic-table',
    name: 'Mesa Radiônica',
    description: 'Instrumento para análise e harmonização energética',
    duration: 90
  }
];

async function createTools() {
  console.log('Iniciando criação de ferramentas terapêuticas...');

  try {
    // Ignorar a criação do administrador por enquanto, foco nas ferramentas
    console.log('Criando ferramentas terapêuticas...');
    
    // Agora criar as ferramentas
    for (const tool of THERAPY_TOOLS) {
      try {
        // Criar a ferramenta diretamente
        await prisma.tool.create({
          data: {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            duration: tool.duration,
            price: 0
          }
        });
        console.log(`Ferramenta ${tool.name} criada com sucesso!`);
      } catch (toolError) {
        // Se já existir, ignorar o erro
        if (toolError.code === 'P2002') {
          console.log(`Ferramenta ${tool.name} já existe, ignorando.`);
        } else {
          console.error(`Erro ao criar ferramenta ${tool.name}:`, toolError);
        }
      }
    }

    console.log('Ferramentas terapêuticas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar ferramentas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTools(); 