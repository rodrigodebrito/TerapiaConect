const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function main() {
  console.log('Iniciando seed...');

  for (const tool of THERAPY_TOOLS) {
    await prisma.tool.upsert({
      where: { id: tool.id },
      update: tool,
      create: tool
    });
  }

  console.log('Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 