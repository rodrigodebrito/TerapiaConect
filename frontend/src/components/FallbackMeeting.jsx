import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import { toast } from 'react-toastify';
import './FallbackMeeting.css';
import './AITools.css';
import AIResultsPanel from './AIResultsPanel';
import config from '../environments';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import hybridAIService from '../services/hybridAI.service';
import WhisperTranscriptionService from '../services/whisperTranscriptionService';
// Importação do componente de Constelação usando caminho completo
import ConstellationFieldComponent from './ConstellationField/ConstellationFieldComponent';
// Usando um alias para compatibilidade com o resto do código
const ConstellationField = ConstellationFieldComponent;

// Componente de erro para capturar falhas na renderização do vídeo
class VideoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro no componente de vídeo:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="video-error-container" style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px'
        }}>
          <h3>Houve um problema com a videoconferência</h3>
          <button 
            onClick={() => {
              this.setState({ hasError: false });
              if (this.props.onReset) this.props.onReset();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente para iframe do Daily
const DailyFrame = ({ roomUrl, onLoad }) => {
  const iframeRef = useRef(null);
  
  useEffect(() => {
    if (iframeRef.current) {
      onLoad && onLoad(iframeRef.current);
    }
  }, [onLoad]);
  
  return (
    <iframe
      ref={iframeRef}
      src={roomUrl}
      allow="camera; microphone; fullscreen; speaker; display-capture"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: '#1a1a1a'
      }}
    />
  );
};

