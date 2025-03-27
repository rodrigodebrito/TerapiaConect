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
   * @returns {Promise} Resposta da API com análise
   */
  analyzeSession: async (sessionId, transcript = null) => {
    try {
      console.log('AI Service: Solicitando análise para sessão', sessionId);
      console.log('AI Service: Transcript:', transcript ? transcript.substring(0, 100) + '...' : 'Não fornecido');
      
      const payload = {
        sessionId,
        transcript
      };
      
      console.log('AI Service: Enviando payload para análise:', payload);
      
      const response = await api.post('/ai/analyze', payload);
      
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
      
      // Verificar formato da resposta
      const responseData = response.data;
      
      if (responseData.data && responseData.data.analysis) {
        // Formatar resposta no formato esperado pelo frontend
        console.log('AI Service: Formatando resposta de análise do OpenAI');
        return {
          type: 'analysis',
          analysis: responseData.data.analysis,
          content: 'Análise baseada na transcrição da sessão atual'
        };
      }
      
      // Se não houver análise, adicionar uma mensagem padrão
      if (!responseData.analysis && !responseData.error) {
        responseData.analysis = 'Não foram identificados padrões específicos nesta conversa.';
        responseData.content = 'Continue a sessão para obter insights mais específicos.';
      }
      
      return responseData;
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
      console.log('AI Service: Solicitando relatório para sessão', sessionId);
      
      const payload = {
        sessionId,
        transcript
      };
      
      console.log('AI Service: Enviando payload para relatório:', payload);
      
      const response = await api.post('/ai/report', payload);
      
      // Resposta completa para depuração
      console.log('AI Service: Resposta completa:', JSON.stringify(response.data));
      
      // Se houver um erro explícito na resposta
      if (response.data && response.data.error) {
        console.error('AI Service: Erro recebido na resposta:', response.data.error);
        return {
          type: 'report',
          error: response.data.error,
          report: `Erro ao gerar relatório: ${response.data.error || 'Erro desconhecido'}`
        };
      }
      
      // Extrair exatamente o que está vindo no data.report
      if (response.data && response.data.report) {
        console.log('AI Service: Campo report encontrado diretamente na resposta');
        return {
          type: 'report',
          report: response.data.report
        };
      }
      
      // Tentar extrair de data.data.report
      if (response.data && response.data.data && response.data.data.report) {
        console.log('AI Service: Campo report encontrado em data.data');
        return {
          type: 'report',
          report: response.data.data.report
        };
      }
      
      // Verificar o campo content - pode conter o relatório completo
      if (response.data && response.data.content && response.data.content.length > 100) {
        console.log('AI Service: Usando campo content como relatório');
        return {
          type: 'report',
          report: response.data.content
        };
      }
      
      // Último caso - pegar qualquer campo de string que pareça conter um relatório
      for (const key in response.data) {
        if (typeof response.data[key] === 'string' && response.data[key].length > 200) {
          console.log('AI Service: Encontrado texto longo em campo:', key);
          return {
            type: 'report',
            report: response.data[key]
          };
        }
      }
      
      // Se chegamos aqui, retornamos uma mensagem padrão
      console.warn('AI Service: Não foi possível extrair um relatório da resposta');
      return {
        type: 'report',
        report: 'Não foi possível extrair o relatório da resposta. Por favor, tente novamente mais tarde.'
      };
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return {
        type: 'report',
        error: 'Erro ao conectar com o serviço de IA',
        report: 'Ocorreu um erro ao tentar conectar com o serviço de IA. Por favor, verifique sua conexão e tente novamente.'
      };
    }
  }
};

export default aiService; 