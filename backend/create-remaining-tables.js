const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRemainingTables() {
  console.log('Iniciando criação das tabelas faltantes...');

  try {
    // Verificar tabelas existentes
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Tabelas existentes no banco de dados:');
    console.log(existingTables);
    
    // Lista de todas as tabelas no schema
    const allTablesInSchema = [
      'User', 'Therapist', 'Client', 'Tool', 'Appointment', 'Availability', 
      'Notification', 'TherapistTool', 'Session', 'SessionTranscript', 
      'AIInsight', 'SessionReport', 'TrainingMaterial'
    ];
    
    // Filtrar tabelas existentes
    const existingTableNames = existingTables.map(t => t.table_name);
    console.log('Tabelas encontradas:', existingTableNames);
    
    // Identificar tabelas faltantes
    const missingTables = allTablesInSchema.filter(table => !existingTableNames.includes(table));
    console.log('Tabelas faltantes:', missingTables);

    // Prisma migra automaticamente o esquema, mas vamos garantir que as tabelas sejam criadas

    // Primeiro, precisamos verificar se já existe uma migração pendente
    console.log('Executando migração para criar tabelas faltantes...');
    
    // Usar o Prisma ORM para criar as tabelas faltantes
    if (missingTables.includes('Tool')) {
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
    }

    if (missingTables.includes('TherapistTool')) {
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
    }

    if (missingTables.includes('Client')) {
      console.log('Criando tabela Client...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Client" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "preferences" JSONB,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "freeSessions" INTEGER NOT NULL DEFAULT 0,
          "birthDate" TIMESTAMP(3),
          "city" TEXT,
          "complement" TEXT,
          "gender" TEXT,
          "neighborhood" TEXT,
          "number" TEXT,
          "phone" TEXT,
          "profilePicture" TEXT,
          "state" TEXT,
          "street" TEXT,
          "zipCode" TEXT,
          
          CONSTRAINT "Client_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Client_userId_key" UNIQUE ("userId"),
          CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `;
    }

    if (missingTables.includes('Notification')) {
      console.log('Criando tabela Notification...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          
          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        );
      `;
    }

    if (missingTables.includes('Session')) {
      console.log('Criando tabela Session...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Session" (
          "id" TEXT NOT NULL,
          "appointmentId" TEXT NOT NULL,
          "therapistId" TEXT NOT NULL,
          "clientId" TEXT NOT NULL,
          "title" TEXT,
          "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
          "startTime" TIMESTAMP(3),
          "endTime" TIMESTAMP(3),
          "scheduledDuration" INTEGER NOT NULL,
          "actualDuration" INTEGER,
          "notes" TEXT,
          "shareInsightsWithClient" BOOLEAN NOT NULL DEFAULT true,
          "toolsUsed" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "dyteMeetingId" TEXT,
          "dyteRoomName" TEXT,
          
          CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Session_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Session_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `;
    }

    if (missingTables.includes('SessionTranscript')) {
      console.log('Criando tabela SessionTranscript...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "SessionTranscript" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "speaker" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "SessionTranscript_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "SessionTranscript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `;
    }

    if (missingTables.includes('AIInsight')) {
      console.log('Criando tabela AIInsight...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "AIInsight" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "keywords" TEXT,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "AIInsight_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `;
    }

    if (missingTables.includes('SessionReport')) {
      console.log('Criando tabela SessionReport...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "SessionReport" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "generatedBy" TEXT NOT NULL,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "SessionReport_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "SessionReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `;
    }

    if (missingTables.includes('TrainingMaterial')) {
      console.log('Criando tabela TrainingMaterial...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TrainingMaterial" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "categories" TEXT[],
          "videoUrl" TEXT,
          "isVideoTranscription" BOOLEAN NOT NULL DEFAULT false,
          "insights" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "documentName" TEXT,
          "documentPath" TEXT,
          "documentType" TEXT,
          "embedding" JSONB,
          
          CONSTRAINT "TrainingMaterial_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Adicionar os índices para TrainingMaterial
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "TrainingMaterial_userId_idx" ON "TrainingMaterial"("userId");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "TrainingMaterial_categories_idx" ON "TrainingMaterial"("categories");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "TrainingMaterial_status_idx" ON "TrainingMaterial"("status");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "TrainingMaterial_type_idx" ON "TrainingMaterial"("type");`;
    }

    console.log('Tabelas criadas com sucesso!');
    
    // Agora, vamos verificar novamente as tabelas para confirmar
    const updatedTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Tabelas existentes após as migrações:');
    console.log(updatedTables);
    
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRemainingTables(); 