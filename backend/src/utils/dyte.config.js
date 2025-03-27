/**
 * Configuração da API do Dyte para videoconferência
 * 
 * Este arquivo contém as credenciais e configurações para
 * integração com a plataforma Dyte.io
 */

// Usar .env para as credenciais sensíveis
require('dotenv').config();

const DYTE_CONFIG = {
  organizationId: process.env.DYTE_ORGANIZATION_ID || 'SEU_ORGANIZATION_ID',
  apiKey: process.env.DYTE_API_KEY || 'SUA_API_KEY',
  baseUrl: process.env.DYTE_BASE_URL || 'SUA_BASE_URL',
  authorizationHeader: process.env.DYTE_AUTH_HEADER || 'SEU_AUTHORIZATION_HEADER',
};

module.exports = DYTE_CONFIG; 