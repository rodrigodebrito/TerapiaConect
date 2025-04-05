const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDatabase() {
  console.log('Iniciando correção do banco de dados...');

  try {
    // Criar a tabela Tool
    console.log('Criando tabela Tool...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Tool" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "duration" INTEGER NOT NULL DEFAULT 60,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "description" TEXT,
        "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
        
        CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Criar a tabela TherapistTool
    console.log('Criando tabela TherapistTool...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TherapistTool" (
        "therapistId" TEXT NOT NULL,
        "toolId" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "duration" INTEGER NOT NULL DEFAULT 60,
        
        CONSTRAINT "TherapistTool_pkey" PRIMARY KEY ("therapistId","toolId"),
        CONSTRAINT "TherapistTool_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "TherapistTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `;
    
    console.log('Tabelas Tool e TherapistTool criadas com sucesso!');
    
    // Verificar as tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Tabelas no banco de dados:');
    console.log(tables);
    
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase(); 