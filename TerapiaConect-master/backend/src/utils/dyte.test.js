/**
 * Script para testar a conexão com o Dyte
 * 
 * Execute com: node src/utils/dyte.test.js
 */

require('dotenv').config();
const axios = require('axios');

// Obter configurações do ambiente
const DYTE_CONFIG = {
  organizationId: process.env.DYTE_ORGANIZATION_ID,
  apiKey: process.env.DYTE_API_KEY,
  baseUrl: process.env.DYTE_BASE_URL || 'https://api.dyte.io/v2',
  authorizationHeader: process.env.DYTE_AUTH_HEADER
};

// Verificar configurações
console.log('=== Configuração do Dyte ===');
console.log('Base URL:', DYTE_CONFIG.baseUrl);
console.log('Organization ID:', DYTE_CONFIG.organizationId);
console.log('API Key:', DYTE_CONFIG.apiKey ? `${DYTE_CONFIG.apiKey.substring(0, 3)}...${DYTE_CONFIG.apiKey.substring(DYTE_CONFIG.apiKey.length - 3)}` : 'Não configurado');
console.log('Auth Header:', DYTE_CONFIG.authorizationHeader ? 'Configurado' : 'Não configurado');

// Testar chamada para listar reuniões
async function testDyteConnection() {
  try {
    console.log('\n=== Testando conexão com o Dyte ===');
    
    // Testar chamada para listar reuniões
    const response = await axios.get(`${DYTE_CONFIG.baseUrl}/meetings`, {
      headers: {
        'Authorization': DYTE_CONFIG.authorizationHeader,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Conexão bem sucedida!');
    console.log('Status da resposta:', response.status);
    console.log('Quantidade de reuniões:', response.data.data.length);
    
    // Testar listagem de presets disponíveis
    const presetsResponse = await axios.get(`${DYTE_CONFIG.baseUrl}/presets`, {
      headers: {
        'Authorization': DYTE_CONFIG.authorizationHeader,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n=== Presets disponíveis ===');
    const presets = presetsResponse.data.data;
    presets.forEach(preset => {
      console.log(`- ${preset.name}`);
    });
    
    return true;
  } catch (error) {
    console.error('\n=== ERRO DE CONEXÃO ===');
    console.error('Detalhes:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    
    return false;
  }
}

// Executar teste
testDyteConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Teste concluído com sucesso!');
    } else {
      console.log('\n❌ Falha no teste de conexão.');
    }
  })
  .catch(err => {
    console.error('\n❌ Erro ao executar teste:', err);
  }); 