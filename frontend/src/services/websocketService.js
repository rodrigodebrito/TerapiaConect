/**
 * Serviço para gerenciar conexões WebSocket
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 segundos
  }

  /**
   * Conectar ao servidor WebSocket
   * @param {string} sessionId - ID da sessão
   * @param {string} token - Token JWT para autenticação
   * @returns {Promise} - Promessa resolvida quando a conexão é estabelecida
   */
  connect(sessionId, token) {
    return new Promise((resolve, reject) => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = process.env.REACT_APP_WS_URL || `${wsProtocol}//${window.location.hostname}:3000`;
      
      this.socket = new WebSocket(`${wsUrl}/ws/session/${sessionId}?token=${token}`);

      this.socket.onopen = () => {
        console.log('Conexão WebSocket estabelecida');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.socket.onclose = (event) => {
        console.log('Conexão WebSocket fechada:', event.code, event.reason);
        this.isConnected = false;
        
        // Tentar reconectar se não foi um fechamento normal
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            this.connect(sessionId, token).catch(console.error);
          }, this.reconnectInterval);
        }
        
        this._notifyListeners('disconnect', { code: event.code, reason: event.reason });
      };

      this.socket.onerror = (error) => {
        console.error('Erro na conexão WebSocket:', error);
        reject(error);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._notifyListeners(data.type, data.payload);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };
    });
  }

  /**
   * Desconectar do servidor WebSocket
   */
  disconnect() {
    if (this.socket && this.isConnected) {
      this.socket.close(1000, 'Desconexão normal');
      this.isConnected = false;
    }
  }

  /**
   * Enviar mensagem para o servidor
   * @param {string} type - Tipo da mensagem
   * @param {Object} payload - Dados da mensagem
   * @returns {boolean} - True se a mensagem foi enviada com sucesso
   */
  send(type, payload) {
    if (!this.socket || !this.isConnected) {
      console.error('Tentativa de enviar mensagem sem conexão WebSocket');
      return false;
    }

    try {
      const message = JSON.stringify({ type, payload });
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem WebSocket:', error);
      return false;
    }
  }

  /**
   * Registrar listener para eventos
   * @param {string} type - Tipo do evento
   * @param {Function} callback - Função de callback
   */
  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    
    this.listeners[type].push(callback);
  }

  /**
   * Remover listener para eventos
   * @param {string} type - Tipo do evento
   * @param {Function} callback - Função de callback para remover
   */
  off(type, callback) {
    if (!this.listeners[type]) return;
    
    this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
  }

  /**
   * Notificar todos os listeners de um evento
   * @param {string} type - Tipo do evento
   * @param {Object} data - Dados do evento
   * @private
   */
  _notifyListeners(type, data) {
    if (!this.listeners[type]) return;
    
    this.listeners[type].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erro no listener de tipo ${type}:`, error);
      }
    });
  }
}

// Singleton para ser usado em toda a aplicação
const websocketService = new WebSocketService();

export default websocketService; 