/**
 * Serviço para interação com a API do Daily.co
 * 
 * Este serviço gerencia a criação, configuração e encerramento
 * de videoconferências utilizando a plataforma Daily.co
 */

const axios = require('axios');
require('dotenv').config();

// Constantes
const DAILY_API_KEY = process.env.DAILY_API_KEY || 'seu_api_key_aqui';
const DAILY_API_URL = 'https://api.daily.co/v1';

// Usando o domínio correto confirmado pelo usuário
const DAILY_DOMAIN = 'teraconect.daily.co';

class DailyService {
  constructor() {
    // Validar se a API key está configurada
    if (!DAILY_API_KEY || DAILY_API_KEY === 'seu_api_key_aqui') {
      console.warn('AVISO: API key do Daily.co não configurada. Algumas funcionalidades podem não funcionar corretamente.');
    }
    
    // Configurar cliente HTTP para API do Daily
    this.client = axios.create({
      baseURL: DAILY_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      timeout: 10000 // 10 segundos
    });
    
    console.log('Serviço Daily.co inicializado com domínio:', DAILY_DOMAIN);
  }
  
  /**
   * Valida se uma sala existe e a retorna, ou cria uma nova sala
   * @param {string} roomName - Nome da sala a verificar/criar
   * @returns {Promise<Object>} - Detalhes da sala
   */
  async validateAndGetRoom(roomName) {
    try {
      // Remover prefixo 'tc-' se existir
      let cleanRoomName = roomName;
      if (roomName.startsWith('tc-')) {
        cleanRoomName = roomName.substring(3);
        console.log('Prefixo tc- removido, usando nome limpo:', cleanRoomName);
      }
      
      // Limitar o tamanho do nome da sala (Daily.co tem limite de caracteres)
      // Se for um UUID, usar apenas os primeiros 8 caracteres
      if (cleanRoomName && cleanRoomName.length > 16) {
        const shortRoomName = cleanRoomName.substring(0, 16);
        console.log('Nome de sala muito longo, truncando para:', shortRoomName);
        cleanRoomName = shortRoomName;
      }
      
      // Verificar se a sala já existe
      try {
        const response = await this.client.get(`/rooms/${cleanRoomName}`);
        console.log('Sala existente encontrada:', cleanRoomName);
        return {
          url: `https://${DAILY_DOMAIN}/${cleanRoomName}`,
          name: cleanRoomName
        };
      } catch (error) {
        // Se a sala não existe (404) ou outro erro, criamos uma nova
        if (error.response && error.response.status === 404) {
          console.log('Sala não existe, criando nova:', cleanRoomName);
          return await this.createRoom(cleanRoomName);
        } else {
          console.error('Erro ao verificar sala:', error.message);
          throw error;
        }
      }
    } catch (error) {
      console.error('Erro em validateAndGetRoom:', error);
      throw new Error(`Falha ao validar/criar sala: ${error.message}`);
    }
  }
  
  /**
   * Cria uma nova sala no Daily.co
   * @param {string} roomName - Nome da sala (opcional)
   * @param {number} expiryHours - Horas até a expiração da sala (opcional)
   * @returns {Promise<Object>} - Detalhes da sala criada
   */
  async createRoom(roomName, expiryHours = 24) {
    try {
      // Remover prefixo 'tc-' se existir
      let cleanRoomName = roomName;
      if (roomName && roomName.startsWith('tc-')) {
        cleanRoomName = roomName.substring(3);
        console.log('Prefixo tc- removido para criação, usando nome limpo:', cleanRoomName);
      }
      
      // Gerar um nome curto e simples baseado em timestamp para garantir compatibilidade
      // Evitar usar UUIDs ou IDs complexos que podem causar problemas
      const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos do timestamp
      const roomPrefix = 'room';
      
      // Nome final da sala (ex: room123456)
      const finalRoomName = `${roomPrefix}${timestamp}`;
      
      console.log('Nome original muito longo ou complexo, usando nome simples:', finalRoomName);
      console.log('Criando sala Daily.co com nome final:', finalRoomName);
      
      // Configurar propriedades da sala
      const properties = {
        privacy: 'public',
        properties: {
          exp: Math.floor(Date.now() / 1000) + (expiryHours * 60 * 60), // Expiração em segundos
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          enable_knocking: true,
          enable_prejoin_ui: true,
          enable_pip_ui: true // Habilitar Picture-in-Picture nativo
        }
      };
      
      const response = await this.client.post('/rooms', {
        name: finalRoomName,
        ...properties
      });
      
      const createdRoom = response.data;
      console.log('Sala Daily.co criada com sucesso:', finalRoomName, 'URL:', `https://${DAILY_DOMAIN}/${finalRoomName}`);
      
      // Retornar os detalhes da sala criada
      return {
        url: `https://${DAILY_DOMAIN}/${finalRoomName}`,
        name: finalRoomName // Nome simples, sem prefixo e sem caracteres problemáticos
      };
    } catch (error) {
      console.error('Erro ao criar sala Daily.co:', error.response ? error.response.data : error.message);
      throw new Error(`Falha ao criar sala: ${error.message}`);
    }
  }
  
  /**
   * Exclui uma sala do Daily.co
   * @param {string} roomName - Nome da sala a ser excluída
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async deleteRoom(roomName) {
    try {
      await this.client.delete(`/rooms/${roomName}`);
      console.log('Sala Daily.co excluída:', roomName);
      return true;
    } catch (error) {
      // Se a sala não existe, consideramos como sucesso na exclusão
      if (error.response && error.response.status === 404) {
        console.log('Sala não existe, nada a excluir:', roomName);
        return true;
      }
      
      console.error('Erro ao excluir sala Daily.co:', error.response ? error.response.data : error.message);
      throw new Error(`Falha ao excluir sala: ${error.message}`);
    }
  }
  
  /**
   * Cria um token de acesso para uma sala
   * @param {string} roomName - Nome da sala
   * @param {Object} options - Opções do token
   * @returns {Promise<Object>} - Token gerado
   */
  async createMeetingToken(roomName, options = {}) {
    try {
      const tokenOptions = {
        properties: {
          room_name: roomName,
          user_name: options.userName || 'Usuário',
          user_id: options.userId || `user-${Date.now()}`,
          is_owner: options.isOwner || false,
          start_audio_off: options.startAudioOff || false,
          start_video_off: options.startVideoOff || false,
          exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 horas de validade
        }
      };
      
      const response = await this.client.post('/meeting-tokens', tokenOptions);
      return {
        token: response.data.token,
        expires: response.data.expires_at
      };
    } catch (error) {
      console.error('Erro ao criar token Daily.co:', error.response ? error.response.data : error.message);
      throw new Error(`Falha ao criar token: ${error.message}`);
    }
  }
  
  /**
   * Verifica o status de uma sala
   * @param {string} roomName - Nome da sala
   * @returns {Promise<Object>} - Status da sala
   */
  async getRoomStatus(roomName) {
    try {
      const response = await this.client.get(`/rooms/${roomName}`);
      return {
        exists: true,
        created: response.data.created_at,
        expires: response.data.config && response.data.config.exp,
        details: response.data
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          exists: false,
          message: 'Sala não encontrada'
        };
      }
      
      console.error('Erro ao verificar status da sala Daily.co:', error.response ? error.response.data : error.message);
      throw new Error(`Falha ao verificar status da sala: ${error.message}`);
    }
  }
}

// Criar uma instância do serviço para exportação
const dailyService = new DailyService();

// Exportar o serviço
module.exports = dailyService; 