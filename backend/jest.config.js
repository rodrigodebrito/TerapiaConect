module.exports = {
  // O diretório onde o Jest deve procurar por testes
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.js'],
  
  // Definir o ambiente de teste
  testEnvironment: 'node',
  
  // Ignorar alguns diretórios
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Configuração para tratamento de mocks
  // Limpar mocks entre testes
  clearMocks: true,
  
  // Arquivos para mock automático
  automock: false,
  
  // Configurar cobertura se desejado
  collectCoverage: false,
  
  // Criar mocks para os módulos do Node.js
  setupFiles: ['./tests/setup-tests.js'],
  
  // Tempo limite para os testes
  testTimeout: 30000,
}; 