/**
 * Configurações de ambiente para a aplicação
 */

// No React, as variáveis de ambiente devem ter o prefixo REACT_APP_
// E são injetadas no build pelo create-react-app
const getEnvVar = (name, defaultValue) => {
  // No browser puro, process.env não existe
  // Em aplicações React, elas são acessíveis como window.env ou process.env
  if (typeof window !== 'undefined' && window.env && window.env[name]) {
    return window.env[name];
  }
  
  try {
    // Tentar acessar process.env com segurança
    return process.env && process.env[name] ? process.env[name] : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const environments = {
  development: {
    apiUrl: '/api',
    baseUrl: window.location.origin,
    dailyApiKey: 'e70077d9b78043fac2ba899cbfec34c9ab88d8dfad6dbb374e0c7722b8d8759e',
    dailyDomain: 'teraconect.daily.co'
  },
  production: {
    apiUrl: 'https://terapiaconect.onrender.com/api',
    baseUrl: window.location.origin,
    dailyApiKey: 'e70077d9b78043fac2ba899cbfec34c9ab88d8dfad6dbb374e0c7722b8d8759e',
    dailyDomain: 'teraconect.daily.co'
  }
};

// Determinar ambiente atual com base na URL
const isProduction = 
  window.location.hostname !== 'localhost' && 
  !window.location.hostname.includes('127.0.0.1');

// Exportar configuração do ambiente apropriado
const config = isProduction ? environments.production : environments.development;

export default config; 