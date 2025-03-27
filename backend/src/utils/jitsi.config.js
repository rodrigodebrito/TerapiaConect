/**
 * Configurações do Jitsi Meet para a aplicação
 */

// Carregar variáveis de ambiente
require('dotenv').config();

// Configurações do Jitsi
const JITSI_CONFIG = {
  // Domínio do servidor Jitsi
  domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
  
  // ID da aplicação para autenticação JWT
  appId: process.env.JITSI_APP_ID || 'terapiaconect',
  
  // Segredo para assinar tokens JWT
  appSecret: process.env.JITSI_APP_SECRET || 'terapiaconect_secret',
  
  // Configurações padrão da interface
  defaultOptions: {
    // Habilitar modo de moderador
    startAsModerator: true,
    
    // Desabilitar lobby
    enableLobby: false,
    
    // Configurações de áudio/vídeo
    defaultAudioQuality: 'high',
    
    // Desabilitar tela de prejoin
    prejoinConfig: {
      enabled: false
    }
  }
};

module.exports = JITSI_CONFIG; 