import aiService from './aiService';
import { initializeTensorFlow } from './tfHelper';
import config from '../environments';

/**
 * Serviço Híbrido de IA para processamento local e remoto
 * 
 * Este serviço implementa uma abordagem híbrida onde algumas análises são
 * realizadas localmente no navegador do usuário e outras no servidor,
 * priorizando privacidade, desempenho e resiliência.
 */
class HybridAIService {
  constructor() {
    try {
    console.log('HybridAI: Inicializando serviço...');
    
      // Inicializar variáveis internas
    this.transcript = '';
    this.interimTranscript = '';
      this.emotions = {};
      this.errorCount = 0;
      this.isRecording = false;
      this.isProcessingSpeech = false;
      this.currentTranscript = '';
      this.transcriptionHistory = [];
      this.fullSessionText = '';
      this.sessionId = null;
      this.isListening = false;
      this.autoRestart = true;
      this.stopRequested = false;
      this.hasRecognitionSupport = false;
      this.restartTimeout = null;
      
      // Configuração de endpoints
      this.apiUrl = config.apiUrl;
      this.baseUrl = config.baseUrl;
      console.log(`HybridAI: API URL configurada: ${this.apiUrl}`);
      
      // Callbacks
      this.onSpeechResult = null;
      this.onEmotionDetected = null;
      
      // Verificar suporte do navegador ao iniciar
      this.hasRecognitionSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      
      // Inicializar o serviço automaticamente
      this.initService();
      
      console.log('HybridAI: Serviço inicializado, suporte a reconhecimento:', this.hasRecognitionSupport);
    } catch (error) {
      console.error('HybridAI: Erro ao inicializar serviço:', error);
    }
  }

  async initService() {
    try {
      console.log('HybridAI: Inicializando serviço...');
      
      // Verificar se temos suporte para reconhecimento de voz
      this.hasRecognitionSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      
      if (!this.hasRecognitionSupport) {
        console.warn('HybridAI: Este navegador não suporta reconhecimento de voz');
        return false;
      }
      
      // Configurar reconhecimento de voz
      this.setupSpeechRecognition();
      
      // Extrair sessionId e definir handlers
      this.sessionId = this.extractSessionId();
      this.handleKeyEvents();
      
      // Carregar dicionário de emoções
      await this.loadEmotionKeywords();
      
      // Habilitar reinício automático por padrão
      this.autoRestart = true;
      
      // Garantir que a apiUrl está configurada
      if (!this.apiUrl || this.apiUrl === '') {
        try {
          const config = await import('../environments');
          this.apiUrl = config.default.apiUrl;
          console.log(`HybridAI: API URL configurada via import dinâmico: ${this.apiUrl}`);
        } catch (e) {
          // Fallback para URL padrão
          this.apiUrl = 'http://localhost:3000/api';
          console.warn('HybridAI: Usando URL padrão por falha em importar config:', e);
        }
      }
      
      // Adicionar à window para acesso global em caso de emergência
      if (window) {
        window.hybridAIService = this;
        window.restartHybridAI = () => {
          console.log('HybridAI: Reinicialização forçada via método global');
          
          // Tentar uma reinicialização completa
          try {
            this.stopRecording();
            setTimeout(() => {
      this.setupSpeechRecognition();
              this.startRecording();
            }, 1000);
          } catch (e) {
            console.error('HybridAI: Erro na reinicialização de emergência:', e);
          }
        };
      }
      
      console.log(`HybridAI: Serviço inicializado com sucesso. SessionId: ${this.sessionId}`);
      return true;
    } catch (error) {
      console.error('HybridAI: Erro ao inicializar serviço:', error);
      return false;
    }
  }

  // Iniciar gravação
  startRecording() {
    try {
    console.log('HybridAI: Tentando iniciar reconhecimento de voz...');
    
      // Verificar se o reconhecimento já está ativo
    if (this.isRecording) {
        console.log('HybridAI: Reconhecimento já está ativo, nada a fazer');
        return true;
      }
      
      // Verificar suporte
      if (!this.hasRecognitionSupport) {
        console.error('HybridAI: Este navegador não suporta reconhecimento de voz');
        window.dispatchEvent(new CustomEvent('speech-error', {
          detail: { error: 'browser-not-supported' }
        }));
      return false;
    }
    
      // Configurar estado
      this.isRecording = true;
      this.isListening = true; // Garantir que isListening esteja sincronizado
      this.stopRequested = false;
      this.errorCount = 0;
      this.autoRestart = true; // Habilitar reinício automático ao iniciar
      
      // Limpar transcrição intermediária
      this.interimTranscript = '';
      
      // Verificar se o reconhecimento precisa ser reinicializado
      if (!this.recognition) {
        this.setupSpeechRecognition();
      }
      
      // Iniciar o reconhecimento
      console.log('HybridAI: Iniciando reconhecimento de voz...');
      this.recognition.start();
      
      // Emitir evento
      window.dispatchEvent(new CustomEvent('recording-started'));
      
      return true;
    } catch (error) {
      console.error('HybridAI: Erro ao iniciar reconhecimento de voz:', error);
      
      // Limpar estado em caso de erro
      this.isRecording = false;
      this.isListening = false;
      
      // Tentar reinicializar o reconhecimento em caso de erro
      setTimeout(() => {
        this.setupSpeechRecognition();
        this.startRecording();
      }, 1000);
      
      // Emitir evento de erro
      window.dispatchEvent(new CustomEvent('speech-error', {
        detail: { error: 'start-failed' }
      }));
      
      return false;
    }
  }

