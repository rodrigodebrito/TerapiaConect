/**
 * Configuração do cliente Prisma
 * Este arquivo exporta uma instância do cliente Prisma que pode ser importada
 * em qualquer lugar do código para realizar operações no banco de dados.
 */

const { PrismaClient } = require('@prisma/client');

// Verificar configuração de debug do Prisma no .env
const debugPrisma = process.env.DEBUG_PRISMA === 'true';

// Inicializa o cliente Prisma com configurações de log baseadas no ambiente
const prisma = new PrismaClient({
  log: debugPrisma || process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

// Função para testar a conexão com o banco de dados
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    return false;
  }
}

// Testar a conexão quando o arquivo for carregado
testConnection();

// Exportar o cliente Prisma para uso em outros arquivos
module.exports = prisma; 