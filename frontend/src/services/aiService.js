import api from './api';

/**
 * Serviço para interações com a IA
 */
const aiService = {
  /**
   * Enviar transcrição da sessão para o servidor
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Texto da transcrição
   * @param {Object} emotions - Objeto com as emoções detectadas
   * @returns {Promise} Resposta da API
   */
  saveTranscript: async (sessionId, transcript, emotions = null) => {
    try {
      const response = await api.post('/ai/transcript', {
        sessionId,
        transcript,
        emotions
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar transcrição:', error);
      throw error;
    }
  },

  /**
   * Solicitar análise da sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Transcrição opcional (pode ser obtida do servidor)
   * @param {boolean} useAdvancedAnalysis - Se deve usar análise avançada
   * @returns {Promise} Resposta da API com análise
   */
  analyzeSession: async (sessionId, transcript = null, useAdvancedAnalysis = false) => {
    try {
      console.log('AI Service: Solicitando análise para sessão', sessionId);
      console.log('AI Service: Transcript:', transcript ? transcript.substring(0, 100) + '...' : 'Não fornecido');
      console.log('AI Service: Usar análise avançada:', useAdvancedAnalysis);
      
      const payload = {
        sessionId,
        transcript,
        useAdvancedAnalysis
      };
      
      console.log('AI Service: Enviando payload para análise:', payload);
      
      // Usar o endpoint correto com base no tipo de análise
      const endpoint = useAdvancedAnalysis 
        ? '/ai/analyze-session/advanced' 
        : '/ai/analyze-session';
      
      const response = await api.post(endpoint, payload);
      
      console.log('AI Service: Resposta da análise recebida:', response.data);
      
      // Verificar se a resposta contém dados válidos
      if (!response.data || (Object.keys(response.data).length === 0)) {
        console.warn('AI Service: Resposta vazia recebida do servidor para análise');
        return {
          type: 'analysis',
          analysis: 'Não foi possível gerar análise no momento.',
          content: 'O serviço de IA está temporariamente indisponível ou não há transcrição suficiente para análise.'
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Fornecer uma resposta de fallback em caso de erro
      return {
        type: 'analysis',
        error: 'Erro ao conectar com o serviço de IA',
        message: error.message,
        analysis: 'Não foi possível realizar a análise da sessão no momento.',
        content: 'Houve um problema ao processar sua solicitação de análise.'
      };
    }
  },

  /**
   * Solicitar sugestões para a sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Transcrição opcional (pode ser obtida do servidor)
   * @returns {Promise} Resposta da API com sugestões
   */
  generateSuggestions: async (sessionId, transcript = null) => {
    try {
      console.log('AI Service: Solicitando sugestões para sessão', sessionId);
      console.log('AI Service: Transcript:', transcript ? transcript.substring(0, 100) + '...' : 'Não fornecido');
      
      const payload = {
        sessionId,
        transcript
      };
      
      console.log('AI Service: Enviando payload:', payload);
      
      // Verificar se a API OpenAI está configurada
      try {
        const openaiCheck = await api.get('/ai/openai-check');
        console.log('AI Service: Status da API OpenAI:', openaiCheck.data);
      } catch (openaiError) {
        console.warn('AI Service: Erro ao verificar API OpenAI:', openaiError);
      }
      
      const response = await api.post('/ai/suggest', payload);
      
      console.log('AI Service: Resposta recebida:', response.data);
      
      // Verificar se a resposta contém dados válidos
      if (!response.data || (Object.keys(response.data).length === 0)) {
        console.warn('AI Service: Resposta vazia recebida do servidor');
        return {
          type: 'suggestions',
          suggestions: ['Não foi possível gerar sugestões no momento.'],
          content: 'O serviço de IA está temporariamente indisponível ou não há transcrição suficiente para análise.'
        };
      }
      
      // Verificar formato da resposta
      const responseData = response.data;
      
      if (responseData.data && responseData.data.suggestions) {
        // Formatar resposta no formato esperado pelo frontend
        console.log('AI Service: Formatando resposta com sugestões do OpenAI');
        return {
          type: 'suggestions',
          suggestions: typeof responseData.data.suggestions === 'string' 
            ? responseData.data.suggestions.split('\n').filter(line => line.trim())
            : [responseData.data.suggestions],
          content: 'Sugestões baseadas na análise da sessão atual'
        };
      }
      
      // Se não houver sugestões, adicionar uma mensagem padrão
      if (!responseData.suggestions && !responseData.error) {
        responseData.suggestions = ['Não foram encontradas sugestões específicas para esta conversa.'];
        responseData.content = 'Continue a sessão para obter insights mais específicos.';
      }
      
      return responseData;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Fornecer uma resposta de fallback em caso de erro
      return {
        type: 'suggestions',
        error: 'Erro ao conectar com o serviço de IA',
        message: error.message,
        suggestions: ['Tente novamente mais tarde.'],
        content: 'Houve um problema ao processar sua solicitação.'
      };
    }
  },

  /**
   * Solicitar relatório da sessão
   * @param {string} sessionId - ID da sessão
   * @param {string} transcript - Transcrição opcional (pode ser obtida do servidor)
   * @returns {Promise} Resposta da API com relatório
   */
  generateReport: async (sessionId, transcript = null) => {
    try {
      console.log(`aiService: Gerando relatório para sessão ${sessionId}`);
      
      // Preparar dados para enviar à API
      const payload = transcript 
        ? { sessionId, transcript } 
        : { sessionId };
      console.log(`aiService: Enviando payload para API:`, payload);
      
      // Fazer chamada à API - remover o prefixo '/api'
      const response = await api.post('/ai/report', payload);
      
      // Verificar e logar a resposta
      console.log(`aiService: Resposta da API:`, response);
      if (!response || !response.data) {
        console.error('aiService: Resposta vazia ou inválida da API');
        return { error: 'Resposta vazia ou inválida da API' };
      }
      
      // Retornar dados
      console.log(`aiService: Retornando dados do relatório:`, response.data);
      return response.data;
    } catch (error) {
      console.error('aiService: Erro ao gerar relatório:', error);
      return { 
        error: error.message, 
        status: error.response?.status,
        details: error.response?.data
      };
    }
  }
};

export default aiService; 