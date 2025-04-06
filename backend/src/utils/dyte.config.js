/**
 * Configuração da API do Dyte para videoconferência
 * 
 * Este arquivo contém as credenciais e configurações para
 * integração com a plataforma Dyte.io
 */

// Usar .env para as credenciais sensíveis
require('dotenv').config();

// Para desenvolvimento rápido, usar valores do código se não existirem no .env
// Em produção, esses valores DEVEM vir do .env
const DYTE_CONFIG = {
  // Valores fornecidos pelo cliente
  apiKey: process.env.DYTE_API_KEY || 'e70077d9b78043fac2ba899cbfec34c9ab88d8dfad6dbb374e0c7722b8d8759e',
  
  // Esses valores precisam ser obtidos no dashboard do Dyte
  // IMPORTANTE: Quando o cliente criar uma conta, substituir esses valores
  organizationId: process.env.DYTE_ORGANIZATION_ID || 'SUA_ORGANIZATION_ID',
  
  // Normalmente não precisamos alterar isso
  baseUrl: process.env.DYTE_BASE_URL || 'https://api.dyte.io/v2',
  
  // Esse valor é gerado a partir do organizationId e apiKey em produção
  authorizationHeader: process.env.DYTE_AUTH_HEADER || 'SEU_AUTHORIZATION_HEADER',
};

module.exports = DYTE_CONFIG; 