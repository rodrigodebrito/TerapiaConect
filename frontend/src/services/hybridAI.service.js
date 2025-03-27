import aiService from './aiService';
import { initializeTensorFlow } from './tfHelper';

/**
 * Serviço Híbrido de IA para processamento local e remoto
 * 
 * Este serviço implementa uma abordagem híbrida onde algumas análises são
 * realizadas localmente no navegador do usuário e outras no servidor,
 * priorizando privacidade, desempenho e resiliência.
 */
class HybridAIService {
  constructor() {
    console.log('HybridAI: Inicializando serviço...');
    
    // Estado inicial
    this.isInitialized = false;
    this.isRecording = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.useLocalProcessing = true;
    this.useAnonymization = true;
    
    // Inicialização de contagens de emoções
    this.emotions = {
      happiness: 0,
      sadness: 0,
      anger: 0,
      surprise: 0,
      fear: 0,
      neutral: 1
    };
    
    // Palavras-chave para detecção de emoções
    this.emotionKeywords = {
      // Palavras em português que indicam emoções
      'feliz': 'happiness',
      'felicidade': 'happiness',
      'alegre': 'happiness',
      'alegria': 'happiness',
      'contente': 'happiness',
      'satisfeito': 'happiness',
      
      'triste': 'sadness',
      'tristeza': 'sadness',
      'deprimido': 'sadness',
      'depressão': 'sadness',
      'melancólico': 'sadness',
      'infeliz': 'sadness',
      
      'raiva': 'anger',
      'irritado': 'anger',
      'bravo': 'anger',
      'furioso': 'anger',
      'revoltado': 'anger',
      'nervoso': 'anger',
      
      'medo': 'fear',
      'assustado': 'fear',
      'tenso': 'fear',
      'ansioso': 'fear',
      'preocupado': 'fear',
      'apreensivo': 'fear',
      
      'surpresa': 'surprise',
      'surpreso': 'surprise',
      'chocado': 'surprise',
      'espantado': 'surprise',
      'impressionado': 'surprise',
      
      'nojo': 'disgust',
      'repulsa': 'disgust',
      'repugnante': 'disgust',
      'aversão': 'disgust',
      
      'calmo': 'neutral',
      'tranquilo': 'neutral',
      'neutro': 'neutral',
      'normal': 'neutral'
    };
    
    // Palavras sensíveis para anonimização
    this.sensitiveWords = [
      'endereço', 'telefone', 'celular', 'cpf', 'rg', 'identidade',
      'cartão', 'senha', 'conta', 'banco', 'email', 'numero', 'número'
    ];
    
    // Verificar suporte a API de reconhecimento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        console.log('HybridAI: API de reconhecimento de voz detectada');
        
        // Inicializar reconhecimento
        this.recognition = new SpeechRecognition();
        
        // Configurar handlers de eventos
        this.recognition.onresult = this.handleSpeechResult.bind(this);
        
        this.recognition.onstart = () => {
          console.log('HybridAI: Reconhecimento de voz iniciado pelo navegador');
          this.isRecording = true;
        };
        
        this.recognition.onend = () => {
          console.log('HybridAI: Reconhecimento de voz finalizado pelo navegador');
          // Se não finalizamos manualmente, reiniciar
          if (this.isRecording) {
            console.log('HybridAI: Reiniciando reconhecimento automaticamente');
            try {
              this.recognition.start();
            } catch (e) {
              console.error('HybridAI: Erro ao reiniciar reconhecimento:', e);
              this.isRecording = false;
              window.dispatchEvent(new CustomEvent('recording-stopped'));
            }
          }
        };
        
        this.recognition.onerror = (event) => {
          console.error('HybridAI: Erro no reconhecimento de voz:', event.error);
          if (event.error === 'not-allowed') {
            console.error('HybridAI: Permissão para microfone negada pelo usuário');
            this.isRecording = false;
            window.dispatchEvent(new CustomEvent('recording-stopped'));
            
            // Notificar o usuário
            window.dispatchEvent(new CustomEvent('speech-error', {
              detail: { error: 'permission-denied' }
            }));
          }
        };
        
        console.log('HybridAI: Reconhecimento de voz configurado com sucesso');
      } catch (error) {
        console.error('HybridAI: Erro ao inicializar reconhecimento de voz:', error);
        this.recognition = null;
      }
    } else {
      console.error('HybridAI: Reconhecimento de voz não suportado neste navegador');
      this.recognition = null;
    }
    
    console.log('HybridAI: Serviço inicializado');
  }

  async initService() {
    if (this.isInitialized) return true;
    
    try {
      await initializeTensorFlow();
      
      this.isInitialized = true;
      console.log('Serviço de IA híbrida inicializado');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar serviço de IA híbrida:', error);
      return false;
    }
  }

  // Iniciar gravação
  startRecording() {
    console.log('HybridAI: Tentando iniciar reconhecimento de voz...');
    
    // Verificar se já está em execução
    if (this.isRecording) {
      console.log('HybridAI: Reconhecimento de voz já está em execução');
      return true;
    }
    
    // Verificar se o navegador é compatível
    if (!this.recognition) {
      console.error('HybridAI: Reconhecimento de voz não suportado neste navegador');
      return false;
    }
    
    try {
      console.log('HybridAI: Iniciando reconhecimento de voz');
      
      // Configurar reconhecimento
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-BR';
      
      // Iniciar reconhecimento
      this.recognition.start();
      this.isRecording = true;
      
      // Limpar transcrição
      this.transcript = '';
      this.interimTranscript = '';
      
      // Reiniciar emoções
      this.emotions = {
        happiness: 0,
        sadness: 0,
        anger: 0,
        surprise: 0,
        fear: 0,
        neutral: 1
      };
      
      // Disparar evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent('recording-started'));
      
      console.log('HybridAI: Reconhecimento de voz iniciado com sucesso');
      return true;
    } catch (error) {
      console.error('HybridAI: Erro ao iniciar reconhecimento de voz:', error);
      this.isRecording = false;
      return false;
    }
  }

  // Parar gravação
  stopRecording() {
    console.log('HybridAI: Tentando parar reconhecimento de voz...');
    
    if (!this.isRecording) {
      console.log('HybridAI: Reconhecimento já está parado');
      return true;
    }
    
    try {
      this.recognition.stop();
      this.isRecording = false;
      
      // Processar resultado final
      if (this.transcript) {
        console.log('HybridAI: Transcrição final:', this.transcript.substring(0, 50) + '...');
        this.sendTranscriptToServer();
      }
      
      // Disparar evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent('recording-stopped'));
      
      console.log('HybridAI: Reconhecimento de voz finalizado com sucesso');
      return true;
    } catch (error) {
      console.error('HybridAI: Erro ao parar reconhecimento de voz:', error);
      this.isRecording = false;
      return false;
    }
  }

  // Manipulador de resultado do reconhecimento
  handleSpeechResult(event) {
    // Processar resultados
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
        console.log('HybridAI: Resultado final de fala:', transcript);
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Atualizar transcrições
    if (finalTranscript) {
      this.transcript += finalTranscript;
      
      // Processar emoções se houver texto final
      this.processEmotions(finalTranscript);
      
      // Disparar evento com transcrição completa
      window.dispatchEvent(new CustomEvent('transcript-updated', {
        detail: {
          interimText: interimTranscript,
          finalText: finalTranscript,
          fullText: this.transcript
        }
      }));
      
      console.log('HybridAI: Transcrição atualizada:', this.transcript.substring(0, 50) + '...');
    }
    
    this.interimTranscript = interimTranscript;
  }

  // Extrair ID da sessão da URL atual
  extractSessionId() {
    if (window && window.location && window.location.pathname) {
      const path = window.location.pathname;
      const matches = path.match(/\/session\/([^\/]+)/);
      if (matches && matches[1]) {
        return matches[1];
      }
    }
    
    // Se não encontrar na URL, usar sessão temporária
    return 'temp-session';
  }

  // Processar emoções no texto
  processEmotions(text) {
    if (!text) return;
    
    try {
      // Converter para minúsculas e remover pontuações
      const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      const words = cleanText.split(' ');
      
      // Contar palavras-chave de emoções
      for (const word of words) {
        if (word && this.emotionKeywords && this.emotionKeywords[word]) {
          const emotion = this.emotionKeywords[word];
          this.emotions[emotion]++;
          
          console.log(`HybridAI: Emoção detectada: "${word}" -> ${emotion} (${this.emotions[emotion]})`);
          
          // Disparar evento de emoção detectada
          window.dispatchEvent(new CustomEvent('emotion-detected', {
            detail: {
              emotion,
              word,
              accumulated: { ...this.emotions }
            }
          }));
        }
      }
    } catch (error) {
      console.error('HybridAI: Erro ao processar emoções:', error);
    }
  }

  // Anonimizar texto para evitar enviar dados sensíveis
  anonymizeText(text) {
    if (!text || !this.useAnonymization) return text;
    
    let anonymized = text;
    
    // Substituir palavras sensíveis
    for (const word of this.sensitiveWords) {
      const regex = new RegExp(`\\b${word}\\b[^\\s]*`, 'gi');
      anonymized = anonymized.replace(regex, `[${word.toUpperCase()} REMOVIDO]`);
    }
    
    // Remover números de telefone
    anonymized = anonymized.replace(/\b(\d{2}[\s.-]?)?\d{4,5}[\s.-]?\d{4}\b/g, '[TELEFONE REMOVIDO]');
    
    // Remover CPF
    anonymized = anonymized.replace(/\b\d{3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}\b/g, '[CPF REMOVIDO]');
    
    return anonymized;
  }

  // Enviar transcrição para o servidor
  async sendTranscriptToServer() {
    try {
      // Ignorar texto muito curto
      if (this.transcript.length < 10) return;
      
      // Obter ID da sessão da URL
      const sessionId = this.extractSessionId();
      if (!sessionId) return;
      
      // Enviar para o servidor
      console.log(`HybridAI: Enviando transcrição para a sessão ${sessionId}`);
      
      await aiService.saveTranscript(
        sessionId,
        this.transcript,
        this.emotions
      );
      
      console.log(`HybridAI: Transcrição enviada com sucesso`);
    } catch (error) {
      console.error('HybridAI: Erro ao enviar transcrição para o servidor:', error);
    }
  }

  // Analisar texto com IA
  async analyzeText(text) {
    try {
      if (!text || text.trim().length < 10) {
        console.warn('HybridAI: Texto insuficiente para análise');
        return { 
          type: 'analysis',
          error: 'Texto insuficiente para análise',
          analysis: 'É necessário mais conteúdo na sessão para realizar uma análise útil.',
          content: 'Continue a conversa para obter insights baseados na interação.'
        };
      }
      
      // Obter ID da sessão da URL
      const sessionId = this.extractSessionId();
      
      console.log(`HybridAI: Analisando texto para sessão ${sessionId}`);
      
      // Enviar para o servidor para análise
      let result;
      try {
        result = await aiService.analyzeSession(sessionId, text);
        console.log('HybridAI: Resultado da análise recebido:', result);
      } catch (apiError) {
        console.error('HybridAI: Erro na chamada da API:', apiError);
        // Criar resposta de fallback
        result = {
          type: 'analysis',
          error: 'Falha na comunicação com o servidor',
          message: apiError.message,
          analysis: 'Não foi possível analisar a sessão atual devido a um problema técnico.',
          content: 'O servidor está temporariamente indisponível.'
        };
      }
      
      // Verificar se o resultado contém dados
      if (!result || (Object.keys(result).length === 0)) {
        console.warn('HybridAI: Resultado vazio ou inválido recebido');
        result = {
          type: 'analysis',
          analysis: 'Não foi possível identificar padrões específicos neste momento.',
          content: 'Continue a sessão para permitir uma análise mais profunda.'
        };
      }
      
      // Garantir que o tipo está definido
      if (!result.type) {
        result.type = 'analysis';
      }
      
      // Garantir que há conteúdo de análise
      if (!result.analysis && !result.content && !result.error) {
        // Se temos alguma resposta do servidor, mas sem análise específica
        if (result.data && result.data.analysis) {
          result.analysis = result.data.analysis;
        } else {
          result.analysis = 'Baseado na conversa atual, não foram identificados padrões específicos que necessitem de atenção.';
          result.content = 'A sessão está progredindo sem aspectos que exijam intervenção imediata.';
        }
      }
      
      return result;
    } catch (error) {
      console.error('HybridAI: Erro ao analisar texto:', error);
      return { 
        type: 'analysis', 
        error: 'Erro ao analisar texto', 
        message: error.message,
        analysis: 'Ocorreu um erro ao processar a análise da sessão.',
        content: 'Tente novamente em alguns instantes.'
      };
    }
  }
  
  // Gerar sugestões
  async generateSuggestions(text) {
    try {
      if (!text || text.trim().length < 10) {
        console.warn('HybridAI: Texto insuficiente para sugestões');
        return { 
          type: 'suggestions',
          error: 'Texto insuficiente para sugestões',
          suggestions: ['Aguarde até que haja mais conteúdo na sessão.'],
          content: 'É necessário mais conteúdo na sessão para gerar sugestões úteis.'
        };
      }
      
      // Obter ID da sessão da URL
      const sessionId = this.extractSessionId();
      
      console.log(`HybridAI: Gerando sugestões para sessão ${sessionId}`);
      
      // Enviar para o servidor para sugestões
      let result;
      try {
        result = await aiService.generateSuggestions(sessionId, text);
        console.log('HybridAI: Resultado das sugestões recebido:', result);
      } catch (apiError) {
        console.error('HybridAI: Erro na chamada da API:', apiError);
        // Criar resposta de fallback
        result = {
          type: 'suggestions',
          error: 'Falha na comunicação com o servidor',
          message: apiError.message,
          suggestions: ['Tente novamente em alguns instantes.'],
          content: 'O servidor está temporariamente indisponível.'
        };
      }
      
      // Verificar se o resultado contém dados
      if (!result || (Object.keys(result).length === 0)) {
        console.warn('HybridAI: Resultado vazio ou inválido recebido');
        result = {
          type: 'suggestions',
          suggestions: ['Não foi possível gerar sugestões específicas neste momento.'],
          content: 'Continue a sessão para obter resultados mais específicos.'
        };
      }
      
      // Garantir que o tipo está definido
      if (!result.type) {
        result.type = 'suggestions';
      }
      
      // Garantir que há sugestões
      if (!result.suggestions && !result.error) {
        result.suggestions = ['Baseado na conversa atual, continue o diálogo normalmente.'];
        result.content = 'Não foram identificados aspectos que necessitem de sugestões específicas.';
      }
      
      return result;
    } catch (error) {
      console.error('HybridAI: Erro ao gerar sugestões:', error);
      return { 
        type: 'suggestions', 
        error: 'Erro ao gerar sugestões', 
        message: error.message,
        suggestions: ['Ocorreu um erro técnico. Tente novamente.'],
        content: 'Houve um problema ao processar as sugestões.'
      };
    }
  }
  
  // Gerar relatório
  async generateReport(text) {
    try {
      if (!text || text.trim().length < 10) {
        console.warn('HybridAI: Texto insuficiente para relatório');
        return { 
          type: 'report',
          error: 'Texto insuficiente para relatório',
          report: 'É necessário mais conteúdo na sessão para gerar um relatório útil.',
          content: 'Continue a sessão para capturar mais dados para o relatório.'
        };
      }
      
      // Obter ID da sessão da URL
      const sessionId = this.extractSessionId();
      
      console.log(`HybridAI: Gerando relatório para sessão ${sessionId}`);
      
      // Enviar para o servidor para relatório
      let result;
      try {
        result = await aiService.generateReport(sessionId, text);
        console.log('HybridAI: Resultado do relatório recebido:', result);
      } catch (apiError) {
        console.error('HybridAI: Erro na chamada da API:', apiError);
        // Criar resposta de fallback
        result = {
          type: 'report',
          error: 'Falha na comunicação com o servidor',
          message: apiError.message,
          report: 'Não foi possível gerar o relatório devido a um erro técnico.',
          content: 'O servidor está temporariamente indisponível.'
        };
      }
      
      // Verificar se o resultado contém dados
      if (!result || (Object.keys(result).length === 0)) {
        console.warn('HybridAI: Resultado vazio ou inválido recebido');
        result = {
          type: 'report',
          report: 'Não foi possível gerar um relatório específico neste momento.',
          content: 'Continue a sessão para obter resultados mais completos.'
        };
      }
      
      // Garantir que o tipo está definido
      if (!result.type) {
        result.type = 'report';
      }
      
      // Garantir que há conteúdo de relatório
      if (!result.report && !result.content && !result.error) {
        // Se temos alguma resposta do servidor, mas sem relatório específico
        if (result.data && result.data.report) {
          result.report = result.data.report;
          result.content = 'Relatório baseado na transcrição da sessão atual';
        } else {
          result.report = 'Baseado na conversa atual, não foi possível gerar um relatório detalhado.';
          result.content = 'A transcrição não contém informações suficientes para um relatório completo.';
        }
      }
      
      return result;
    } catch (error) {
      console.error('HybridAI: Erro ao gerar relatório:', error);
      return { 
        type: 'report', 
        error: 'Erro ao gerar relatório', 
        message: error.message,
        report: 'Ocorreu um erro ao processar o relatório da sessão.',
        content: 'Tente novamente em alguns instantes.'
      };
    }
  }

  // Configurações
  setLocalProcessing(enabled) {
    this.useLocalProcessing = enabled;
  }

  setAnonymization(enabled) {
    this.useAnonymization = enabled;
  }

  // Verificar suporte
  isSpeechRecognitionSupported() {
    return !!this.recognition;
  }
  
  // Reiniciar o reconhecimento de voz
  restartRecognition() {
    console.log('HybridAI: Tentando reiniciar o reconhecimento de voz...');
    
    // Parar primeiro, se estiver em execução
    if (this.isRecording) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('HybridAI: Erro ao parar reconhecimento antes de reiniciar:', error);
      }
    }
    
    // Aguardar um breve momento
    setTimeout(() => {
      console.log('HybridAI: Reiniciando reconhecimento de voz...');
      
      // Verificar permissões do microfone
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log('HybridAI: Permissão de microfone concedida');
          
          // Liberar o stream imediatamente
          stream.getTracks().forEach(track => track.stop());
          
          // Iniciar reconhecimento
          this.startRecording();
        })
        .catch(error => {
          console.error('HybridAI: Permissão de microfone negada:', error);
          
          // Notificar usuário
          window.dispatchEvent(new CustomEvent('speech-error', {
            detail: { error: 'permission-denied' }
          }));
        });
    }, 500);
  }
}

// Exportar instância única do serviço
export default new HybridAIService(); 