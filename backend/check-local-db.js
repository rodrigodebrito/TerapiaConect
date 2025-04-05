const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocalDatabase() {
  try {
    // Consulta SQL para listar todas as tabelas
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Tabelas existentes no banco de dados local:');
    console.log(result);

    // Para cada tabela, vamos listar suas colunas
    for (const table of result) {
      const tableName = table.table_name;
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;
      
      console.log(`\nEstrutura da tabela ${tableName}:`);
      console.log(columns);
    }
    
  } catch (error) {
    console.error('Erro ao verificar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocalDatabase(); 