const FallbackMeeting = ({
  roomName,
  userName,
  audioEnabled = true,
  videoEnabled = true,
  floating = false,
  onPipModeChange = () => {},
}) => {
  // ========== HOOKS ==========
  const isMountedRef = useRef(true);
  const reconnectTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const roomNameRef = useRef(roomName);
  const dailyCallRef = useRef(null);
  const dailyFrameRef = useRef(null);
  
  // ========== STATE HOOKS ==========
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPipMode, setIsPipMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptionMode, setTranscriptionMode] = useState('auto');
  const [callStatus, setCallStatus] = useState('joining');
  const [participants, setParticipants] = useState({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMuted, setIsMuted] = useState(!audioEnabled);
  const [isVideoEnabled, setIsVideoEnabled] = useState(videoEnabled);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingChunk, setProcessingChunk] = useState(false);
  const [chunkStats, setChunkStats] = useState({ count: 0, totalDuration: 0 });
  const [showConstellation, setShowConstellation] = useState(false);
  
  // ========== ERROR HANDLING ==========
  
  // Manipular erros
  const handleError = useCallback((event) => {
    // Se é um evento, extrair detalhes do erro
    if (event && event.detail) {
      const errorDetail = event.detail.error || event.detail;
      console.error('Erro de transcrição:', errorDetail);
      
      // Não usar toast diretamente aqui
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : (errorDetail.message || 'Erro desconhecido');
      
      // Armazenar para mostrar após a renderização
      window.lastTranscriptionError = errorMessage;
    } else if (typeof event === 'string') {
      // Se for string direta
      console.error('Erro:', event);
      window.lastTranscriptionError = event;
    }
  }, []);
  
  // ========== AI CONTEXT HOOKS ==========
  const { 
    analyze, 
    suggest, 
    report, 
    startListening, 
    stopListening, 
    isListening, 
    transcript,
    saveTranscript
  } = useAI();
  
  // Handler para eventos do serviço Whisper
  const handleWhisperTranscription = useCallback((event) => {
    try {
      // Garantir que temos dados válidos
      if (!event || !event.detail || !event.detail.text) {
        console.warn('Evento de transcrição sem texto:', event);
        return;
      }
      
      // Extrair dados do evento
      const { text, duration, language, sessionId } = event.detail;
      
      // Atualizar o texto da transcrição no state
      setTranscriptText(prev => {
        const newText = prev ? `${prev}\n${text}` : text;
        return newText;
      });
      
      // Salvar no backend via AIContext
      if (sessionId) {
        // Usar o hook de AIContext para salvar a transcrição
        if (typeof saveTranscript === 'function') {
          const transcriptionData = {
            sessionId: sessionId,
            transcript: text.trim(),
            speaker: 'user',
            timestamp: new Date().toISOString()
          };
          
          console.log('Salvando transcrição no backend via AIContext:', {
            sessionId: sessionId,
            textLength: text.length
          });
          
          // Chamar a função do contexto
          saveTranscript(transcriptionData)
            .then(result => {
              console.log('Transcrição salva com sucesso:', result);
            })
            .catch(error => {
              console.error('Erro ao salvar transcrição:', error);
              // Mostrar erro apenas no console, não interromper o fluxo
            });
        } else {
          console.warn('Função saveTranscript não disponível no contexto AI');
        }
      }
      
      console.log(`Transcrição Whisper (${Math.round(duration)}s, ${language}): ${text.substring(0, 100)}...`);
    } catch (error) {
      handleError(`Erro ao processar transcrição: ${error.message}`);
    }
  }, [saveTranscript, handleError]);
  
  // ========== LIFECYCLE MANAGEMENT ==========
  // Função para reiniciar serviços de transcrição se necessário
  const resetTranscriptionServices = useCallback(() => {
    try {
      console.log('Tentando reiniciar serviços de transcrição');
      
      // Limpar referências existentes
      if (window.hybridAIService) {
        try {
          window.hybridAIService.stopRecording();
        } catch (e) {
          console.error('Erro ao parar hybridAIService:', e);
        }
      }
      
      if (window.whisperService) {
        try {
          window.whisperService.stopRecording();
        } catch (e) {
          console.error('Erro ao parar whisperService:', e);
        }
      }
      
      // Pequena pausa para garantir limpeza
      setTimeout(() => {
        // Reiniciar serviços
        window.hybridAIService = hybridAIService;
        window.whisperService = new WhisperTranscriptionService();
        
        toast.info('Serviços de transcrição reiniciados');
        console.log('Serviços de transcrição reiniciados com sucesso');
      }, 1000);
    } catch (error) {
      console.error('Erro ao reiniciar serviços de transcrição:', error);
      toast.error('Falha ao reiniciar serviços. Tente recarregar a página.');
    }
  }, []);

  // Usar o resetTranscriptionServices no primeiro useEffect de montagem
  useEffect(() => {
    console.log('FallbackMeeting montado');
    isMountedRef.current = true;
    
    // Inicializar serviços de transcrição
    try {
      console.log("Inicializando serviços de transcrição...");
      
      // Inicializar Whisper Service
      if (!window.whisperService) {
        window.whisperService = WhisperTranscriptionService;
        console.log('Serviço Whisper inicializado com endpoints:');
        console.log('- Transcrição:', window.whisperService.apiEndpoint);
        console.log('- Salvar transcrições:', window.whisperService.transcriptEndpoint);
        
        // Adicionar listeners de eventos
        document.addEventListener('whisper:transcriptionResult', handleWhisperTranscription);
        document.addEventListener('whisper-transcriptionResult', handleWhisperTranscription);
        window.addEventListener('whisper:transcriptionResult', handleWhisperTranscription);
        window.addEventListener('whisper-transcriptionResult', handleWhisperTranscription);
      }
      
      // Inicializar WebSpeech
      if (!window.hybridAIService) {
        if (window.HybridAIService) {
          window.hybridAIService = new window.HybridAIService();
        } else {
          console.warn("HybridAIService não encontrado");
        }
      }
      
      console.log("Serviços de transcrição inicializados");
    } catch (error) {
      console.error("Erro ao inicializar serviços de transcrição:", error);
    }
    
    // Configurar botão de reset no objeto window para debugging
    window.resetTranscriptionServices = resetTranscriptionServices;
    
    return () => {
      console.log('FallbackMeeting desmontado');
      isMountedRef.current = false;
      
      // Limpar a função global ao desmontar
      delete window.resetTranscriptionServices;
      
      // Parar serviço Whisper se estiver gravando
      if (window.whisperService && window.whisperService.isRecording) {
        try {
          window.whisperService.stopRecording();
          console.log('Serviço Whisper parado ao desmontar componente');
        } catch (error) {
          console.error('Erro ao parar serviço Whisper:', error);
        }
      }
    };
  }, [resetTranscriptionServices]);
  
  // Handler para erro de autenticação  
  useEffect(() => {
    const handleAuthError = (event) => {
      if (event && event.detail) {
        console.error('Erro de autenticação:', event.detail.message);
        toast.error(event.detail.message || 'Erro de autenticação. Faça login novamente.');
        
        // Redirecionar para tela de login após 3 segundos
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    };
    
    // Registrar handler
    window.addEventListener('auth-error', handleAuthError);
    
    // Limpar handler ao desmontar
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);
  
  // ========== PICTURE-IN-PICTURE MANAGEMENT ==========
  const handlePipClick = useCallback(() => {
    try {
      if (!dailyFrameRef.current) return;
      
      // Tentar entrar no modo PiP para o iframe de vídeo
      if (document.pictureInPictureElement !== dailyFrameRef.current) {
        console.log('Entrando no modo PiP');
        dailyFrameRef.current.requestPictureInPicture?.()
          .then(() => {
            console.log('PiP ativado com sucesso');
            onPipModeChange(true);
          })
          .catch(e => {
            console.error('Erro ao entrar no modo PiP', e);
            toast.error('Não foi possível ativar o modo Picture-in-Picture');
          });
      } else {
        // Sair do modo PiP
        console.log('Saindo do modo PiP');
        document.exitPictureInPicture?.()
          .then(() => {
            console.log('Saiu do PiP com sucesso');
            onPipModeChange(false);
          })
          .catch(e => console.error('Erro ao sair do modo PiP', e));
      }
    } catch (e) {
      console.error('Erro ao manipular Picture-in-Picture:', e);
    }
  }, [onPipModeChange]);
  
  // ========== SESSION ID MANAGEMENT ==========
  const getSessionId = useCallback(() => {
    try {
      // Tentar extrair da URL
      if (window.location.pathname) {
        const matches = window.location.pathname.match(/\/session\/([^\/]+)/);
      if (matches && matches[1]) {
        return matches[1];
      }
    }
    
      // Tentar extrair do roomName (formato room-123456)
      if (roomName) {
    const parts = roomName.split('-');
    if (parts.length > 1) {
      return parts[1];
    }
    return roomName;
      }
      
      return null;
    } catch (e) {
      console.error('Erro ao extrair sessionId:', e);
      return null;
    }
  }, [roomName]);

  // ========== DAILY ROOM SETUP ==========
  const initDailyRoom = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log('Inicializando sala Daily.co');
    setIsLoading(true);
    setError(null);
    
    try {
      // Obter o token de autenticação do sessionStorage ou localStorage
      const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
      
      // Usar o sessionId como identificador de sala
      const sessionId = getSessionId();
      
      // Criar um identificador único para esta sessão de terapia
      // Remover caracteres especiais e letras maiúsculas da sala para evitar problemas
      const sanitizedId = (sessionId || roomName || `tc-${Date.now()}-${Math.floor(Math.random() * 100000)}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-');
      
      console.log('ID da sala sanitizado:', sanitizedId);
      
      // Criar a sala manualmente via API Daily.co usando o API Key
      const DAILY_API_KEY = 'e70077d9b78043fac2ba899cbfec34c9ab88d8dfad6dbb374e0c7722b8d8759e'; // Seu API Key
      
      // Primeiro vamos verificar se a sala existe
      fetch(`https://api.daily.co/v1/rooms/${sanitizedId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAILY_API_KEY}`
        }
      })
      .then(response => {
        if (response.ok) {
          // Sala existe, retornar os dados
          return response.json().then(data => {
            console.log('Sala já existe:', data);
            return { url: `https://teraconect.daily.co/${sanitizedId}`, name: sanitizedId };
          });
        } else if (response.status === 404) {
          // Sala não existe, criar
          console.log('Sala não existe, criando...');
          
          return fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DAILY_API_KEY}`
            },
            body: JSON.stringify({
              name: sanitizedId,
              properties: {
                enable_chat: true,
                enable_screenshare: true,
                start_video_off: false,
                start_audio_off: false,
                enable_knocking: true,
                enable_prejoin_ui: true,
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
              }
            })
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Falha ao criar sala via API Direct. Status: ' + response.status);
            }
            return response.json();
          })
          .then(data => {
            console.log('Sala criada com sucesso via API direta:', data);
            return { url: data.url, name: data.name };
          });
        } else {
          throw new Error('Falha ao verificar sala. Status: ' + response.status);
        }
      })
      .then(data => {
        console.log('Dados da sala finais:', data);
        
        // Usar a URL da sala
        const dailyRoomUrl = data.url;
        
        // Adicionar log para depuração
        console.log(`Conectando com a sala: ${dailyRoomUrl}`);
        
        // Atualizar estado com a URL
        if (isMountedRef.current) {
          setSessionDetails(data);
          console.log('Daily.co sala inicializada com sucesso:', data.name, 'URL:', dailyRoomUrl);
        }
      })
      .catch(error => {
        console.error('Erro ao criar/verificar sala Daily.co:', error);
        
        // Em caso de erro, usar URL direta e esperar que a sala já exista
        if (isMountedRef.current) {
          const directUrl = `https://teraconect.daily.co/${sanitizedId}`;
          console.warn('Usando URL direta após erro:', directUrl);
          setSessionDetails({ url: directUrl, name: sanitizedId });
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Erro ao inicializar o Daily.co:', error);
      if (isMountedRef.current) {
        setError('Não foi possível iniciar a videochamada. Tente novamente.');
        setIsLoading(false);
        toast.error('Erro ao iniciar a videochamada. Tente recarregar a página.');
      }
    }
  }, [roomName, getSessionId]);
  
  // Configurar os event listeners para o Daily.co
  useEffect(() => {
    if (!roomNameRef.current) return;
    
    initDailyRoom();
    
    return () => {
      cleanupDaily();
    };
  }, [roomName]);
  
  // ========== AI EVENT HANDLERS ==========
  const handleAnalyze = useCallback(() => {
    try {
      const sessionId = getSessionId();
      if (sessionId) {
        console.log('Analisando sessão:', sessionId);
        // Passar o texto atual da transcrição para a análise
        analyze(sessionId, transcriptText);
      } else {
        toast.error('ID da sessão não disponível');
      }
    } catch (e) {
      console.error('Erro ao analisar:', e);
      toast.error('Erro ao analisar a sessão');
    }
  }, [analyze, getSessionId, transcriptText]);

  const handleSuggest = useCallback(() => {
    try {
      const sessionId = getSessionId();
      if (sessionId) {
        console.log('Gerando sugestões para sessão:', sessionId);
        // Passar o texto atual da transcrição para gerar sugestões
        suggest(sessionId, transcriptText);
      } else {
        toast.error('ID da sessão não disponível');
      }
    } catch (e) {
      console.error('Erro ao gerar sugestões:', e);
      toast.error('Erro ao gerar sugestões');
    }
  }, [suggest, getSessionId, transcriptText]);

  const handleReport = useCallback(() => {
    try {
      const sessionId = getSessionId();
      if (sessionId) {
        console.log('Gerando relatório para sessão:', sessionId);
        // Passar o texto atual da transcrição para gerar relatório
        report(sessionId, transcriptText);
      } else {
        toast.error('ID da sessão não disponível');
      }
    } catch (e) {
      console.error('Erro ao gerar relatório:', e);
      toast.error('Erro ao gerar relatório');
    }
  }, [report, getSessionId, transcriptText]);
  
  // ========== TRANSCRIPT HANDLING ==========
  // Esta declaração foi movida para a seção STATE HOOKS acima
  /* const [isTranscribing, setIsTranscribing] = useState(false); */
  
  // useEffect para lidar com eventos de transcrição de ambos os serviços
  useEffect(() => {
    // Configurar eventos para receber transcrições
    const handleHybridTranscript = (event) => {
      if (event && event.detail) {
        setTranscriptText(prev => prev + (prev ? '\n' : '') + event.detail.transcript);
      }
    };
    
    // Adicionar listeners
    window.addEventListener('transcript', handleHybridTranscript);
    window.addEventListener('whisper-transcription', handleWhisperTranscription);
    document.addEventListener('whisper:transcriptionResult', handleWhisperTranscription);
    window.addEventListener('speech-error', handleError);
    window.addEventListener('whisper-error', handleError);
    document.addEventListener('whisper:transcriptionError', handleError);
    
    return () => {
      // Remover listeners
      window.removeEventListener('transcript', handleHybridTranscript);
      window.removeEventListener('whisper-transcription', handleWhisperTranscription);
      document.removeEventListener('whisper:transcriptionResult', handleWhisperTranscription);
      window.removeEventListener('speech-error', handleError);
      window.removeEventListener('whisper-error', handleError);
      document.removeEventListener('whisper:transcriptionError', handleError);
    };
  }, [handleWhisperTranscription, handleError]);
  
  // Usar useEffect para mostrar os toasts após a renderização
  useEffect(() => {
    // Mostrar aviso se não tiver texto
    if (window.lastTranscriptionError) {
      toast.warning(window.lastTranscriptionError);
      window.lastTranscriptionError = null;
    }
    
    // Mostrar notificação de sucesso se tiver texto
    if (window.lastTranscriptText) {
      toast.success(`Transcrição recebida: ${window.lastTranscriptText}`);
      window.lastTranscriptText = null;
    }
  }, [transcriptText]);
  
  // Função para alternar transcrição
  const toggleTranscription = useCallback(() => {
    try {
      if (isTranscribing) {
        // Parar transcrição
        console.log('Parando reconhecimento de voz');
        window.dispatchEvent(new Event('stop-transcription'));
        setIsTranscribing(false);
        toast.info('Transcrição parada');
      } else {
        // Iniciar transcrição
        console.log('Iniciando reconhecimento de voz');
        setTranscriptText(''); // Limpar texto anterior
        window.dispatchEvent(new Event('start-transcription'));
        setIsTranscribing(true);
        toast.info('Transcrição iniciada');
        
        // Disparar evento para forçar visibilidade após iniciar transcrição
        setTimeout(() => {
          window.dispatchEvent(new Event('force-transcript-visibility'));
        }, 500);
      }
    } catch (e) {
      console.error('Erro ao alternar transcrição:', e);
      toast.error('Erro ao controlar transcrição');
    }
  }, [isTranscribing]);

  // Função para alternar a visualização do campo de constelação
  const handleToggleConstellation = useCallback(() => {
    // Se estamos mostrando o campo, ativar o modo PIP para o vídeo
    setShowConstellation(prev => {
      const newState = !prev;
      // Quando ativar o campo, também ativar o modo PIP para o vídeo
      if (newState) {
        setIsPipMode(true);
      } else {
        // Quando desativar o campo, voltar ao modo normal
        setIsPipMode(false);
      }
      return newState;
    });
  }, []);

  // Função para salvar o estado do campo de constelação
  const saveConstellationState = useCallback(async (constellationData) => {
    if (!sessionDetails || !sessionDetails.sessionId) {
      console.error('Não foi possível salvar o estado da constelação: ID da sessão não disponível');
      return;
    }

    try {
      // Aqui implementaremos a chamada para a API que salvará os dados da constelação
      // associados a esta sessão específica
      console.log('Salvando estado da constelação para a sessão:', sessionDetails.sessionId);
      
      // Exemplo de como poderia ser a chamada à API (a ser implementada no backend)
      /*
      const response = await api.post(`/api/sessions/${sessionDetails.sessionId}/constellation`, {
        data: constellationData,
        timestamp: new Date().toISOString()
      });
      
      if (response.status === 200) {
        toast.success('Campo de constelação salvo com sucesso!');
      }
      */
      
      // Por enquanto apenas mostra uma notificação simulando o salvamento
      toast.success('Campo de constelação salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar o estado da constelação:', error);
      toast.error('Erro ao salvar o campo de constelação');
    }
  }, [sessionDetails]);

  // ========== AI BUTTONS CREATION ==========
  const createAIButtons = useCallback(() => {
    try {
      if (!isMountedRef.current) return;
      console.log('Criando botões de IA...');
      
      // Vamos usar className para estilizar com CSS em vez de modificar o DOM
      // Não é mais necessário criar elementos manualmente através do DOM
      
    } catch (error) {
      console.error('Erro ao criar botões de IA:', error);
    }
  }, [handleAnalyze, handleReport, handleSuggest, isTranscribing, toggleTranscription, transcriptText]);
  
  // Callback quando o iframe é carregado
  const handleIframeLoad = useCallback((iframeElement) => {
    if (!isMountedRef.current) return;
    
    console.log('Daily iframe carregado com sucesso');
    
    // Armazenar a referência do iframe
    dailyFrameRef.current = iframeElement;
    
    // Marcar que o vídeo foi carregado
    setIsVideoEnabled(true);
    
    try {
      // Tentar configurar o currentCall globalmente
      if (typeof window.DailyIframe !== 'undefined') {
        const dailyObjects = window.DailyIframe.wrap(iframeElement);
        // Disponibilizar globalmente para verificação de participantes
        dailyCallRef.current = dailyObjects;
        console.log('API da Daily.co acessível globalmente via window.currentCall');
      }
        } catch (error) {
      console.error('Erro ao configurar API da Daily:', error);
    }
    
    // Remover a tela de carregamento
    setIsLoading(false);
    
    // Aguardar a renderização completa do componente antes de tentar criar botões
    setTimeout(() => {
      const dailyContainer = document.querySelector('.meeting-root');
      if (dailyContainer) {
        console.log('Container do Daily encontrado, adicionando classe daily-container');
        dailyContainer.classList.add('daily-container');
    } else {
        console.warn('Container do Daily não encontrado no primeiro tempo');
        // Segunda tentativa com um seletor mais específico
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
          console.log('Container de vídeo encontrado, adicionando classe daily-container');
          videoContainer.classList.add('daily-container');
        }
      }
    }, 500);
    
    // Enviar mensagens para o iframe após o carregamento
    setTimeout(() => {
      try {
        const roomIdentifier = getSessionId() || roomName || 'default-room';
        if (iframeElement && iframeElement.contentWindow) {
          iframeElement.contentWindow.postMessage({
            type: 'join-room',
            roomId: roomIdentifier,
            userName: userName || 'Usuário'
          }, '*');
        }
      } catch (e) {
        console.warn('Não foi possível enviar mensagem para o iframe:', e);
      }
    }, 1000);
  }, [createAIButtons, getSessionId, roomName, userName]);
  
  // Conectar com o sistema de transcrição
  useEffect(() => {
    const startTranscriptionHandler = () => {
      // Iniciar a transcrição usando o serviço hybridAI
      if (window.hybridAIService && typeof window.hybridAIService.startRecording === 'function') {
        console.log("Iniciando reconhecimento de voz via hybridAIService");
        window.hybridAIService.startRecording();
        setIsTranscribing(true);
      }
    };
    
    const stopTranscriptionHandler = () => {
      // Parar a transcrição
      if (window.hybridAIService && typeof window.hybridAIService.stopRecording === 'function') {
        console.log("Parando reconhecimento de voz via hybridAIService");
        window.hybridAIService.stopRecording();
        setIsTranscribing(false);
      }
    };
    
    // Registrar event listeners
    window.addEventListener('start-transcription', startTranscriptionHandler);
    window.addEventListener('stop-transcription', stopTranscriptionHandler);
    
    // Limpar event listeners ao desmontar
    return () => {
      window.removeEventListener('start-transcription', startTranscriptionHandler);
      window.removeEventListener('stop-transcription', stopTranscriptionHandler);
      
      // Garantir que a transcrição seja interrompida
      if (window.hybridAIService && typeof window.hybridAIService.stopRecording === 'function') {
        window.hybridAIService.stopRecording();
      }
    };
  }, []);
  
  // Adicionar CSS para os botões e a transcrição
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .daily-container {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .ai-buttons-container {
        position: absolute;
        bottom: 100px;
        right: 20px;
        z-index: 1000;
        display: flex;
        gap: 12px;
        flex-direction: column;
      }
      
      .ai-button, .mic-button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        backdrop-filter: blur(3px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        padding: 0;
      }
      
      .ai-button:hover, .mic-button:hover {
        background: rgba(50, 50, 50, 0.95);
        transform: scale(1.1);
        box-shadow: 0 3px 7px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
      
      .mic-button.active {
        background: rgba(206, 52, 52, 0.85);
        border: 1px solid rgba(255, 100, 100, 0.4);
      }
      
      .mic-button.paused {
        background: rgba(255, 152, 0, 0.7);
        border: 1px solid rgba(255, 180, 0, 0.6);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.6);
        }
        70% {
          box-shadow: 0 0 0 8px rgba(255, 152, 0, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
        }
      }
      
      .ai-button svg, .mic-button svg {
        width: 22px;
        height: 22px;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
      }
      
      .transcript-container {
        position: fixed;
        bottom: 160px; /* Aumentado para ficar acima dos controles do Daily */
        left: 50%;
        transform: translateX(-50%);
        width: 80%; /* Aumentado para melhor legibilidade */
        max-width: 800px;
        background-color: rgba(0, 0, 0, 0.85); /* Mais opaco para melhor legibilidade */
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        font-size: 15px; /* Aumentado para melhor legibilidade */
        z-index: 950; /* Valor alto para garantir que fique acima de outros elementos */
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.2);
        pointer-events: auto; /* Permitir interações com a transcrição */
        display: block !important; /* Forçar exibição */
        visibility: visible !important; /* Garantir visibilidade */
      }
      
      .transcript-container.hidden {
        opacity: 0.2;
        transform: translateX(-50%) translateY(20px);
        transition: all 0.3s ease;
      }
      
      .transcript-container:not(.hidden) {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
        transition: all 0.3s ease;
      }
      
      .transcript-title {
        font-weight: bold;
        margin-bottom: 8px;
        color: #a0d1ff;
        font-size: 16px;
        text-align: center;
      }
      
      .transcript-text {
        line-height: 1.5;
        max-height: 150px; /* Maior altura para mostrar mais conteúdo */
        overflow-y: auto;
        padding: 5px;
        min-height: 30px;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
  
  // ========== VOICE RECOGNITION ==========
  // Inicializar serviço de reconhecimento de voz
  useEffect(() => {
    try {
      // Verificar se o serviço já foi inicializado globalmente
      if (!window.hybridAIService) {
        console.log('Inicializando serviço de reconhecimento de voz');
        
        // Importar dinamicamente o serviço
        import('../services/hybridAI.service').then(module => {
          const HybridAIService = module.default;
          
          // Criar instância e atribuir à window
          window.hybridAIService = new HybridAIService();
          window.HybridAIService = HybridAIService; // Armazenar classe para reinstanciação se necessário
          
          console.log('Serviço de reconhecimento de voz inicializado com sucesso');
        }).catch(error => {
          console.error('Erro ao importar serviço de reconhecimento de voz:', error);
        });
      } else {
        console.log('Serviço de reconhecimento de voz já inicializado');
      }
    } catch (e) {
      console.error('Erro ao configurar serviço de reconhecimento de voz:', e);
    }
  }, []);
  
  // ========== UI COMPONENTS ==========
  // Componente de seletor de modo de transcrição
  const TranscriptionSelector = ({ mode, onChange }) => {
    return (
      <div className="transcription-mode-selector">
        <label>Modo de transcrição: </label>
        <select
          value={mode}
          onChange={(e) => onChange(e.target.value)}
          className="transcription-mode-select"
        >
          <option value="auto">Auto</option>
          <option value="whisper">Whisper (Alta precisão)</option>
          <option value="webspeech">Browser (Tempo real)</option>
        </select>
      </div>
    );
  };
  
  // Adicionar botões de AI na interface
  const AIButtons = () => {
    // Verificar se o usuário é terapeuta para mostrar o botão de constelação
    const isTherapist = sessionDetails?.isHost || false;

    return (
      <div className="ai-buttons-container">
        <MicButton />
        
        <TranscriptionSelector 
          mode={transcriptionMode} 
          onChange={setTranscriptionMode} 
        />
        
        <button 
          onClick={handleAnalyze}
          className="ai-button"
          title="Analisar conversa atual"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"/>
          </svg>
        </button>
        
        <button 
          onClick={handleSuggest}
          className="ai-button"
          title="Obter sugestões"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 16H13V18H11ZM12.61 6.04C10.55 5.79 8.73 7.13 8.27 9.17C8.05 10.3 9.03 10.99 10.1 10.68C10.65 10.5 11.25 10.07 11.36 9.5C11.78 7.83 14.08 8.2 14.08 10.25C14.08 11.28 13.47 11.8 12.69 12.5C11.91 13.2 11 14.09 11 15.25V15.5H13V15.25C13 14.58 13.67 14.11 14.45 13.41C15.23 12.71 16 11.8 16 10.25C16 7.92 14.57 6.29 12.61 6.04Z" fill="white"/>
          </svg>
        </button>
        
        <button 
          onClick={handleReport}
          className="ai-button"
          title="Gerar relatório"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 14H16V16H8V14ZM8 18H13V20H8V18ZM8 10H16V12H8V10Z" fill="white"/>
          </svg>
        </button>

        {/* Botão de Constelação - apenas visível para terapeutas */}
        {isTherapist && (
          <button 
            onClick={handleToggleConstellation}
            className={`ai-button ${showConstellation ? 'active' : ''}`}
            title="Campo de Constelação"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="white"/>
              <path d="M12 8L8.5 17.29L9.21 18L12 15L14.79 18L15.5 17.29L12 8Z" fill="white"/>
            </svg>
          </button>
        )}
      </div>
    );
  };
  
  // Componente de botão do microfone aprimorado
  const MicButton = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const recordingTimerRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    
    // Definir a função restartRecording ANTES de usá-la em qualquer useEffect
    const restartRecording = useCallback(() => {
      try {
        console.log('Reiniciando gravação de voz...');
        
        // Parar qualquer instância ativa
        if (window.hybridAIService) {
          window.hybridAIService.stopRecording();
        }
        
        if (window.whisperService) {
          window.whisperService.stopRecording();
        }
        
        // Pequeno delay para garantir que tudo foi limpo
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          // Decidir qual serviço usar baseado no modo selecionado
          if (transcriptionMode === 'whisper') {
            if (window.whisperService) {
              window.whisperService.startRecording();
              setIsRecording(true);
              setIsPaused(false);
              toast.info('Reconhecimento Whisper iniciado');
            }
          } else if (transcriptionMode === 'webspeech') {
            if (window.hybridAIService) {
              window.hybridAIService.startRecording();
              setIsRecording(true);
              setIsPaused(false);
              toast.info('Reconhecimento Web Speech iniciado');
            }
          } else if (transcriptionMode === 'auto') {
            // No modo auto, inicia ambos
            let started = false;
            
            if (window.whisperService) {
              window.whisperService.startRecording();
              started = true;
            }
            
            if (window.hybridAIService) {
              window.hybridAIService.startRecording();
              started = true;
            }
            
            if (started) {
              setIsRecording(true);
              setIsPaused(false);
              toast.info('Reconhecimento híbrido iniciado');
            } else {
              toast.error('Nenhum serviço de reconhecimento disponível');
              setIsRecording(false);
            }
          }
        }, 1000);
      } catch (e) {
        console.error('Erro ao reiniciar gravação:', e);
        setIsRecording(false);
        setIsPaused(false);
      }
    }, [transcriptionMode]);
    
    // Inicializar os serviços de transcrição
    useEffect(() => {
      // Verificar se os serviços já foram inicializados globalmente
      if (!window.hybridAIService) {
        console.log('Inicializando serviço Web Speech API');
        window.hybridAIService = hybridAIService;
      }
      
      if (!window.whisperService) {
        console.log('Inicializando serviço Whisper');
        window.whisperService = WhisperTranscriptionService;
      }
      
      // Limpar ao desmontar
      return () => {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
        }
      };
    }, []);
    
    // Verificar periodicamente se a gravação ainda está ativa
    useEffect(() => {
      const checkRecordingStatus = () => {
        // Verificar consistência com base no modo atual
        const webSpeechActive = window.hybridAIService?.isListening || false;
        const whisperActive = window.whisperService?.isRecording || false;
        
        // Verificar inconsistências com base no modo de transcrição atual
        let shouldBeActive = false;
        
        if (transcriptionMode === 'whisper') {
          shouldBeActive = whisperActive;
        } else if (transcriptionMode === 'webspeech') {
          shouldBeActive = webSpeechActive;
        } else if (transcriptionMode === 'auto') {
          shouldBeActive = webSpeechActive || whisperActive;
        }
        
        // Se o estado visual não condiz com o estado real, corrigir
        if (isRecording !== shouldBeActive) {
          console.log(`Corrigindo estado inconsistente: UI=${isRecording}, atual=${shouldBeActive}`);
          setIsRecording(shouldBeActive);
        }
      };
      
      // Verificar a cada 3 segundos
      const intervalId = setInterval(checkRecordingStatus, 3000);
      
      return () => clearInterval(intervalId);
    }, [isRecording, transcriptionMode]);
    
    const toggleMicrophone = useCallback(() => {
      try {
        // Se estamos gravando, parar gravação completamente
        if (isRecording) {
          console.log('Parando reconhecimento de voz');
          
          // Parar serviços com base no modo
          if (transcriptionMode === 'whisper' || transcriptionMode === 'auto') {
            if (window.whisperService) {
              window.whisperService.stopRecording();
            }
          }
          
          if (transcriptionMode === 'webspeech' || transcriptionMode === 'auto') {
            if (window.hybridAIService) {
              window.hybridAIService.stopRecording();
            }
          }
          
          // Atualizar UI
          setIsRecording(false);
          setIsPaused(false);
          
          // Limpar qualquer timer pendente
          if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          
          // Notificar o usuário
          toast.info('Transcrição parada');
        } 
        // Se não estamos gravando, iniciar gravação
        else {
          console.log(`Iniciando reconhecimento no modo: ${transcriptionMode}`);
          
          // Prevenção contra múltiplos cliques
          if (recordingTimerRef.current) {
            return;
          }
          
          // Flag para rastrear se algum serviço foi iniciado
          let serviceStarted = false;
          
          try {
            // Iniciar com base no modo selecionado
            if (transcriptionMode === 'whisper' || transcriptionMode === 'auto') {
              if (window.whisperService) {
                const success = window.whisperService.startRecording();
                if (success || success === undefined) { // undefined para compatibilidade
                  serviceStarted = true;
                }
              } else {
                console.warn('Serviço Whisper não disponível');
                // Tentar reinicializar
                window.whisperService = new WhisperTranscriptionService();
              }
            }
            
            if (transcriptionMode === 'webspeech' || transcriptionMode === 'auto') {
              if (window.hybridAIService) {
                const success = window.hybridAIService.startRecording();
                if (success || success === undefined) { // undefined para compatibilidade
                  serviceStarted = true;
                }
              } else {
                console.warn('Serviço Web Speech não disponível');
                // Tentar reinicializar
                window.hybridAIService = hybridAIService;
              }
            }
          } catch (serviceError) {
            console.error('Erro ao iniciar serviço de reconhecimento:', serviceError);
            toast.error('Erro ao iniciar reconhecimento. Tente novamente.');
            return;
          }
          
          // Atualizar estado e mostrar mensagem apropriada
          if (serviceStarted) {
            setIsRecording(true);
            
            // Mensagem baseada no modo
            if (transcriptionMode === 'whisper') {
              toast.info('Transcrição Whisper iniciada (alta precisão)');
            } else if (transcriptionMode === 'webspeech') {
              toast.info('Transcrição Web Speech iniciada (tempo real)');
            } else {
              toast.info('Transcrição híbrida iniciada');
            }
          } else {
            toast.error('Não foi possível iniciar o serviço de reconhecimento de voz');
          }
        }
      } catch (error) {
        console.error('Erro ao alternar microfone:', error);
        toast.error('Erro ao controlar reconhecimento de voz');
      }
    }, [isRecording, transcriptionMode]);
    
    // Renderização do ícone do microfone
    const renderIcon = () => {
      return <FontAwesomeIcon 
        icon={isRecording ? faMicrophoneSlash : faMicrophone} 
        className="mic-icon" 
      />;
    };
    
    return (
      <button 
        onClick={toggleMicrophone}
        className={`mic-button ${isRecording ? 'recording' : ''}`}
        title={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
      >
        {renderIcon()}
      </button>
    );
  };
  
  // useEffect para lidar com eventos adicionais de transcrição
  useEffect(() => {
    // Handler para procesamento de chunks
    const handleChunkProcessing = (event) => {
      if (event && event.detail) {
        setProcessingChunk(true);
        const { chunkNumber, duration } = event.detail;
        console.log(`Processando chunk #${chunkNumber}, duração: ${Math.round(duration/1000)}s`);
      }
    };
    
    // Handler para quando um chunk é salvo
    const handleTranscriptionSaved = (event) => {
      if (event && event.detail) {
        setProcessingChunk(false);
        const { historyLength, text } = event.detail;
        
        setChunkStats(prev => ({
          count: historyLength || prev.count + 1,
          totalDuration: prev.totalDuration + (event.detail.duration || 0)
        }));
        
        // Notificar usuário discretamente 
        toast.success(`Transcrição contínua #${historyLength} salva`, { 
          autoClose: 1500,
          position: 'bottom-right'
        });
      }
    };
    
    // Registrar event listeners
    document.addEventListener('whisper:processingChunk', handleChunkProcessing);
    document.addEventListener('whisper-processingChunk', handleChunkProcessing);
    document.addEventListener('whisper:transcriptionSaved', handleTranscriptionSaved);
    document.addEventListener('whisper-transcriptionSaved', handleTranscriptionSaved);
    
    // Limpar event listeners
    return () => {
      document.removeEventListener('whisper:processingChunk', handleChunkProcessing);
      document.removeEventListener('whisper-processingChunk', handleChunkProcessing);
      document.removeEventListener('whisper:transcriptionSaved', handleTranscriptionSaved);
      document.removeEventListener('whisper-transcriptionSaved', handleTranscriptionSaved);
    };
  }, []);
  
  // Componente para status de transcrição
  const TranscriptionStatus = () => {
    // Se não estamos transcrevendo, não mostrar nada
    if (!isTranscribing && !processingChunk) return null;
    
    return (
      <div className="transcription-status-container">
        <div className={`status-indicator ${processingChunk ? 'processing' : 'recording'}`}></div>
        <span>{processingChunk ? 'Processando áudio...' : 'Gravando áudio...'}</span>
        {chunkStats.count > 0 && (
          <span className="chunk-stats">
            ({chunkStats.count} chunks, {Math.round(chunkStats.totalDuration)}s)
          </span>
        )}
      </div>
    );
  };
  
  // Componente wrapper para o campo de constelação
  const ConstellationWrapper = () => {
    if (!showConstellation) return null;
    
    // Função para interceptar o salvamento do campo de constelação
    const handleSave = (constellationData) => {
      // Salvar o estado do campo associado à sessão atual
      saveConstellationState(constellationData);
    };
    
    return (
      <div className="constellation-overlay">
        <div className="constellation-header">
          <button 
            onClick={handleToggleConstellation} 
            className="close-constellation-button"
          >
            Fechar Campo de Constelação
          </button>
        </div>
        <div className="constellation-container">
          <ConstellationField 
            isHost={sessionDetails?.isHost || false} 
            sessionId={sessionDetails?.sessionId}
            onSave={handleSave}
            fieldTexture="/white-circle.png"
          />
        </div>
      </div>
    );
  };
  
  // Referências para arrastar o container de vídeo em modo PIP
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  
  // Handler para iniciar o arrasto do container de vídeo em modo PIP
  const handlePipDragStart = useCallback((e) => {
    if (!showConstellation || !videoContainerRef.current) return;
    
    // Obter as posições iniciais
    const rect = videoContainerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    isDraggingRef.current = true;
    
    // Adicionar os event listeners para mover e finalizar o arrasto
    document.addEventListener('mousemove', handlePipDragMove);
    document.addEventListener('mouseup', handlePipDragEnd);
    
    // Prevenir seleção de texto durante o arrasto
    e.preventDefault();
  }, [showConstellation]);
  
  // Handler para mover o container de vídeo durante o arrasto
  const handlePipDragMove = useCallback((e) => {
    if (!isDraggingRef.current || !videoContainerRef.current) return;
    
    const container = videoContainerRef.current;
    const newLeft = e.clientX - dragStartRef.current.x;
    const newTop = e.clientY - dragStartRef.current.y;
    
    // Verificar limites da janela para não sair da tela
    const rect = container.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calcular posições considerando os limites
    const limitedLeft = Math.max(0, Math.min(newLeft, windowWidth - rect.width));
    const limitedTop = Math.max(0, Math.min(newTop, windowHeight - rect.height));
    
    // Atualizar posição
    container.style.left = `${limitedLeft}px`;
    container.style.top = `${limitedTop}px`;
    container.style.right = 'auto';
  }, []);
  
  // Handler para finalizar o arrasto
  const handlePipDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    
    // Remover os event listeners
    document.removeEventListener('mousemove', handlePipDragMove);
    document.removeEventListener('mouseup', handlePipDragEnd);
  }, [handlePipDragMove]);
  
  // Adicionar/remover event listeners globais quando o modo constelação muda
  useEffect(() => {
    // Limpar os event listeners ao desmontar o componente
    return () => {
      document.removeEventListener('mousemove', handlePipDragMove);
      document.removeEventListener('mouseup', handlePipDragEnd);
    };
  }, [handlePipDragMove, handlePipDragEnd]);

  // ========== RENDER ==========
  return (
    <div className={`meeting-root daily-container ${showConstellation ? 'with-constellation' : ''}`} style={{ width: '100%', height: '100%' }}>
      <VideoErrorBoundary onReset={initDailyRoom}>
        <div className={`video-container daily-container ${showConstellation ? 'pip-mode' : ''}`} style={{ 
          width: showConstellation ? '300px' : '100%', 
          height: showConstellation ? '200px' : '100%',
          position: showConstellation ? 'absolute' : 'relative',
          top: showConstellation ? '10px' : 'auto',
          right: showConstellation ? '10px' : 'auto',
          zIndex: showConstellation ? 1000 : 1,
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
          borderRadius: floating || showConstellation ? '8px' : '0',
          boxShadow: showConstellation ? '0 4px 8px rgba(0,0,0,0.3)' : 'none',
          resize: showConstellation ? 'both' : 'none',
          minWidth: showConstellation ? '200px' : 'auto',
          minHeight: showConstellation ? '150px' : 'auto',
          cursor: showConstellation ? 'move' : 'auto',
          transition: 'width 0.3s, height 0.3s'
        }}
        ref={videoContainerRef}
        onMouseDown={showConstellation ? handlePipDragStart : undefined}
        >
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontFamily: 'sans-serif'
            }}>
              <div>Preparando sala de videoconferência...</div>
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              textAlign: 'center',
              fontFamily: 'sans-serif'
            }}>
              <div>{error}</div>
              <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.8 }}>
                Usando domínio: teraconect.daily.co
              </div>
            <button 
                onClick={initDailyRoom}
                style={{
                  marginTop: '20px',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Tentar Novamente
            </button>
        </div>
          )}
          
          {!isLoading && !error && sessionDetails && (
            <DailyFrame 
              roomUrl={sessionDetails.url} 
              onLoad={handleIframeLoad}
            />
          )}
          
          {document.pictureInPictureEnabled && !floating && isVideoEnabled && !showConstellation && (
            <button 
              onClick={handlePipClick}
          style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 10px',
            fontSize: '12px',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              PiP
            </button>
          )}
        </div>
      </VideoErrorBoundary>
      
      <AIButtons />
      
      {/* Sempre renderizar o container de transcrição, mas controlar visibilidade com CSS */}
      <div className={`transcript-container ${!transcriptText ? 'hidden' : ''}`}>
        <div className="transcript-title">Transcrição em tempo real</div>
        <div className="transcript-text">
          {transcriptText || 'Aguardando transcrição...'}
        </div>
      </div>
      
      {/* Componente para exibir resultados da IA */}
      <AIResultsPanel />
      
      {/* Componente para exibir o campo de constelação */}
      <ConstellationWrapper />
      
      {/* Botão para reiniciar serviços de transcrição (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={resetTranscriptionServices}
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            zIndex: 9999
          }}
        >
          Reset Transcription Services
        </button>
      )}
      
      <TranscriptionStatus />
    </div>
  );
};

FallbackMeeting.propTypes = {
  roomName: PropTypes.string.isRequired,
  userName: PropTypes.string,
  audioEnabled: PropTypes.bool,
  videoEnabled: PropTypes.bool,
  floating: PropTypes.bool,
  onPipModeChange: PropTypes.func,
};

export default FallbackMeeting;