  // Método para recriar o objeto de reconhecimento de voz
  setupSpeechRecognition() {
    try {
      if (!this.recognition) {
        console.log('HybridAI: Configurando reconhecimento de voz');
        
        // Verificar se a API de reconhecimento de voz está disponível
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
          console.error('HybridAI: API de reconhecimento de voz não suportada neste navegador');
          this.hasRecognitionSupport = false;
          return false;
        }
        
        // Inicializar o reconhecimento de voz
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configurações do reconhecimento
        this.recognition.lang = 'pt-BR';
        this.recognition.interimResults = true;
        this.recognition.continuous = true;
        this.recognition.maxAlternatives = 1;
        
        // Propriedade para controlar pausa automática
        this.inactivityTimeout = null;
        this.lastSpeechTimestamp = Date.now();
        this.pauseAfterInactivity = true; // Nova opção de configuração
        this.inactivityThreshold = 5000; // 5 segundos de inatividade para pausar
        this.waitingForSpeech = false; // Para o modo de espera de voz
        this.pausedByInactivity = false; // Indica se foi pausado por inatividade
        
        // Contador de erros para limitar tentativas de reinício
        this.errorCount = 0;
        this.maxErrorCount = 3;
        this.lastErrorType = null;
        this.lastErrorTime = 0;
        
        // Configurar handlers de eventos
        this.recognition.onstart = () => {
          console.log('HybridAI: Reconhecimento de voz iniciado pelo navegador');
          
          // Resetar variáveis de estado
          this.isProcessingSpeech = true;
          this.errorCount = 0;
          this.lastErrorType = null;
          this.lastSpeechTimestamp = Date.now();
          this.pausedByInactivity = false;
          
          // Iniciar timer para verificar inatividade
          this._startInactivityTimer();
          
          // Disparar evento de início da gravação
          window.dispatchEvent(new CustomEvent('recording-started'));
          
          // Limpar qualquer timeout de reinício pendente
          if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
          }
        };
        
        this.recognition.onresult = (event) => {
          try {
            // Processar resultados do reconhecimento
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim();
            const isFinal = event.results[last].isFinal;
            
            // Atualizar timestamp da última atividade de voz
            this.lastSpeechTimestamp = Date.now();
            
            // Se estávamos esperando por voz após uma pausa, retomar reconhecimento completo
            if (this.waitingForSpeech) {
              console.log('HybridAI: Voz detectada após pausa, retomando reconhecimento completo');
              this.waitingForSpeech = false;
              this.pausedByInactivity = false;
              
              // Sair do modo de espera e reiniciar o reconhecimento completo
              if (this.recognition) {
            try {
              this.recognition.stop();
                  
                  // Reiniciar após um curto delay
                  setTimeout(() => {
                    this.startRecording();
                  }, 300);
        } catch (e) {
                  console.error('HybridAI: Erro ao retomar reconhecimento após detecção de voz:', e);
                }
                return;
              }
            }
            
            if (transcript) {
              // Caso seja um resultado final ou intermediário
              if (isFinal) {
                console.log('HybridAI: Texto final reconhecido:', transcript);
                this._handleFinalSpeechResult(transcript);
              } else {
                // Resultados intermediários não precisam de log para não sobrecarregar o console
                this._handleInterimSpeechResult(transcript);
              }
              
              // Reiniciar o timer de inatividade após um resultado
              this._resetInactivityTimer();
            }
          } catch (e) {
            console.error('HybridAI: Erro ao processar resultado do reconhecimento:', e);
          }
      };
      
      this.recognition.onend = () => {
        console.log('HybridAI: Reconhecimento de voz finalizado pelo navegador');
          this.isProcessingSpeech = false;
          
          // Limpar o timer de inatividade
          this._clearInactivityTimer();
          
          // Verificar se é uma parada intencional ou se devemos reiniciar
          if (this.stopRequested) {
            console.log('HybridAI: Reconhecimento finalizado por solicitação do usuário');
            this.stopRequested = false;
            this.isListening = false;
            this.isRecording = false;
            this.waitingForSpeech = false;
            this.pausedByInactivity = false;
            
            // Disparar evento de parada da gravação
            window.dispatchEvent(new CustomEvent('recording-stopped'));
          } else if (this.pausedByInactivity) {
            // Entrar em modo de espera por voz com baixo consumo de recursos
            console.log('HybridAI: Entrando em modo de espera por voz após inatividade');
            this.waitingForSpeech = true;
            
            // Iniciar um reconhecimento simplificado para esperar por voz
            try {
              // Usar configurações diferentes para o modo de espera
              this.recognition.continuous = false; // Uma única detecção é suficiente
              
              // Iniciar após um pequeno delay
          setTimeout(() => {
                if (this.waitingForSpeech && !this.stopRequested) {
            try {
              this.recognition.start();
                    console.log('HybridAI: Modo de espera por voz iniciado');
                  } catch (e) {
                    console.error('HybridAI: Erro ao iniciar modo de espera por voz:', e);
                    this.waitingForSpeech = false;
                    this.pausedByInactivity = false;
                    window.dispatchEvent(new CustomEvent('recording-stopped'));
                  }
                }
              }, 500);
            } catch (e) {
              console.error('HybridAI: Erro ao configurar modo de espera por voz:', e);
              this.waitingForSpeech = false;
              this.pausedByInactivity = false;
              window.dispatchEvent(new CustomEvent('recording-stopped'));
            }
          } else if (this.autoRestart) {
            // Caso normal: reiniciar reconhecimento após finalização
            console.log('HybridAI: Reiniciando reconhecimento normalmente');
            
            // Verificar se houve erros excessivos
            if (this.errorCount >= this.maxErrorCount) {
              console.warn(`HybridAI: Auto-reinício desabilitado após ${this.errorCount} erros`);
              this.isListening = false;
              this.isRecording = false;
              this.autoRestart = false;
              window.dispatchEvent(new CustomEvent('recording-stopped'));
            } else {
              // Manter estado de escuta ativo e reiniciar
              this.isListening = true;
              this.isRecording = true;
              
              // Reiniciar com um pequeno atraso para evitar conflitos
              const delay = this.lastErrorType === 'network' ? 5000 : 1000;
              console.log(`HybridAI: Reiniciando reconhecimento após ${delay}ms`);
              
              this.restartTimeout = setTimeout(() => {
                if (this.isListening) {
                  try {
                    // Restaurar configurações normais
                    this.recognition.continuous = true;
                    this.recognition.start();
                    console.log('HybridAI: Reconhecimento reiniciado com sucesso');
                  } catch (e) {
                    console.error('HybridAI: Erro ao reiniciar reconhecimento:', e);
                    
                    // Tentar novamente com uma nova instância após falha
                    this.setupSpeechRecognition();
                    setTimeout(() => {
                      if (this.isListening) {
                        try {
                          this.recognition.start();
                          console.log('HybridAI: Reconhecimento reiniciado após recriação');
                        } catch (err) {
                          console.error('HybridAI: Falha na segunda tentativa de reinício:', err);
                          this.isListening = false;
                          this.isRecording = false;
              window.dispatchEvent(new CustomEvent('recording-stopped'));
            }
                      }
                    }, 1000);
                  }
                } else {
                  console.log('HybridAI: Reinício cancelado pois o modo de escuta foi desativado');
                }
              }, delay);
            }
          } else {
            console.log('HybridAI: Auto-reinício desabilitado, parando completamente');
            this.isListening = false;
            this.isRecording = false;
            window.dispatchEvent(new CustomEvent('recording-stopped'));
        }
      };
      
      this.recognition.onerror = (event) => {
          console.error(`HybridAI: Erro no reconhecimento de voz: ${event.error}`);
          this.lastErrorType = event.error;
          this.lastErrorTime = Date.now();
          
          // Tratamento específico para cada tipo de erro
          switch (event.error) {
            case 'network':
              // Erro de rede - esperar mais tempo antes de tentar novamente
              console.warn('HybridAI: Erro de rede detectado, aguardando conexão...');
              this.errorCount++;
              break;
              
            case 'not-allowed':
            case 'service-not-allowed':
              // Permissão negada - parar completamente
              console.warn('HybridAI: Permissão de microfone negada, parando reconhecimento');
              this.autoRestart = false;
              this.stopRequested = true; // Forçar parada completa
              this.waitingForSpeech = false;
              this.pausedByInactivity = false;
              this.errorCount++;
              break;
              
            case 'aborted':
              // Abortado pelo navegador ou usuário - mais tolerante
              console.log('HybridAI: Reconhecimento abortado - tentando reiniciar automaticamente');
              // Não incrementar contador para erros de aborted, pois são comuns e geralmente recuperáveis
              // Forçar reinicialização com pequeno delay
              setTimeout(() => {
                if (this.isListening && !this.stopRequested && !this.isProcessingSpeech) {
                  try {
                    this.recognition.start();
                    console.log('HybridAI: Reconhecimento reiniciado após aborted');
                  } catch(e) {
                    console.error('HybridAI: Falha ao reiniciar após aborted:', e);
                    this.errorCount++; // Incrementar contador apenas em caso de falha na recuperação
                  }
                }
              }, 300);
              break;
              
            case 'no-speech':
              // Sem fala detectada - normal, não contar como erro grave
              console.log('HybridAI: Nenhuma fala detectada');
              this.errorCount = Math.max(0, this.errorCount - 1); // Reduzir contador
              break;
              
            default:
              // Outros erros - incrementar contador
              console.warn(`HybridAI: Erro desconhecido: ${event.error}`);
              this.errorCount++;
          }
        };
        
        this.hasRecognitionSupport = true;
      return true;
      }
      
