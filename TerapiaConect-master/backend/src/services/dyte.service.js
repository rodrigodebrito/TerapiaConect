/**
 * Serviço para interação com a API do Dyte
 * 
 * Este serviço gerencia a criação, configuração e gerenciamento
 * de videoconferências utilizando a plataforma Dyte.io
 */

const axios = require('axios');
const DYTE_CONFIG = require('../utils/dyte.config');

class DyteService {
  constructor() {
    // Validar se as configurações do Dyte estão presentes
    if (!DYTE_CONFIG.organizationId || DYTE_CONFIG.organizationId === 'SEU_ORGANIZATION_ID') {
      console.error('ERRO DE CONFIGURAÇÃO: Dyte Organization ID não configurado');
    }
    
    if (!DYTE_CONFIG.apiKey || DYTE_CONFIG.apiKey === 'SUA_API_KEY') {
      console.error('ERRO DE CONFIGURAÇÃO: Dyte API Key não configurada');
    }
    
    if (!DYTE_CONFIG.authorizationHeader || DYTE_CONFIG.authorizationHeader === 'SEU_AUTHORIZATION_HEADER') {
      console.error('ERRO DE CONFIGURAÇÃO: Dyte Authorization Header não configurado');
    }
    
    console.log('Inicializando serviço Dyte com URL:', DYTE_CONFIG.baseUrl);
    
    this.axios = axios.create({
      baseURL: DYTE_CONFIG.baseUrl,
      headers: {
        'Authorization': DYTE_CONFIG.authorizationHeader,
        'Content-Type': 'application/json'
      },
      // Aumentar timeout para lidar com possíveis latências
      timeout: 10000
    });
  }

  /**
   * Cria uma nova reunião no Dyte
   * @param {string} title Título da reunião/sessão
   * @param {Object} options Opções adicionais para a reunião
   * @returns {Promise<Object>} Dados da reunião criada
   */
  async createMeeting(title, options = {}) {
    try {
      console.log('Criando reunião no Dyte com título:', title);
      
      const payload = {
        title: title,
        preferred_region: 'us-east-1', // Definir região preferida
        record_on_start: false, // Não iniciar gravação automaticamente
        ...options
      };
      
      console.log('Payload para criação de reunião:', payload);
      
      const response = await this.axios.post('/meetings', payload);
      
      console.log('Reunião criada no Dyte com sucesso:', {
        id: response.data.data.id,
        roomName: response.data.data.room_name,
        status: response.data.data.status
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar reunião no Dyte:', error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes da resposta de erro:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw new Error('Falha ao criar reunião no Dyte: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Adiciona um participante à reunião
   * @param {string} meetingId ID da reunião no Dyte
   * @param {string} name Nome do participante
   * @param {string} userId ID do usuário no sistema
   * @param {string} role Papel do participante (host, participant, etc)
   * @param {Object} options Opções adicionais para o participante
   * @returns {Promise<Object>} Dados do participante adicionado
   */
  async addParticipant(meetingId, name, userId, role = 'participant', options = {}) {
    try {
      console.log('Adicionando participante à reunião:', {
        meetingId,
        name,
        userId,
        role
      });
      
      const payload = {
        name: name,
        custom_participant_id: userId,
        preset_name: role,
        ...options
      };
      
      console.log('Payload para adição de participante:', payload);
      
      const response = await this.axios.post(`/meetings/${meetingId}/participants`, payload);
      
      console.log('Participante adicionado à reunião com sucesso:', {
        authToken: response.data.data.token ? 'Token gerado com sucesso' : 'Token não gerado',
        id: response.data.data.id
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar participante à reunião:', error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes da resposta de erro:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw new Error('Falha ao adicionar participante à reunião: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Cria presets para diferentes tipos de participantes
   * @param {string} name Nome do preset
   * @param {Object} permissions Permissões do preset
   * @returns {Promise<Object>} Dados do preset criado
   */
  async createPreset(name, permissions) {
    try {
      const response = await this.axios.post('/presets', {
        name: name,
        permissions: permissions
      });
      
      console.log('Preset criado no Dyte:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar preset no Dyte:', error.response?.data || error.message);
      throw new Error('Falha ao criar preset no Dyte');
    }
  }

  /**
   * Obtém informações de uma reunião específica
   * @param {string} meetingId ID da reunião no Dyte
   * @returns {Promise<Object>} Dados da reunião
   */
  async getMeeting(meetingId) {
    try {
      const response = await this.axios.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações da reunião:', error.response?.data || error.message);
      throw new Error('Falha ao obter informações da reunião');
    }
  }

  /**
   * Encerra uma reunião
   * @param {string} meetingId ID da reunião no Dyte
   * @returns {Promise<Object>} Resposta da API
   */
  async endMeeting(meetingId) {
    try {
      const response = await this.axios.post(`/meetings/${meetingId}/end`);
      console.log('Reunião encerrada no Dyte:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao encerrar reunião:', error.response?.data || error.message);
      throw new Error('Falha ao encerrar reunião');
    }
  }
}

module.exports = new DyteService(); 