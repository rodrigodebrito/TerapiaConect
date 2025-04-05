/**
 * Serviço de transcrição para Daily
 * Este serviço unifica as capacidades de transcrição para videochamadas
 */

// Configurações padrão
const DEFAULT_LANGUAGE = 'pt-BR';
const TRANSCRIPTION_INTERVAL = 5000; // 5 segundos

/**
 * Inicia o serviço de transcrição
 * @param {Object} options - Opções de configuração
 * @param {Function} options.onTranscript - Callback para receber a transcrição
 * @param {string} options.language - Idioma da transcrição (padrão: 'pt-BR')
 * @param {string} options.roomName - Nome da sala para identificação
 * @param {string} options.mode - Modo de transcrição ('realtime' ou 'whisper')
 * @returns {Object} - Instância do serviço de transcrição
 */
export const startTranscriptionService = async ({ 
  onTranscript, 
  language = 'pt-BR',
  roomName = 'unknown',
  mode = 'realtime'
}) => {
  console.log(`Serviço de transcrição iniciado para sala: ${roomName}`);
  console.log(`Modo de transcrição: ${mode}`);
  
  // Configuração baseada no modo selecionado
  const config = {
    continuous: true,
    interim: mode === 'realtime',
    language,
    useWhisper: mode === 'whisper',
    enhancedModel: mode === 'whisper'
  };
  
  // Objeto de serviço que será retornado
  const service = {
    isActive: true,
    mode,
    roomName,
    transcript: '',
    recognition: null,
    stop: function() {
      this.isActive = false;
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {
          console.error('Erro ao parar reconhecimento:', e);
        }
      }
    }
  };
  
  // Implementação do reconhecimento baseado no navegador
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('API de reconhecimento de voz não suportada neste navegador');
      throw new Error('Reconhecimento de voz não suportado');
    }
    
    const recognition = new SpeechRecognition();
    service.recognition = recognition;
    
    // Configurar o reconhecimento
    recognition.lang = config.language;
    recognition.continuous = config.continuous;
    recognition.interimResults = config.interim;
    
    // Manipulador para resultados do reconhecimento
    recognition.onresult = (event) => {
      if (!service.isActive) return;
      
      let fullText = '';
      let isFinal = false;
      
      // Processar resultados
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        isFinal = event.results[i].isFinal;
        
        if (isFinal) {
          fullText += transcript + ' ';
          service.transcript += transcript + ' ';
        } else if (config.interim) {
          fullText = transcript;
        }
      }
      
      // Notificar quando houver texto
      if (fullText.trim() && onTranscript) {
        onTranscript(mode === 'whisper' ? service.transcript : fullText);
        
        // Disparar evento para outros componentes
        const transcriptEvent = new CustomEvent('transcript-updated', {
          detail: {
            roomName,
            fullText: mode === 'whisper' ? service.transcript : fullText,
            isFinal
          }
        });
        window.dispatchEvent(transcriptEvent);
      }
    };
    
    // Manipuladores de erro e finalização
    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento de voz:', event.error);
      if (event.error === 'no-speech' && service.isActive) {
        // Tentar reiniciar automaticamente em caso de ausência de fala
        try {
          recognition.start();
        } catch (e) {
          console.warn('Não foi possível reiniciar o reconhecimento');
        }
      }
    };
    
    recognition.onend = () => {
      // Reiniciar se ainda estiver ativo
      if (service.isActive) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Não foi possível reiniciar o reconhecimento');
          service.isActive = false;
        }
      }
    };
    
    // Iniciar o reconhecimento
    recognition.start();
    
    // Disparar evento de início
    window.dispatchEvent(new CustomEvent('recording-started', {
      detail: { roomName, mode }
    }));
    
    return service;
  } catch (error) {
    console.error('Erro ao inicializar reconhecimento de voz:', error);
    throw error;
  }
};

/**
 * Para o serviço de transcrição
 * @param {Object} service - Instância do serviço de transcrição
 * @returns {boolean} - True se o serviço foi parado com sucesso
 */
export const stopTranscriptionService = (service) => {
  if (!service || !service.isActive) {
    return false;
  }
  
  try {
    service.stop();
    
    // Disparar evento de parada
    window.dispatchEvent(new CustomEvent('recording-stopped', {
      detail: { roomName: service.roomName }
    }));
    
    return true;
  } catch (error) {
    console.error('Erro ao parar serviço de transcrição:', error);
    return false;
  }
};

/**
 * Pausa o serviço de transcrição temporariamente
 * @param {Object} service - Instância do serviço de transcrição
 */
export const pauseTranscriptionService = (service) => {
  if (!service || !service.isActive) return;
  
  try {
    if (service.recognition) {
      service.recognition.stop();
    }
    
    service.isActive = false;
    console.log(`Serviço de transcrição pausado para sala: ${service.roomName}`);
  } catch (error) {
    console.error('Erro ao pausar serviço de transcrição:', error);
  }
};

/**
 * Retoma o serviço de transcrição pausado
 * @param {Object} service - Instância do serviço de transcrição
 */
export const resumeTranscriptionService = (service) => {
  if (!service || service.isActive) return;
  
  try {
    if (service.recognition) {
      service.recognition.start();
    }
    
    service.isActive = true;
    console.log(`Serviço de transcrição retomado para sala: ${service.roomName}`);
  } catch (error) {
    console.error('Erro ao retomar serviço de transcrição:', error);
  }
};

export default {
  startTranscriptionService,
  stopTranscriptionService,
  pauseTranscriptionService,
  resumeTranscriptionService
}; 