      return !!this.recognition;
    } catch (e) {
      console.error('HybridAI: Erro ao configurar reconhecimento de voz:', e);
      this.hasRecognitionSupport = false;
      return false;
    }
  }

  // Método centralizado para lidar com erros de reconhecimento
  handleRecognitionError(event) {
    // Incrementar contador de erros
    this.errorCount++;
    
    // Verificar se atingiu o limite de erros
    const maxErrorsReached = this.errorCount >= this.maxErrorCount;
    
    // Disparar evento de erro para interface
        window.dispatchEvent(new CustomEvent('speech-error', {
      detail: { 
        error: event.error || 'unknown',
        count: this.errorCount,
        maxReached: maxErrorsReached
      }
    }));
    
    // Tratamento específico por tipo de erro
    switch (event.error) {
      case 'not-allowed':
        // Erro de permissão - parar completamente
      this.isRecording = false;
        this.recognitionActive = false;
        this.showSpeechStatus('error', 'Permissão de microfone negada');
        window.dispatchEvent(new CustomEvent('recording-stopped'));
        break;
        
      case 'aborted':
        // Erro de aborto - pode ser normal durante reinicializações
        // Ignorar com limite de contagem
        if (maxErrorsReached) {
          this.isRecording = false;
          this.recognitionActive = false;
          this.showSpeechStatus('error', 'Muitas interrupções');
          window.dispatchEvent(new CustomEvent('recording-stopped'));
        }
        break;
        
      case 'network':
        // Erro de rede - tentar novamente após uma pausa maior
        this.isRecording = false;
        this.recognitionActive = false;
        this.showSpeechStatus('error', 'Erro de rede');
      window.dispatchEvent(new CustomEvent('recording-stopped'));
        break;
        
      default:
        // Para outros erros, verificar o contador
        if (maxErrorsReached) {
      this.isRecording = false;
          this.recognitionActive = false;
          this.showSpeechStatus('error', 'Muitos erros');
          window.dispatchEvent(new CustomEvent('recording-stopped'));
        }
        break;
    }
  }
  
  // Método para mostrar status da transcrição na interface
  showSpeechStatus(status, message = '') {
    try {
      // Criar ou atualizar elemento de status
      let statusElement = document.getElementById('speech-status-indicator');
      
      if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'speech-status-indicator';
        statusElement.style.position = 'fixed';
        statusElement.style.bottom = '20px';
        statusElement.style.right = '20px';
        statusElement.style.padding = '8px 12px';
        statusElement.style.borderRadius = '20px';
        statusElement.style.fontSize = '12px';
        statusElement.style.fontFamily = 'sans-serif';
        statusElement.style.zIndex = '9999';
        statusElement.style.transition = 'all 0.3s ease';
        document.body.appendChild(statusElement);
      }
      
      // Atualizar estilo e conteúdo com base no status
      switch (status) {
        case 'active':
          statusElement.style.backgroundColor = 'rgba(46, 204, 113, 0.8)';
          statusElement.style.color = 'white';
          statusElement.textContent = '🎙️ Transcrição ativa';
          break;
          
        case 'inactive':
          statusElement.style.backgroundColor = 'rgba(52, 73, 94, 0.8)';
          statusElement.style.color = 'white';
          statusElement.textContent = '🎙️ Transcrição pausada';
          
          // Auto remover após alguns segundos
          setTimeout(() => {
            if (statusElement.parentNode) {
              statusElement.style.opacity = '0';
              setTimeout(() => {
                if (statusElement.parentNode) {
                  statusElement.parentNode.removeChild(statusElement);
                }
              }, 500);
            }
          }, 3000);
          break;
          
        case 'error':
          statusElement.style.backgroundColor = 'rgba(231, 76, 60, 0.8)';
          statusElement.style.color = 'white';
          statusElement.textContent = `⚠️ ${message || 'Erro na transcrição'}`;
          break;
          
        default:
          statusElement.style.display = 'none';
      }
    } catch (e) {
      console.warn('HybridAI: Erro ao mostrar status:', e);
    }
  }
  
  // Mostrar interface de fallback para navegadores não suportados
  showFallbackInterface() {
    try {
      let fallbackElement = document.getElementById('speech-fallback');
      
      if (!fallbackElement) {
        fallbackElement = document.createElement('div');
        fallbackElement.id = 'speech-fallback';
        fallbackElement.style.position = 'fixed';
        fallbackElement.style.top = '50%';
        fallbackElement.style.left = '50%';
        fallbackElement.style.transform = 'translate(-50%, -50%)';
        fallbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        fallbackElement.style.color = 'white';
        fallbackElement.style.padding = '20px';
        fallbackElement.style.borderRadius = '10px';
        fallbackElement.style.maxWidth = '400px';
        fallbackElement.style.textAlign = 'center';
        fallbackElement.style.zIndex = '10000';
        
        fallbackElement.innerHTML = `
          <h3 style="margin-top: 0">Reconhecimento de voz não suportado</h3>
          <p>Seu navegador não suporta a API de reconhecimento de voz.</p>
          <p>Tente usar Chrome, Edge ou Safari.</p>
          <button id="speech-fallback-close" style="
            padding: 8px 16px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          ">Fechar</button>
        `;
        
        document.body.appendChild(fallbackElement);
        
        // Adicionar handler para fechar
        document.getElementById('speech-fallback-close').addEventListener('click', () => {
          if (fallbackElement.parentNode) {
            fallbackElement.parentNode.removeChild(fallbackElement);
          }
        });
      }
    } catch (e) {
      console.warn('HybridAI: Erro ao mostrar interface de fallback:', e);
    }
  }

  // Parar gravação
  stopRecording() {
    try {
      console.log('HybridAI: Tentando parar reconhecimento de voz...');
      
      // Marcar que a parada foi solicitada para evitar reinício automático
      this.stopRequested = true;
      this.autoRestart = false;
      
      // Limpar qualquer timeout pendente
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }
      
      // Verificar se está realmente em execução
      if (this.recognition && this.isProcessingSpeech) {
        this.recognition.stop();
        this.isListening = false;
      } else {
        console.log('HybridAI: Reconhecimento já está parado');
        this.isListening = false;
        // Disparar evento de parada para garantir sincronização com a UI
        window.dispatchEvent(new CustomEvent('recording-stopped'));
      }
    } catch (e) {
      console.error('HybridAI: Erro ao parar reconhecimento de voz:', e);
      // Forçar estado para parado
      this.isListening = false;
      this.isProcessingSpeech = false;
      window.dispatchEvent(new CustomEvent('recording-stopped'));
    }
  }

  // Processar resultados de fala
  handleSpeechResult(event) {
    try {
      if (!event || !event.results) {
        return;
      }
      
      // Extrair os resultados mais recentes
      const results = event.results;
      const current = results[results.length - 1];
      
      if (!current || !current[0]) {
        return;
      }
      
      // Extrair o texto reconhecido e a confiança
      const transcript = current[0].transcript.trim();
      const confidence = current[0].confidence;
      
      // Verificar se o texto está vazio ou é muito curto (filtro de ruído)
      if (!transcript || transcript.length < 1) {
        return;
      }
      
      console.log(`HybridAI: Texto reconhecido: "${transcript}" (confiança: ${confidence.toFixed(2)})`);
      
      // Determinar se é resultado final ou intermediário
      const isFinal = current.isFinal;
      
      if (isFinal) {
        // Processar resultado final
        this._handleFinalSpeechResult(transcript);
      } else {
        // Processar resultado intermediário
        this._handleInterimSpeechResult(transcript);
      }
      
      // Disparar evento global para debug
      window.dispatchEvent(new CustomEvent('speech-processed', {
        detail: { 
          text: transcript, 
          isFinal: isFinal, 
          confidence: confidence
        }
      }));
    } catch (error) {
      console.error('HybridAI: Erro ao processar resultado do reconhecimento de voz:', error);
    }
  }

  // Método para extrair o sessionId da URL
  extractSessionId() {
    try {
      // Tentar extrair da URL
      const url = window.location.href;
      
      console.log('HybridAI: Extraindo sessionId de URL:', url);
      
      // Tentar padrão /session/{id}
      const sessionMatch = url.match(/\/session\/([a-zA-Z0-9_-]+)/);
      if (sessionMatch && sessionMatch[1]) {
        console.log('HybridAI: SessionId extraído da URL (padrão /session/):', sessionMatch[1]);
        return sessionMatch[1];
      }
      
      // Tentar padrão /meet/{id}
      const meetMatch = url.match(/\/meet\/([a-zA-Z0-9_-]+)/);
      if (meetMatch && meetMatch[1]) {
        console.log('HybridAI: SessionId extraído da URL (padrão /meet/):', meetMatch[1]);
        return meetMatch[1];
      }
      
      // Tentar padrão /room/{id}
      const roomMatch = url.match(/\/room\/([a-zA-Z0-9_-]+)/);
      if (roomMatch && roomMatch[1]) {
        console.log('HybridAI: SessionId extraído da URL (padrão /room/):', roomMatch[1]);
        return roomMatch[1];
      }
      
      // Tentar padrão /call/{id}
      const callMatch = url.match(/\/call\/([a-zA-Z0-9_-]+)/);
      if (callMatch && callMatch[1]) {
        console.log('HybridAI: SessionId extraído da URL (padrão /call/):', callMatch[1]);
        return callMatch[1];
      }
      
      // Tentar extrair UUID/GUID da URL (usado em muitos sistemas)
      const uuidMatch = url.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
      if (uuidMatch && uuidMatch[0]) {
        console.log('HybridAI: SessionId extraído da URL (formato UUID):', uuidMatch[0]);
        return uuidMatch[0];
      }
      
      // Tentar extrair de params (ex: ?sessionId=123)
      const urlParams = new URLSearchParams(window.location.search);
      const paramOptions = ['sessionId', 'session', 'meetingId', 'meeting', 'roomId', 'room', 'id', 'callId'];
      
      for (const param of paramOptions) {
        const value = urlParams.get(param);
        if (value) {
          console.log(`HybridAI: SessionId extraído dos parâmetros da URL (${param}):`, value);
          return value;
        }
      }
      
      // Verificar localStorage/sessionStorage para um sessionId salvo
      const savedSessionId = localStorage.getItem('sessionId') || 
                           sessionStorage.getItem('sessionId') ||
                           localStorage.getItem('meetingId') || 
                           sessionStorage.getItem('meetingId');
      
      if (savedSessionId) {
        console.log('HybridAI: SessionId recuperado do armazenamento:', savedSessionId);
        return savedSessionId;
      }
      
      // Verificar data attributes em elementos relevantes
      const sessionElements = document.querySelectorAll('[data-session-id], [data-meeting-id], [data-room-id]');
      if (sessionElements.length > 0) {
        const elementId = sessionElements[0].getAttribute('data-session-id') || 
                         sessionElements[0].getAttribute('data-meeting-id') || 
                         sessionElements[0].getAttribute('data-room-id');
        
        if (elementId) {
          console.log('HybridAI: SessionId extraído de atributo data:', elementId);
          return elementId;
        }
      }
      
      // Se não encontrou por nenhum método, alertar e retornar um ID temporário
      console.warn('HybridAI: Não foi possível encontrar um sessionId válido em nenhum local');
      
      // Disparar evento para notificar a interface
      window.dispatchEvent(new CustomEvent('hybridai-error', {
        detail: { 
          message: 'Não foi possível identificar a sessão atual',
          type: 'session'
        }
      }));
      
      // Retornar valor temporário mas marcado para identificar facilmente
      return `temp_${new Date().getTime()}`;
    } catch (e) {
      console.error('HybridAI: Erro ao extrair sessionId:', e);
      return `error_${new Date().getTime()}`;
    }
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

  // Obter token de autenticação
  getAuthToken() {
    try {
      // Tentar obter de localStorage ou sessionStorage
      const token = localStorage.getItem('authToken') || 
             sessionStorage.getItem('authToken') || 
             localStorage.getItem('token') || 
             sessionStorage.getItem('token');
      
      if (!token) {
        console.warn('HybridAI: Token de autenticação não encontrado');
        return null;
      }
      
      return token;
    } catch (e) {
      console.error('HybridAI: Erro ao obter token de autenticação:', e);
      return null;
    }
  }
  
  // Disparar erro de autenticação
  dispatchAuthError() {
    console.warn('HybridAI: Erro de autenticação - token não encontrado ou inválido');
    
    // Disparar evento para informar sobre erro de autenticação
    window.dispatchEvent(new CustomEvent('hybridai-error', {
      detail: {
        message: 'Sessão expirada. Por favor, faça login novamente.',
        type: 'auth'
      }
    }));
  }

  // Enviar transcrição para o servidor
  async sendTranscriptionToServer(transcript, emotions = null) {
    try {
      // Verificação mais rigorosa do transcript
      if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
        console.warn('HybridAI: Texto vazio ou inválido, não será enviado para o servidor');
        return;
      }
      
      // Normalizar transcript - remover espaços extras e caracteres especiais
      const normalizedTranscript = transcript.trim();
      
      if (normalizedTranscript.length === 0) {
        console.warn('HybridAI: Após normalização, o transcript ficou vazio');
        return;
      }
      
      // Extrair o sessionId se não estiver definido ainda
      if (!this.sessionId) {
        this.sessionId = this.extractSessionId();
      }
      
      // Verificar se temos um sessionId válido
      if (!this.sessionId || this.sessionId.length < 5 || this.sessionId.startsWith('fallback_') || this.sessionId.startsWith('session_') || this.sessionId.startsWith('temp_') || this.sessionId.startsWith('error_')) {
        console.warn('HybridAI: ID da sessão inválido ou genérico, transcrição não será salva', this.sessionId);
        window.dispatchEvent(new CustomEvent('hybridai-error', {
          detail: { 
            message: 'Não foi possível identificar a sessão atual. Recarregue a página ou crie uma nova sessão.',
            type: 'session'
          }
        }));
        return;
      }
      
      // Permitir sessionIds temporários em localhost, mas logar
      if (this.sessionId.startsWith('temp_') && 
          (window.location.hostname === 'localhost' || 
           window.location.hostname.includes('127.0.0.1'))) {
        console.log('HybridAI: Usando ID temporário em ambiente de desenvolvimento:', this.sessionId);
      }
      
      console.log(`HybridAI: Enviando transcrição para o servidor. SessionID: ${this.sessionId}`);
      
      // Tentar obter o token do localStorage ou sessionStorage
      const authToken = this.getAuthToken();
      
      if (!authToken) {
        console.warn('HybridAI: Token de autenticação não encontrado, transcrição não será salva');
        this.dispatchAuthError();
        return;
      }
      
      // Importar config diretamente se não for inicializado no construtor
      let apiUrl;
      if (this.apiUrl) {
        apiUrl = `${this.apiUrl}/ai/transcript`;
      } else {
        // Fallback para importar diretamente
        try {
          const config = require('../environments').default;
          apiUrl = '/api/ai/transcript';
          console.warn('HybridAI: Usando URL relativa por falha em importar config:', e);
        } catch (e) {
          // Fallback para URL relativa em caso de erro (para funcionar com o proxy do Vite)
          apiUrl = '/api/ai/transcript';
          console.warn('HybridAI: Usando URL relativa por falha em importar config:', e);
        }
      }
      
      console.log(`HybridAI: Usando API URL: ${apiUrl}`);
      
      // Aplicar anonimização se necessário
      const processedText = this.useAnonymization ? this.anonymizeText(normalizedTranscript) : normalizedTranscript;
      
      // Verificação final do texto processado
      if (!processedText || processedText.trim().length === 0) {
        console.warn('HybridAI: Texto processado ficou vazio após anonimização');
        return;
      }
      
      // Preparar payload
      const data = {
        sessionId: this.sessionId,
        content: processedText,
        speaker: 'user',
        timestamp: new Date().toISOString(),
        transcript: processedText
      };
      
      // Adicionar emoções detectadas, se houver
      if (emotions) {
        data.emotions = emotions;
      }
      
      console.log('HybridAI: Payload para API:', JSON.stringify(data));
      
      // Enviar para o servidor com autenticação
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        // Tentar obter mais detalhes sobre o erro
        let errorDetails = '';
        try {
          const errorResponse = await response.json();
          errorDetails = JSON.stringify(errorResponse);
          console.error('HybridAI: Detalhes do erro da API:', errorResponse);
        } catch (e) {
          errorDetails = await response.text();
          console.error('HybridAI: Resposta de erro da API (texto):', errorDetails);
        }
        
        if (response.status === 401 || response.status === 403) {
          // Erro de autenticação, notificar ao usuário
          this.dispatchAuthError();
          throw new Error(`Erro de autenticação: ${response.status}`);
        } else if (response.status === 400) {
          // Bad Request - provavelmente dados inválidos
          console.error(`HybridAI: Erro 400 (Bad Request) ao salvar transcrição. Detalhes: ${errorDetails}`);
          
          // Verificar se o erro menciona sessionId
          if (errorDetails.includes('sessionId') || errorDetails.includes('session')) {
            // Tentar limpar e obter um novo sessionId
            this.sessionId = null;
            const newSessionId = this.extractSessionId();
            console.log('HybridAI: Tentando com novo sessionId:', newSessionId);
            
            // Notificar sobre o problema
            window.dispatchEvent(new CustomEvent('hybridai-error', {
              detail: { 
                message: 'Problema com a identificação da sessão. Tente recarregar a página.',
                type: 'session'
              }
            }));
          }
          
          throw new Error(`Erro ao salvar transcrição (400 Bad Request): ${errorDetails}`);
        }
        
        throw new Error(`Erro ao salvar transcrição: ${response.status} ${response.statusText}. Detalhes: ${errorDetails}`);
      }
      
      const result = await response.json();
      console.log('HybridAI: Transcrição salva com sucesso:', result);
      
      return result;
    } catch (error) {
      console.error('HybridAI: Erro ao enviar transcrição para o servidor:', error.message);
      
      // Verificar se é erro de autenticação e emitir evento específico
      if (error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.includes('autenticação')) {
        this.dispatchAuthError();
      }
      
      // Disparar evento de erro geral
      window.dispatchEvent(new CustomEvent('hybridai-error', {
        detail: { 
          message: `Erro ao salvar transcrição: ${error.message}`,
          type: 'api'
        }
      }));
      
      throw error;
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
      
      // Verificar se temos um ID válido
      if (!sessionId || sessionId.length > 50) {
        console.error('HybridAI: ID de sessão inválido para análise:', sessionId);
        return { 
          type: 'analysis',
          error: 'ID de sessão inválido',
          analysis: 'Não foi possível identificar corretamente a sessão atual.',
          content: 'Recarregue a página ou verifique a URL da sessão.'
        };
      }
      
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
      
      // Verificar se temos um ID válido
      if (!sessionId || sessionId.length > 50) {
        console.error('HybridAI: ID de sessão inválido para sugestões:', sessionId);
        return { 
          type: 'suggestions',
          error: 'ID de sessão inválido',
          suggestions: ['Não foi possível identificar corretamente a sessão atual.'],
          content: 'Recarregue a página ou verifique a URL da sessão.'
        };
      }
      
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
          report: `**Texto insuficiente para gerar um relatório completo**

Para gerar um relatório detalhado, é necessário mais conteúdo da sessão.
Continue a sessão e tente novamente quando houver mais diálogo entre terapeuta e cliente.

*Recomendações:*
- Certifique-se de que o microfone está ativo durante a sessão
- Verifique se a transcrição está funcionando corretamente
- Sessões com pelo menos 15-20 minutos de diálogo geralmente produzem melhores relatórios`,
          content: 'Continue a sessão para capturar mais dados para o relatório.'
        };
      }
      
      // Obter ID da sessão da URL
      const sessionId = this.extractSessionId();
      
      // Verificar se temos um ID válido
      if (!sessionId || sessionId.length > 50) {
        console.error('HybridAI: ID de sessão inválido para relatório:', sessionId);
        return { 
          type: 'report',
          error: 'ID de sessão inválido',
          report: `**Não foi possível gerar o relatório**

O sistema não conseguiu identificar corretamente a sessão atual.

*Possíveis razões:*
- URL da sessão incorreta ou malformada
- Problema na identificação da sessão no sistema
- Erro temporário no serviço

*Recomendações:*
- Recarregue a página
- Verifique se você está na URL correta da sessão
- Se o problema persistir, tente criar uma nova sessão`,
          content: 'Não foi possível identificar corretamente a sessão atual.'
        };
      }
      
      console.log(`HybridAI: Gerando relatório para sessão ${sessionId}`);
      
      // Enviar para o servidor para relatório
      let result;
      try {
        result = await aiService.generateReport(sessionId, text);
        console.log('HybridAI: Resultado do relatório recebido:', result);
      } catch (apiError) {
        console.error('HybridAI: Erro na chamada da API:', apiError);
        // Criar resposta de fallback mais útil
        return {
          type: 'report',
          error: 'Falha na comunicação com o servidor',
          message: apiError.message,
          report: `**Não foi possível conectar ao serviço de relatórios**

O sistema encontrou um problema ao tentar gerar o relatório desta sessão.

*Possíveis causas:*
- Problemas de conectividade com o servidor
- Sobrecarga temporária do sistema
- Limitações da API do serviço de IA

*Recomendações:*
- Verifique sua conexão com a internet
- Aguarde alguns minutos e tente novamente
- Se o problema persistir, entre em contato com o suporte técnico

Detalhes técnicos: ${apiError.message || 'Erro de comunicação com o servidor'}`,
          content: 'O servidor está temporariamente indisponível.'
        };
      }
      
      // Verificar se o resultado contém dados
      if (!result || (Object.keys(result).length === 0)) {
        console.warn('HybridAI: Resultado vazio ou inválido recebido');
        return {
          type: 'report',
          report: `**Relatório não disponível**

Não foi possível gerar um relatório específico para esta sessão no momento.

*Possíveis causas:*
- A sessão pode ser muito curta
- A qualidade do áudio pode estar comprometida
- Pode haver poucos elementos terapêuticos para análise

*Recomendações:*
- Continue a sessão por mais tempo
- Verifique se o microfone está funcionando corretamente
- Tente novamente após mais interações terapeuta-cliente`,
          content: 'Continue a sessão para obter resultados mais completos.'
        };
      }
      
      // Verificar se há um relatório válido no resultado
      if (result.report && typeof result.report === 'string') {
        // Verificar se o conteúdo é genérico demais
        if (result.report.includes('Não foi possível gerar conteúdo específico') || 
            result.report.trim().length < 100) {
          
          console.warn('HybridAI: Conteúdo do relatório parece genérico ou muito curto');
          return {
            type: 'report',
            report: `**Relatório parcial da sessão**

O sistema não conseguiu gerar um relatório detalhado para esta sessão específica.

*Possíveis razões:*
- Poucos dados de transcrição disponíveis
- Limitações temporárias do modelo de IA
- Problemas no processamento do contexto da sessão

*Sugestões para o terapeuta:*
1. Verifique a qualidade da transcrição da sessão
2. Tente solicitar o relatório novamente após mais diálogo
3. Considere fazer anotações manuais complementares

*Observações gerais para sessões terapêuticas:*
- Mantenha uma comunicação clara e empática
- Observe as reações e sinais não-verbais do paciente
- Faça perguntas abertas para explorar sentimentos e pensamentos
- Valide as experiências e emoções do paciente
- Estabeleça metas claras para o tratamento`,
            content: 'Relatório parcial com recomendações gerais para o terapeuta.'
          };
        }
      }
      
      // Garantir que o tipo está definido
      if (!result.type) {
        result.type = 'report';
      }
      
      // Verificar se há conteúdo significativo
      if (result.report && result.report.length < 200) {
        console.warn('HybridAI: Relatório parece muito curto:', result.report);
      }
      
      return result;
    } catch (error) {
      console.error('HybridAI: Erro ao gerar relatório:', error);
      return {
        type: 'report',
        error: 'Erro durante processamento do relatório',
        report: `**Erro ao gerar relatório**

Ocorreu um erro inesperado durante a geração do relatório.

*Detalhes técnicos:* ${error.message || 'Erro desconhecido'}

*Recomendações:*
- Recarregue a página e tente novamente
- Verifique se a sessão está ativa
- Se o problema persistir, entre em contato com o suporte`,
        content: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
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
    try {
      if (this.isListening && !this.stopRequested) {
        // Limpar o timeout para evitar múltiplos reinícios
        if (this.restartTimeout) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = null;
        }
        
        // Verificar se outro reconhecimento já está em andamento
        if (this.isProcessingSpeech) {
          console.log('HybridAI: Já existe um reconhecimento em andamento');
          return;
        }
          
          // Iniciar reconhecimento
        console.log('HybridAI: Reiniciando reconhecimento');
        this.recognition.start();
      } else {
        console.log('HybridAI: Reconhecimento não reiniciado, pois não está mais em modo de escuta');
      }
    } catch (e) {
      console.error('HybridAI: Erro ao reiniciar reconhecimento:', e);
    }
  }

  // Carregar dicionário de emoções
  async loadEmotionKeywords() {
    try {
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
      
      console.log('HybridAI: Dicionário de emoções carregado com sucesso');
      return true;
    } catch (error) {
      console.error('HybridAI: Erro ao carregar dicionário de emoções:', error);
      return false;
    }
  }

  // Alternar estado de reinício automático
  toggleAutoRestart(enable) {
    this.autoRestart = enable === undefined ? !this.autoRestart : enable;
    console.log(`HybridAI: Reinício automático ${this.autoRestart ? 'ativado' : 'desativado'}`);
    return this.autoRestart;
  }
  
  // Método para processar resultado intermediário do reconhecimento de voz
  _handleInterimSpeechResult(transcript) {
    // Evitar que o mesmo texto seja processado múltiplas vezes
    if (this.interimTranscript === transcript) return;
    
    // Verificar se não é uma duplicação (ex: "Rodrigo Rodrigo")
    const isDuplicated = this._checkForDuplication(transcript);
    if (isDuplicated) {
      // Remover a duplicação
      transcript = this._removeDuplication(transcript);
      console.log('HybridAI: Texto duplicado detectado e corrigido:', transcript);
    }
    
    // Se estávamos em modo de espera/pausa, notificar retomada
    if (this.waitingForSpeech || this.pausedByInactivity) {
      console.log('HybridAI: Voz detectada durante modo de espera, retomando reconhecimento normal');
      
      // Disparar evento de retomada para atualizar a UI
      window.dispatchEvent(new CustomEvent('recognition-resumed', {
        detail: { timestamp: Date.now(), text: transcript }
      }));
      
      // Limpar estado de espera
      this.waitingForSpeech = false;
      this.pausedByInactivity = false;
    }
    
    this.interimTranscript = transcript;
    this.currentTranscript = transcript;
    
    // Emitir evento com o texto intermediário
    window.dispatchEvent(new CustomEvent('transcript-updated', {
      detail: {
        interimText: transcript,
        fullText: this.transcript ? (this.transcript + ' ' + transcript) : transcript,
        isPartial: true
      }
    }));
    
    // Armazenar último texto para referência global (para debug)
    window.latestTranscript = transcript;
  }

  // Método para processar resultado final do reconhecimento de voz
  _handleFinalSpeechResult(transcript) {
    // Verificações mais rigorosas
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      console.warn('HybridAI: Texto final inválido ou vazio, ignorando');
      return;
    }
    
    // Normalizar o texto
    const normalizedTranscript = transcript.trim();
    
    // Verificar duplicação e corrigir se necessário
    const isDuplicated = this._checkForDuplication(normalizedTranscript);
    if (isDuplicated) {
      const correctedText = this._removeDuplication(normalizedTranscript);
      console.log('HybridAI: Duplicação corrigida no texto final:', correctedText);
      
      // Verificar se a correção não resultou em texto vazio
      if (!correctedText || correctedText.trim().length === 0) {
        console.warn('HybridAI: Após correção de duplicação, o texto ficou vazio');
        return;
      }
      
      // Atualizar o transcript com o texto corrigido
      transcript = correctedText;
    } else {
      transcript = normalizedTranscript;
    }
    
    // Se estávamos em modo de espera/pausa, notificar retomada
    if (this.waitingForSpeech || this.pausedByInactivity) {
      console.log('HybridAI: Voz detectada durante modo de espera, retomando reconhecimento normal');
      
      // Disparar evento de retomada para atualizar a UI
      window.dispatchEvent(new CustomEvent('recognition-resumed', {
        detail: { timestamp: Date.now(), text: transcript }
      }));
      
      // Limpar estado de espera
      this.waitingForSpeech = false;
      this.pausedByInactivity = false;
    }
    
    // Atualizar o texto completo da transcrição
    if (this.transcript) {
      this.transcript += ' ' + transcript;
    } else {
      this.transcript = transcript;
    }
    
    // Limpar o texto intermediário
    this.interimTranscript = '';
    this.currentTranscript = '';
    
    // Processar texto em background
    this._processBackgroundTasks(transcript);
    
    // Tentar salvar a transcrição se tivermos um sessionId
    this._saveTranscription(transcript);
    
    // Emitir evento com o texto final
    window.dispatchEvent(new CustomEvent('transcript-updated', {
      detail: {
        finalText: transcript,
        fullText: this.transcript,
        isPartial: false
      }
    }));
    
    // Disparar evento específico para o texto final
    window.dispatchEvent(new CustomEvent('transcript', {
      detail: {
        transcript: transcript,
        final: true
      }
    }));
    
    // Armazenar para debug
    window.latestTranscript = transcript;
  }

  // Método para verificar duplicações de palavras
  _checkForDuplication(text) {
    if (!text) return false;
    
    // Primeiro padrão: palavras repetidas sequencialmente (ex: "olá olá")
    const words = text.trim().split(/\s+/);
    if (words.length < 2) return false;
    
    // Verificar padrões de duplicação
    
    // Padrão 1: Palavra única repetida (ex: "Olá Olá")
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].toLowerCase() === words[i+1].toLowerCase() && words[i].length > 2) {
        return true;
      }
    }
    
    // Padrão 2: Frases repetidas (ex: "como vai você como vai você")
    if (words.length >= 4) {
      const half = Math.floor(words.length / 2);
      // Verificar se a primeira metade é igual à segunda metade
      for (let i = 0; i < half; i++) {
        if (words[i].toLowerCase() !== words[i+half].toLowerCase()) {
          return false;
        }
      }
      // Se chegamos aqui e temos 4+ palavras, provavelmente é uma duplicação
      if (words.length >= 4) {
        return true;
      }
    }
    
    return false;
  }

  // Método para remover duplicações
  _removeDuplication(text) {
    if (!text) return text;
    
    const words = text.trim().split(/\s+/);
    if (words.length < 2) return text;
    
    // Caso 1: Palavra repetida sequencialmente
    const uniqueWords = [];
    for (let i = 0; i < words.length; i++) {
      // Se não for igual à próxima OU for a última palavra, adicionar
      if (i === words.length - 1 || words[i].toLowerCase() !== words[i+1].toLowerCase()) {
        uniqueWords.push(words[i]);
      }
    }
    
    // Caso 2: Frase repetida (primeira metade igual à segunda)
    if (uniqueWords.length >= 4) {
      const half = Math.floor(uniqueWords.length / 2);
      let isRepeatedPhrase = true;
      
      // Verificar se a primeira metade é igual à segunda
      for (let i = 0; i < half; i++) {
        if (uniqueWords[i].toLowerCase() !== uniqueWords[i+half].toLowerCase()) {
          isRepeatedPhrase = false;
          break;
        }
      }
      
      // Se for uma frase repetida, ficar apenas com a primeira metade
      if (isRepeatedPhrase) {
        return uniqueWords.slice(0, half).join(' ');
      }
    }
    
    return uniqueWords.join(' ');
  }

  // Método auxiliar para salvar transcrição no servidor
  _saveTranscription(transcript) {
    try {
      // Verificações mais rigorosas
      if (!transcript || typeof transcript !== 'string') {
        console.warn('HybridAI: Transcrição vazia ou inválida, ignorando');
        return;
      }
      
      // Remover espaços em branco extras e normalizar
      const normalizedTranscript = transcript.trim();
      
      // Verificar se o texto é muito curto para economizar chamadas ao servidor
      if (normalizedTranscript.length < 2) {
        console.warn(`HybridAI: Transcrição muito curta (${normalizedTranscript.length} caracteres), ignorando`);
        return;
      }
      
      // Garantir que temos um sessionId
      if (!this.sessionId) {
        this.sessionId = this.extractSessionId();
      }
      
      // Verificar se temos um sessionId válido
      if (!this.sessionId || this.sessionId.length < 5 || this.sessionId.startsWith('fallback_') || this.sessionId.startsWith('session_') || this.sessionId.startsWith('temp_') || this.sessionId.startsWith('error_')) {
        console.warn('HybridAI: ID da sessão inválido ou genérico, transcrição não será salva', this.sessionId);
        window.dispatchEvent(new CustomEvent('hybridai-error', {
          detail: { 
            message: 'Não foi possível identificar a sessão atual. Recarregue a página ou crie uma nova sessão.',
            type: 'session'
          }
        }));
        return;
      }
      
      // Permitir sessionIds temporários em localhost, mas logar
      if (this.sessionId.startsWith('temp_') && 
          (window.location.hostname === 'localhost' || 
           window.location.hostname.includes('127.0.0.1'))) {
        console.log('HybridAI: Usando ID temporário em ambiente de desenvolvimento:', this.sessionId);
      }
      
      console.log(`HybridAI: Preparando para salvar transcrição. SessionID: ${this.sessionId}, Tamanho do texto: ${normalizedTranscript.length} caracteres`);
      
      // Verificar token antes de tentar salvar
      const authToken = this.getAuthToken();
      if (!authToken) {
        console.warn('HybridAI: Token de autenticação não encontrado, transcrição não será salva');
        // Não disparar evento de erro aqui para evitar mensagens duplicadas
        return;
      }
      
      // Verificar se a API URL está configurada
      if (!this.apiUrl) {
        console.warn('HybridAI: URL da API não configurada, tentando inicializar');
        this.initService();
      }
      
      // Enviar para o servidor em background
      this.sendTranscriptionToServer(normalizedTranscript, this.emotions)
        .then(() => console.log('HybridAI: Transcrição salva com sucesso'))
        .catch(err => {
          // Não exibir erro 401 novamente pois já mostramos no método sendTranscriptionToServer
          if (!err.message?.includes('401') && !err.message?.includes('403') && !err.message?.includes('autenticação')) {
            console.error('HybridAI: Erro ao salvar transcrição:', err);
          }
        });
        
    } catch (e) {
      console.error('HybridAI: Erro ao processar salvamento da transcrição:', e);
    }
  }

  // Processamento em segundo plano
  _processBackgroundTasks(transcript) {
    try {
      // Processar emoções se o texto for longo o suficiente
      if (transcript && transcript.length > 5) {
        this.processEmotions(transcript);
      }
    } catch (e) {
      console.error('HybridAI: Erro ao processar tarefas em background:', e);
    }
  }

  // Registrar eventos de tecla para controle do usuário
  handleKeyEvents() {
    try {
      // Configurar eventos de teclado para controlar o reconhecimento
      document.addEventListener('keydown', (event) => {
        // Tecla Esc para parar o reconhecimento
        if (event.key === 'Escape') {
          console.log('HybridAI: Tecla Escape pressionada, parando reconhecimento');
          this.stopRecording();
        }
      });
      
      console.log('HybridAI: Eventos de teclado registrados');
      return true;
    } catch (e) {
      console.error('HybridAI: Erro ao configurar eventos de teclado:', e);
      return false;
    }
  }

  // Iniciar timer para pausar após inatividade
  _startInactivityTimer() {
    if (!this.pauseAfterInactivity) return;
    
    this._clearInactivityTimer();
    
    this.inactivityTimeout = setTimeout(() => {
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTimestamp;
      
      if (timeSinceLastSpeech >= this.inactivityThreshold && this.isListening && !this.stopRequested) {
        console.log(`HybridAI: Inatividade de ${Math.round(timeSinceLastSpeech/1000)}s detectada, pausando reconhecimento`);
        
        // Marcar que estamos pausando por inatividade
        this.pausedByInactivity = true;
        
        // Parar o reconhecimento atual para entrar no modo de espera
        if (this.recognition && this.isProcessingSpeech) {
          try {
            // Disparar evento ANTES de parar para que a UI possa reagir apropriadamente
            window.dispatchEvent(new CustomEvent('recognition-paused', {
              detail: { reason: 'inactivity', timestamp: Date.now() }
            }));
            
            // Agora parar o reconhecimento para entrar em modo de espera
            this.recognition.stop();
          } catch (e) {
            console.error('HybridAI: Erro ao pausar reconhecimento por inatividade:', e);
          }
        }
      } else {
        // Continuar verificando
        this._resetInactivityTimer();
      }
    }, this.inactivityThreshold);
  }

  // Resetar o timer de inatividade
  _resetInactivityTimer() {
    this._clearInactivityTimer();
    
    if (this.pauseAfterInactivity && this.isListening && !this.stopRequested) {
      this._startInactivityTimer();
    }
  }

  // Limpar o timer de inatividade
  _clearInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }
}

// Exportar instância única do serviço
export default new HybridAIService(); 