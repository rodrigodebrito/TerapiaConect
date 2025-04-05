const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Consulta SQL para listar todas as tabelas
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Tabelas existentes no banco de dados:');
    console.log(result);
    
  } catch (error) {
    console.error('Erro ao verificar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 