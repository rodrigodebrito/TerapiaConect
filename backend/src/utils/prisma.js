/**
 * Configuração do cliente Prisma
 * Este arquivo exporta uma instância do cliente Prisma que pode ser importada
 * em qualquer lugar do código para realizar operações no banco de dados.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma compartilhado para toda a aplicação
 * 
 * Isso garante que usamos uma única instância do PrismaClient
 * em toda a aplicação, evitando múltiplas conexões.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Configurar manipuladores de eventos para prisma
prisma.$on('query', (e) => {
  if (process.env.DEBUG_PRISMA === 'true') {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  }
});

// Manipular erro de conexão
prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
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
export default prisma; 