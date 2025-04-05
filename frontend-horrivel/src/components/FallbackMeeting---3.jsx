import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import hybridAIService from '../services/hybridAI.service';
import WhisperTranscriptionService from '../services/whisperTranscriptionService';
import FloatingWindowManager from './FloatingWindowManager';
import DailyIframe from '@daily-co/daily-js';
import './FallbackMeeting.css';
import './AITools.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import config from '../environments';
import { joinMeeting, createMeeting } from '../services/meetingService';

// Verificar se a biblioteca DailyIframe está disponível
if (typeof DailyIframe === 'undefined') {
  console.error("ERRO CRÍTICO: DailyIframe não está disponível!");
} else {
  console.log("DailyIframe disponível, versão:", DailyIframe.version || "desconhecida");

  // Adicionar método estático para gestão de instâncias
  if (!DailyIframe.instanceManager) {
    console.log("Inicializando gerenciador global de instâncias do DailyIframe");
    
    DailyIframe.instanceManager = {
      // Registro de instâncias ativas
      instances: [],
      
      // Verificar se há alguma instância ativa
      hasActiveInstances: function() {
        return this.instances.length > 0;
      },
      
      // Registrar uma nova instância
      registerInstance: function(id, frame) {
        this.instances.push({ id, frame, createdAt: new Date() });
        console.log(`Nova instância ${id} registrada. Total: ${this.instances.length}`);
        return true;
      },
      
      // Remover uma instância
      removeInstance: function(id) {
        const initialCount = this.instances.length;
        this.instances = this.instances.filter(instance => instance.id !== id);
        console.log(`Instância ${id} removida. ${initialCount} -> ${this.instances.length}`);
        return initialCount !== this.instances.length;
      },
      
      // Limpar todas as instâncias
      clearAllInstances: function() {
        // Destruir todos os frames
        const promises = this.instances.map(instance => {
          try {
            if (instance.frame && typeof instance.frame.destroy === 'function') {
              return instance.frame.destroy().catch(e => console.warn(`Erro ao destruir instância ${instance.id}:`, e));
            }
          } catch (e) {
            console.warn(`Erro ao tentar destruir instância ${instance.id}:`, e);
          }
          return Promise.resolve();
        });
        
        // Limpar array após todas as tentativas de destruição
        return Promise.all(promises).finally(() => {
          const count = this.instances.length;
          this.instances = [];
          console.log(`Todas as ${count} instâncias foram removidas`);
        });
      },
      
      // Obter estatísticas
      getStats: function() {
        return {
          count: this.instances.length,
          oldest: this.instances.length > 0 ? this.instances[0].createdAt : null,
          newest: this.instances.length > 0 ? this.instances[this.instances.length - 1].createdAt : null
        };
      }
    };
    
    // Adicionar método para destruir todas as instâncias (helper global)
    DailyIframe.destroyAllInstances = function() {
      return DailyIframe.instanceManager.clearAllInstances();
    };
    
    // Sobrescrever método createFrame para garantir que apenas uma instância exista
    const originalCreateFrame = DailyIframe.createFrame;
    DailyIframe.createFrame = function(container, options) {
      try {
        // Verificar se há instâncias ativas e destruí-las
        if (DailyIframe.instanceManager.hasActiveInstances()) {
          console.warn("Instâncias ativas do DailyIframe detectadas antes de criar nova. Limpando...");
          // Tentativa síncrona de destruir frames antigos
          DailyIframe.instanceManager.instances.forEach(instance => {
            try {
              if (instance.frame && typeof instance.frame.destroy === 'function') {
                instance.frame.destroy();
              }
            } catch (e) {
              console.warn(`Erro ao destruir instância ${instance.id}:`, e);
            }
          });
          
          // Limpar registro após tentativas
          DailyIframe.instanceManager.instances = [];
        }
        
        // Verificar se existem iframes residuais no DOM
        const existingIframes = document.querySelectorAll('iframe[allow*="camera"]');
        if (existingIframes.length > 0) {
          console.warn(`Encontrados ${existingIframes.length} iframes residuais no DOM antes de criar novo DailyIframe`);
          existingIframes.forEach(iframe => {
            try {
              if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
              }
            } catch (e) {
              console.warn("Erro ao remover iframe residual:", e);
            }
          });
        }
        
        // Gerar ID para a nova instância
        const instanceId = `daily-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Criar o frame usando o método original
        const frame = originalCreateFrame.call(DailyIframe, container, options);
        
        // Registrar a nova instância no gerenciador
        DailyIframe.instanceManager.registerInstance(instanceId, frame);
        
        // Adicionar método destroy personalizado para remover do gerenciador
        const originalDestroy = frame.destroy;
        frame.destroy = function() {
          console.log(`Destruindo instância ${instanceId}`);
          const result = originalDestroy.apply(this, arguments);
          DailyIframe.instanceManager.removeInstance(instanceId);
          return result;
        };
        
        // Adicionar ID para referência
        frame._instanceId = instanceId;
        
        return frame;
      } catch (error) {
        console.error("Erro ao criar DailyIframe com proteção anti-duplicação:", error);
        throw error;
      }
    };
    
    // Monitor global para erros de DailyIframe
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('DailyIframe') && event.message.includes('Duplicate')) {
        console.error("Erro crítico de duplicação do DailyIframe detectado:", event.message);
        
        // Limpar todas as instâncias existentes
        if (DailyIframe.instanceManager) {
          DailyIframe.instanceManager.clearAllInstances();
        }
        
        // Remover iframes residuais
        const iframes = document.querySelectorAll('iframe[allow*="camera"]');
        iframes.forEach(iframe => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        });
        
        // Resetar sistema de locks
        if (window.dailyInstanceLock) {
          window.dailyInstanceLock.isLocked = false;
          window.dailyInstanceLock.lockId = null;
        }
        
        // Notificar usuário
        if (typeof toast !== 'undefined') {
          toast.error("Erro no sistema de videoconferência. Recarregando...");
        }
        
        // Programar reload da página após breve delay
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    });
  }
}

// Sistema global de "locks" para evitar múltiplas instâncias simultâneas do DailyIframe
// Isso evitará o erro "Duplicate DailyIframe instances are not allowed"
if (!window.dailyInstanceLock) {
  window.dailyInstanceLock = {
    isLocked: false,
    lockId: null,
    acquireLock: function(id) {
      // Se já está bloqueado e não é o mesmo ID, falha
      if (this.isLocked && this.lockId !== id) {
        console.warn(`Lock já adquirido por ${this.lockId}, rejeitando solicitação de ${id}`);
        return false;
      }
      
      // Se não está bloqueado ou é o mesmo ID, adquire o lock
      this.isLocked = true;
      this.lockId = id;
      console.log(`Lock adquirido por ${id}`);
      return true;
    },
    releaseLock: function(id) {
      // Só libera se for o mesmo ID que adquiriu
      if (this.isLocked && this.lockId === id) {
        this.isLocked = false;
        this.lockId = null;
        console.log(`Lock liberado por ${id}`);
        return true;
      }
      
      console.warn(`Tentativa de liberar lock por ${id}, mas está com ${this.lockId}`);
      return false;
    },
    isLockedBy: function(id) {
      return this.isLocked && this.lockId === id;
    }
  };
}

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
const DailyFrame = ({ roomUrl }) => {
  // Adicionar parâmetro pip=true à URL
  const pipEnabledUrl = roomUrl.includes('?') 
    ? `${roomUrl}&pip=true` 
    : `${roomUrl}?pip=true`;
  
  useEffect(() => {
    console.log('Daily.co iframe carregando: ' + pipEnabledUrl);
  }, [pipEnabledUrl]);
  
  return (
    <iframe
      title="Daily.co Meeting"
      id="daily-iframe"
      className="daily-iframe"
      src={pipEnabledUrl}
      allow="camera; microphone; fullscreen; speaker; display-capture"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
};

const FallbackMeeting = ({
  roomName,
  userName = 'Usuário',
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
  const containerRef = useRef(null);
  const roomNameRef = useRef(roomName);
  const dailyCallRef = useRef(null);
  const dailyFrameRef = useRef(null);
  const pipWindowRef = useRef(null);
  
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
  const [isFloatingWindowVisible, setIsFloatingWindowVisible] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showFloatingVideo, setShowFloatingVideo] = useState(false);
  
  // ========== ERROR HANDLING ==========
  // Handler para erros no Daily.co
  const handleError = useCallback((errOrMessage) => {
    try {
      // Para depuração
      console.error('Erro detectado:', errOrMessage);
      
      // Determinar se é string ou objeto de erro
      let errorMessage;
      if (typeof errOrMessage === 'string') {
        errorMessage = errOrMessage;
      } else if (errOrMessage && typeof errOrMessage === 'object') {
        // Tentar extrair mensagem de erro do objeto
        if (errOrMessage.message) {
          errorMessage = errOrMessage.message;
        } else if (errOrMessage.errorMsg) {
          errorMessage = errOrMessage.errorMsg;
        } else if (errOrMessage.error) {
          errorMessage = typeof errOrMessage.error === 'string' 
            ? errOrMessage.error 
            : JSON.stringify(errOrMessage.error);
        } else {
          // Se não conseguir extrair uma mensagem específica, converter o objeto em string
          try {
            errorMessage = JSON.stringify(errOrMessage);
          } catch (e) {
            errorMessage = 'Erro desconhecido';
          }
        }
      } else {
        errorMessage = 'Erro desconhecido';
      }
      
      // Extrair detalhes adicionais para depuração
      const errorDetails = typeof errOrMessage === 'object'
        ? JSON.stringify(errOrMessage, Object.getOwnPropertyNames(errOrMessage), 2)
        : null;
      
      // Atualizar o state com o erro
      setError(errorMessage);
      if (errorDetails) setErrorDetails(errorDetails);
      
      // Log completo para depuração
      console.error(`Erro tratado: ${errorMessage}`, errorDetails ? { detalhes: errorDetails } : '');
      
      // Mostrar notificação toast
      toast.error(errorMessage);
      
      // Atualizar status de carregamento
      setIsLoading(false);
    } catch (e) {
      console.error('Erro ao processar erro:', e);
      setError('Erro desconhecido no processamento de erro');
      toast.error('Ocorreu um erro inesperado');
    }
  }, []);
  
  // ========== SESSION ID MANAGEMENT ==========
  // Movendo getSessionId para antes do handlePipClick
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
  
  // Função para obter uma URL válida para a sala
  const getValidRoomUrl = (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn("ID de sessão inválido:", sessionId);
      return null;
    }
    
    try {
      // Se já é uma URL completa
      if (sessionId.startsWith('http')) {
        // Verificar se já é uma URL do Daily.co
        if (sessionId.includes('daily.co')) {
          // Não processar URL que já vem completa do backend
          console.log('URL do Daily.co já formatada corretamente:', sessionId);
          return sessionId;
        }
        
        // Se não for Daily.co, retorna a URL original
        return sessionId;
      } 
      
      // Se é apenas um ID de sessão (não uma URL completa)
      // Em vez de processar o ID longo, criar um ID simples
      const timestamp = Date.now().toString().slice(-6);
      const roomName = `room${timestamp}`;
      
      console.log('Usando ID simplificado para Daily.co:', roomName, 'ao invés de:', sessionId);
      return `https://teraconect.daily.co/${roomName}`;
    } catch (error) {
      console.error("Erro ao processar URL da sala:", error);
      
      // Fallback: gerar um ID aleatório seguro
      const safeId = `room${Math.floor(Math.random() * 100000)}`;
      console.log('Usando ID de fallback para Daily.co:', safeId);
      return `https://teraconect.daily.co/${safeId}`;
    }
  };
  
  // Função para obter a URL da sala a partir do backend
  const fetchRoomUrlFromBackend = useCallback(async () => {
    try {
      const sessionId = roomName || getSessionId();
      
      if (!sessionId) {
        throw new Error('Não foi possível determinar o ID da sessão');
      }
      
      console.log('Obtendo detalhes da sala para a sessão:', sessionId);
      
      // Primeiro tenta entrar em uma sala existente
      try {
        const meetingData = await joinMeeting(sessionId);
        console.log('Sala obtida do backend:', meetingData);
        
        if (meetingData && meetingData.roomName) {
          // Remover o prefixo "tc-" se existir
          const cleanRoomName = meetingData.roomName.startsWith('tc-') 
            ? meetingData.roomName.substring(3) 
            : meetingData.roomName;
          
          // Verificar se o roomName já é uma URL completa
          if (cleanRoomName.startsWith('https://')) {
            return {
              url: cleanRoomName,
              name: cleanRoomName.split('/').pop()
            };
          }
            
          return {
            url: `https://teraconect.daily.co/${cleanRoomName}`,
            name: cleanRoomName
          };
        }
      } catch (joinError) {
        console.log('Sala não existe, criando nova:', joinError);
        
        // Se não existir, cria uma nova sala
        try {
          const newMeeting = await createMeeting(sessionId);
          console.log('Nova sala criada:', newMeeting);
          
          if (newMeeting && newMeeting.url) {
            // Se já temos uma URL completa, usá-la diretamente
            if (newMeeting.url.startsWith('https://')) {
              return {
                url: newMeeting.url,
                name: newMeeting.url.split('/').pop()
              };
            }
            
            // Caso contrário, extrair o nome da sala
            const roomName = newMeeting.url.split('/').pop();
            
            // Remover o prefixo "tc-" se existir
            const cleanRoomName = roomName.startsWith('tc-') 
              ? roomName.substring(3) 
              : roomName;
              
            return {
              url: `https://teraconect.daily.co/${cleanRoomName}`,
              name: cleanRoomName
            };
          }
        } catch (createError) {
          console.error('Erro ao criar nova sala:', createError);
          throw createError;
        }
      }
      
      // Se chegou aqui sem retornar, tenta construir uma URL padrão
      const sanitizedId = sessionId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      return {
        url: `https://teraconect.daily.co/${sanitizedId}`,
        name: sanitizedId
      };
    } catch (error) {
      console.error('Erro ao obter URL da sala:', error);
      handleError(error);
      return null;
    }
  }, [roomName, getSessionId, handleError]);
  
  // Função para remover prefixo "tc-" das URLs
  const cleanRoomUrl = useCallback((url) => {
    if (!url) return url;
    
    // Se a URL contém o prefixo "tc-", removê-lo
    if (url.includes('/tc-')) {
      const cleanedUrl = url.replace('/tc-', '/');
      console.log('URL com prefixo "tc-" corrigida:', cleanedUrl);
      return cleanedUrl;
    }
    
    return url;
  }, []);
  
  // Modificar o useEffect para obter a URL da sala do backend
  useEffect(() => {
    let isMounted = true;
    
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        
        // Obter a URL da sala do backend
        const roomDetails = await fetchRoomUrlFromBackend();
        
        if (!isMounted) return;
        
        if (roomDetails && roomDetails.url) {
          // Limpar a URL removendo prefixos "tc-" se necessário
          const cleanedUrl = cleanRoomUrl(roomDetails.url);
          
          // Verificar se a URL contém o domínio errado e corrigir
          if (cleanedUrl.includes('terapiaconect.daily.co')) {
            console.warn("URL com domínio incorreto detectada:", cleanedUrl);
            const correctedUrl = cleanedUrl.replace('terapiaconect.daily.co', 'teraconect.daily.co');
            console.log("URL corrigida (domínio):", correctedUrl);
            return {
              url: correctedUrl,
              name: roomDetails.name
            };
          }
          
          // Atualizar os detalhes da sessão com a URL limpa
          setSessionDetails({
            ...roomDetails,
            url: cleanedUrl
          });
          
          setError(null);
        } else {
          throw new Error('Não foi possível obter detalhes da sala');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Erro ao inicializar sessão:', error);
          handleError(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeSession();
    
    return () => {
      isMounted = false;
    };
  }, [fetchRoomUrlFromBackend, handleError, cleanRoomUrl]);
  
  // Atualiza a obtenção da URL da sala
  const roomUrl = getValidRoomUrl(sessionDetails?.url || roomName || '');
  
  // Log adicional para depuração
  useEffect(() => {
    console.log("roomUrl atualizado:", roomUrl);
  }, [roomUrl]);
  
  // ========== PICTURE-IN-PICTURE MANAGEMENT ==========
  const canvasRef = useRef(null);
  const pipVideoRef = useRef(null);
  const captureIntervalRef = useRef(null);
  
  // Função para verificar se o navegador suporta PiP
  const isPipSupported = useCallback(() => {
    try {
      // Verifica suporte à API Picture-in-Picture
      if (document.pictureInPictureEnabled === false) {
        return false;
      }
      
      // Verifica se o navegador suporta a API
      return (
        document.pictureInPictureEnabled !== undefined && 
        typeof document.exitPictureInPicture === 'function' &&
        HTMLVideoElement.prototype.requestPictureInPicture !== undefined
      );
    } catch (e) {
      console.warn('Erro ao verificar suporte a PiP:', e);
      return false;
    }
  }, []);
  
  // Função para limpar os recursos criados para o PiP
  const cleanupCustomPip = useCallback(() => {
    // Se estiver usando o PiP global e estiver ativo, não limpar
    if (window.globalPipVideo && window.globalPipVideo.active) {
      console.log('PiP global está ativo, não limpando recursos');
      
      // Remover apenas as referências locais para evitar duplicações
      pipVideoRef.current = null;
      canvasRef.current = null;
      
      return;
    }
    
    // Limpar o intervalo de captura
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    // Remover o vídeo local se existir
    if (pipVideoRef.current) {
      if (pipVideoRef.current.srcObject) {
        const tracks = pipVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (document.pictureInPictureElement === pipVideoRef.current) {
        document.exitPictureInPicture().catch(e => console.error('Erro ao sair do PiP:', e));
      }
      if (pipVideoRef.current.parentNode && pipVideoRef.current !== window.globalPipVideo?.element) {
        pipVideoRef.current.parentNode.removeChild(pipVideoRef.current);
      }
      pipVideoRef.current = null;
    }

    // Remover o canvas local se existir
    if (canvasRef.current && canvasRef.current !== window.globalPipVideo?.canvas) {
      if (canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
      canvasRef.current = null;
    }
  }, []);
  
  // Função para abrir a janela flutuante
  const openFloatingWindow = useCallback(() => {
    try {
      // Verificar se já existe uma janela aberta
      if (window.dailyPopupWindow && !window.dailyPopupWindow.closed) {
        // Focar na janela existente
        window.dailyPopupWindow.focus();
        return;
      }
      
      // Definir dimensões e posição
      const width = 400;
      const height = 300;
      const left = window.screen.width - width - 20;
      const top = window.screen.height - height - 100;
      
      // Construir URL para a sala
      const sessionId = getSessionId();
      const iframeUrl = `${process.env.REACT_APP_FRONTEND_URL || ''}/room/${sessionId}?floating=true&mode=popup`;
      
      // Abrir popup
      const popupWindow = window.open(
        iframeUrl,
        'DailyPopup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no`
      );
      
      // Guardar referência
      window.dailyPopupWindow = popupWindow;
      
      // Monitorar fechamento da janela
      const checkClosed = setInterval(() => {
        if (popupWindow.closed) {
          clearInterval(checkClosed);
          setIsFloatingWindowVisible(false);
          console.log('Popup fechado pelo usuário');
        }
      }, 1000);
      
      // Atualizar estado
      setIsFloatingWindowVisible(true);
      
      toast.success('Sessão aberta em nova janela');
    } catch (error) {
      console.error('Erro ao abrir janela flutuante:', error);
      toast.error('Não foi possível abrir a janela');
    }
  }, [getSessionId]);
  
  // Função para fechar a janela flutuante
  const closeFloatingWindow = useCallback(() => {
    try {
      // Fechar a janela se existir
      if (window.dailyPopupWindow && !window.dailyPopupWindow.closed) {
        window.dailyPopupWindow.close();
      }
      
      // Atualizar estado
      setIsFloatingWindowVisible(false);
    } catch (error) {
      console.error('Erro ao fechar janela flutuante:', error);
    }
  }, []);
  
  // Agora handlePipClick pode usar getSessionId sem problemas
  // Função para gerenciar o Picture-in-Picture
  const handlePipClick = useCallback(() => {
    try {
      // Se já existe um PiP global ativo, usá-lo
      if (window.globalPipVideo && window.globalPipVideo.active) {
        // Sair do modo PiP
        document.exitPictureInPicture()
          .then(() => {
            console.log('Saiu do PiP global com sucesso');
            onPipModeChange(false);
            setIsPipMode(false);
            
            // Limpar recursos globais
            if (window.globalPipVideo.interval) {
              clearInterval(window.globalPipVideo.interval);
              window.globalPipVideo.interval = null;
            }
            
            window.globalPipVideo.active = false;
            
            // Não remover os elementos para permitir reuso
            pipVideoRef.current = null;
            canvasRef.current = null;
          })
          .catch(e => {
            console.error('Erro ao sair do modo PiP global:', e);
            toast.error('Erro ao desativar o modo Picture-in-Picture');
          });
          
        return;
      }
      
      // Verificar se já está em modo PiP local
      if (document.pictureInPictureElement) {
        // Sair do modo PiP
        document.exitPictureInPicture()
          .then(() => {
            console.log('Saiu do PiP com sucesso');
            onPipModeChange(false);
            setIsPipMode(false);
            
            // Limpar recursos personalizados se estiverem ativos
            cleanupCustomPip();
          })
          .catch(e => {
            console.error('Erro ao sair do modo PiP:', e);
            toast.error('Erro ao desativar o modo Picture-in-Picture');
          });
      } else {
        // Método alternativo para PiP com Daily.co
        try {
          console.log('Iniciando PiP global');
          
          // Usar o elemento global se já existir
          let video;
          let canvas;
          
          if (window.globalPipVideo.element) {
            video = window.globalPipVideo.element;
            console.log('Reutilizando elemento de vídeo PiP global');
          } else {
            // Criar um elemento de vídeo PiP global
            video = document.createElement('video');
            video.id = 'global-pip-video';
            video.width = 640;
            video.height = 360;
            video.autoplay = true;
            
            // Fixar no documento raiz para persistir entre navegações
            document.body.appendChild(video);
            window.globalPipVideo.element = video;
          }
          
          // Guardar referência local também
          pipVideoRef.current = video;
          
          if (window.globalPipVideo.canvas) {
            canvas = window.globalPipVideo.canvas;
            console.log('Reutilizando canvas PiP global');
          } else {
            // Criar canvas global
            canvas = document.createElement('canvas');
            canvas.id = 'global-pip-canvas';
            canvas.width = 640;
            canvas.height = 360;
            document.body.appendChild(canvas);
            window.globalPipVideo.canvas = canvas;
          }
          
          // Guardar referência local
          canvasRef.current = canvas;
          
          // Obter o contexto e desenhar a mensagem
          const ctx = canvas.getContext('2d');
          
          // Preencher com fundo escuro
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Adicionar texto explicativo
          ctx.fillStyle = 'white';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Modo Picture-in-Picture ativo', canvas.width/2, canvas.height/2 - 40);
          
          ctx.font = '20px Arial';
          ctx.fillText('Sua chamada continua ativa', canvas.width/2, canvas.height/2 + 10);
          ctx.fillText('Para retornar, clique no botão X', canvas.width/2, canvas.height/2 + 50);
          
          // Adicionar logo ou identificação
          ctx.font = 'bold 18px Arial';
          ctx.fillText('TerapiaConect', canvas.width/2, canvas.height - 30);
          
          // Adicionar ID da sessão para identificação
          const sessionId = getSessionId() || roomName || 'sessão';
          window.globalPipVideo.sessionId = sessionId;
          ctx.font = '14px Arial';
          ctx.fillText(`Sessão: ${sessionId}`, canvas.width/2, canvas.height - 60);
          
          // Obter o stream do canvas
          const stream = canvas.captureStream();
          video.srcObject = stream;
          
          // Esconder o vídeo visualmente mas mantê-lo acessível
          video.style.position = 'fixed';
          video.style.top = '-1px';
          video.style.left = '-1px';
          video.style.opacity = '0.01'; // Quase invisível mas ainda presente
          video.style.pointerEvents = 'none';
          video.style.height = '1px';
          video.style.width = '1px';
          video.style.zIndex = '-1';
          
          // Esconder o canvas mas mantê-lo no DOM
          canvas.style.position = 'fixed';
          canvas.style.top = '-1px';
          canvas.style.left = '-1px';
          canvas.style.opacity = '0';
          canvas.style.pointerEvents = 'none';
          canvas.style.height = '1px';
          canvas.style.width = '1px';
          canvas.style.zIndex = '-1';
          
          // Iniciar PiP após o vídeo estar pronto
          video.onloadedmetadata = () => {
            // Iniciar o PiP
            video.requestPictureInPicture()
              .then(() => {
                console.log('PiP global ativado com sucesso');
                onPipModeChange(true);
                setIsPipMode(true);
                
                // Marcar como ativo globalmente
                window.globalPipVideo.active = true;
                
                // Adicionar evento para quando o usuário fechar o PiP
                video.addEventListener('leavepictureinpicture', () => {
                  console.log('Usuário saiu do modo PiP global');
                  onPipModeChange(false);
                  setIsPipMode(false);
                  window.globalPipVideo.active = false;
                }, { once: true });
                
                // Notificar o usuário
                toast.success('Picture-in-Picture ativado com sucesso');
              })
              .catch(e => {
                console.error('Erro ao ativar PiP global:', e);
                toast.error('Não foi possível ativar o Picture-in-Picture');
                window.globalPipVideo.active = false;
              });
          };
          
          // Adicionar timeout caso o evento onloadedmetadata não dispare
          setTimeout(() => {
            if (pipVideoRef.current && !document.pictureInPictureElement) {
              try {
                pipVideoRef.current.requestPictureInPicture()
                  .then(() => {
                    console.log('PiP global ativado com sucesso (via timeout)');
                    onPipModeChange(true);
                    setIsPipMode(true);
                    window.globalPipVideo.active = true;
                  })
                  .catch(e => {
                    console.error('Erro ao ativar PiP global (via timeout):', e);
                    window.globalPipVideo.active = false;
                  });
              } catch(e) {
                console.error('Exceção ao tentar PiP global via timeout:', e);
                window.globalPipVideo.active = false;
              }
            }
          }, 1000);
          
        } catch (e) {
          console.error('Erro ao iniciar PiP global:', e);
          toast.error('Não foi possível ativar o modo Picture-in-Picture');
          window.globalPipVideo.active = false;
        }
      }
    } catch (e) {
      console.error('Erro ao manipular Picture-in-Picture global:', e);
      toast.error('Erro ao usar o Picture-in-Picture');
      if (window.globalPipVideo) {
        window.globalPipVideo.active = false;
      }
    }
  }, [onPipModeChange, cleanupCustomPip, getSessionId, roomName]);
  
  // Função para preparar o modo PiP personalizado
  const prepareCustomPip = useCallback(() => {
    try {
      // Primeiro verifica se já existe um canvas
      if (!canvasRef.current) {
        // Criar um canvas para capturar o conteúdo do iframe
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        canvasRef.current = canvas;
      }

      // Criar um elemento de vídeo se não existir
      if (!pipVideoRef.current) {
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.style.display = 'none';
        video.width = 640;
        video.height = 360;
        document.body.appendChild(video);
        pipVideoRef.current = video;
      }

      // Iniciar a captura do conteúdo do iframe
      const captureFrame = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        try {
          // Tenta desenhar o iframe no canvas
          ctx.drawImage(dailyFrameRef.current, 0, 0, canvas.width, canvas.height);
          
          // Atualiza o vídeo com o conteúdo do canvas
          if (pipVideoRef.current.srcObject === null) {
            const stream = canvas.captureStream(30); // 30 FPS
            pipVideoRef.current.srcObject = stream;
          }
        } catch (e) {
          console.log('Erro ao capturar frame:', e);
        }
      };

      // Iniciar captura a cada 100ms
      if (!captureIntervalRef.current) {
        captureIntervalRef.current = setInterval(captureFrame, 100);
      }

      return true;
    } catch (e) {
      console.error('Erro ao preparar PiP personalizado:', e);
      return false;
    }
  }, []);
  
  // Verificar se já existe um elemento PiP global
  useEffect(() => {
    // Verificar se o PiP global já existe
    if (!window.globalPipVideo) {
      // Criar elemento global para PiP para permitir uso multi-janela
      window.globalPipVideo = {
        element: null,
        canvas: null,
        interval: null,
        active: false,
        sessionId: null
      };
      
      // Adicionar método global para verificar estado
      window.isPipActive = () => window.globalPipVideo?.active || false;
      
      // Adicionar método global para sair do PiP
      window.exitPip = () => {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(e => 
            console.error('Erro ao sair do PiP globalmente:', e)
          );
        }
      };
    }
    
    // Configurar escuta para eventos do PiP
    const handlePipChange = (event) => {
      if (event.target === pipVideoRef.current || 
          event.target === window.globalPipVideo?.element) {
        console.log('Estado do PiP alterado via evento:', event.type);
        
        // Atualizar estado
        if (event.type === 'enterpictureinpicture') {
          setIsPipMode(true);
          onPipModeChange(true);
          if (window.globalPipVideo) window.globalPipVideo.active = true;
          
          // Disparar evento global
          window.dispatchEvent(new CustomEvent('pip-mode-changed', { 
            detail: { active: true, sessionId: window.globalPipVideo?.sessionId } 
          }));
        } else {
          setIsPipMode(false);
          onPipModeChange(false);
          if (window.globalPipVideo) window.globalPipVideo.active = false;
          
          // Disparar evento global
          window.dispatchEvent(new CustomEvent('pip-mode-changed', { 
            detail: { active: false, sessionId: window.globalPipVideo?.sessionId } 
          }));
        }
      }
    };
    
    // Adicionar listeners para eventos PiP
    document.addEventListener('enterpictureinpicture', handlePipChange);
    document.addEventListener('leavepictureinpicture', handlePipChange);
    
    return () => {
      // Remover listeners
      document.removeEventListener('enterpictureinpicture', handlePipChange);
      document.removeEventListener('leavepictureinpicture', handlePipChange);
      
      // Ao desmontar, manter o PiP se estiver ativo
      if (document.pictureInPictureElement && 
         (document.pictureInPictureElement === pipVideoRef.current || 
          document.pictureInPictureElement === window.globalPipVideo?.element)) {
        // Não fechar o PiP ao desmontar para permitir uso entre componentes
        console.log('Mantendo PiP ativo durante navegação');
      } else {
        // Se não estiver em modo PiP, limpar recursos
        cleanupCustomPip();
      }
    };
  }, [onPipModeChange, cleanupCustomPip]);
  
  // Limpar recursos quando o componente desmontar
  useEffect(() => {
    return () => {
      cleanupCustomPip();
    };
  }, [cleanupCustomPip]);
  
  // ========== LIFECYCLE MANAGEMENT ==========
  // Usar o resetTranscriptionServices no primeiro useEffect de montagem
  useEffect(() => {
    console.log('FallbackMeeting montado');
    isMountedRef.current = true;
    
    // Registrar na window para depuração (se necessário)
    // window.resetTranscriptionServices = resetTranscriptionServices;
    
    // Limpar ao desmontar
    return () => {
      console.log('FallbackMeeting desmontado');
      isMountedRef.current = false;
      
      // Remover da window
      // delete window.resetTranscriptionServices;
    };
  }, []);
  
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
  
  // ========== DAILY ROOM SETUP ==========
  const initDailyRoom = useCallback(() => {
    try {
      // Verificar se o componente ainda está montado
      if (!isMountedRef.current) {
        console.log("Tentativa de inicializar sala quando o componente já foi desmontado");
        return;
      }
      
      // Verificar se a URL é válida
      if (!roomUrl) {
        const errMsg = 'URL da sala inválida ou ausente. Aguardando criação da sala...';
        console.log(errMsg);
        setError(errMsg);
        setIsLoading(true);
        return;
      }
      
      // Verificar se temos detalhes da sessão
      if (!sessionDetails) {
        console.log("Aguardando obtenção dos detalhes da sessão do backend");
        setIsLoading(true);
        return;
      }
      
      // Verificar se a URL está duplicada (contém "https://" mais de uma vez)
      let validatedUrl = roomUrl;
      if ((roomUrl.match(/https:\/\//g) || []).length > 1) {
        console.error("URL duplicada detectada:", roomUrl);
        
        // Extrair a última parte da URL que contém "https://"
        const parts = roomUrl.split('https://');
        if (parts.length > 2) {
          validatedUrl = `https://${parts[parts.length - 1]}`;
          console.log("URL corrigida (duplicação):", validatedUrl);
        }
      }
      
      // Verificar se a URL contém "tc-" e remover
      if (validatedUrl.includes('/tc-')) {
        console.warn("URL com prefixo tc- detectada:", validatedUrl);
        validatedUrl = validatedUrl.replace('/tc-', '/');
        console.log("URL corrigida (prefixo tc-):", validatedUrl);
      }
      
      // Verificar se a URL contém o domínio errado e corrigir
      if (validatedUrl.includes('terapiaconect.daily.co')) {
        console.warn("URL com domínio incorreto detectada:", validatedUrl);
        validatedUrl = validatedUrl.replace('terapiaconect.daily.co', 'teraconect.daily.co');
        console.log("URL corrigida (domínio):", validatedUrl);
      }
      
      // Exibir URL da sala sendo usada para debug
      console.log('Inicializando Daily.co com URL:', validatedUrl);
      
      // Função para limpar todas as instâncias do Daily.co de forma completa
      const cleanupAllDailyInstances = async () => {
        console.log("Limpando TODAS as instâncias do Daily.co antes de criar nova...");
        
        try {
          // 1. Usar a API do DailyIframe para limpar instâncias
          if (typeof DailyIframe.destroyAllInstances === 'function') {
            await DailyIframe.destroyAllInstances();
            console.log("DailyIframe.destroyAllInstances() executado com sucesso");
          }
          
          // 2. Limpar a instância global se existir
          if (window.dailyFrame) {
            try {
              window.dailyFrame.destroy();
              console.log("window.dailyFrame destruído com sucesso");
            } catch (e) {
              console.warn("Erro ao destruir window.dailyFrame:", e);
            }
            window.dailyFrame = null;
          }
          
          // 3. Limpar a instância no ref
          if (dailyFrameRef.current) {
            try {
              dailyFrameRef.current.destroy();
              console.log("dailyFrameRef.current destruído com sucesso");
            } catch (e) {
              console.warn("Erro ao destruir dailyFrameRef.current:", e);
            }
            dailyFrameRef.current = null;
          }
          
          // 4. Remover todos os iframes do DOM
          const iframes = document.querySelectorAll('iframe[allow*="camera"]');
          if (iframes.length > 0) {
            console.log(`Removendo ${iframes.length} iframes do DOM`);
            iframes.forEach(iframe => {
              try {
                if (iframe.parentNode) {
                  iframe.parentNode.removeChild(iframe);
                }
              } catch (e) {
                console.warn("Erro ao remover iframe:", e);
              }
            });
          }
          
          // 5. Resetar o sistema de locks
          if (window.dailyInstanceLock) {
            window.dailyInstanceLock.isLocked = false;
            window.dailyInstanceLock.lockId = null;
            console.log("Sistema de locks resetado");
          }
          
          // 6. Limpar container
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            console.log("Container limpo");
          }
          
          // 7. Aguardar um momento para garantir que tudo foi limpo
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log("Limpeza completa de instâncias do Daily.co concluída");
          
          return true;
        } catch (error) {
          console.error("Erro durante limpeza de instâncias do Daily.co:", error);
          return false;
        }
      };
      
      // Verificar se o container existe - usar diferentes estratégias para encontrá-lo
      const ensureContainerExists = () => {
        if (!containerRef.current) {
          console.log("Container não disponível, tentando alternativas");
          
          // Tentativa 1: Encontrar pelo ID
          let foundContainer = document.getElementById('daily-container');
          
          // Tentativa 2: Criar um novo container se o videoContainerRef estiver disponível
          if (!foundContainer && videoContainerRef.current) {
            console.log("Criando container dinamicamente dentro do videoContainer");
            const newContainer = document.createElement('div');
            newContainer.id = 'daily-container-dynamic';
            newContainer.style.width = '100%';
            newContainer.style.height = '100%';
            newContainer.style.position = 'relative';
            
            // Limpar antes de adicionar
            videoContainerRef.current.innerHTML = '';
            videoContainerRef.current.appendChild(newContainer);
            foundContainer = newContainer;
          }
          
          // Tentativa 3: Usar o próprio videoContainerRef se tudo falhar
          if (!foundContainer && videoContainerRef.current) {
            console.log("Usando videoContainerRef como último recurso");
            foundContainer = videoContainerRef.current;
          }
          
          // Se ainda não tiver encontrado, reportar erro
          if (!foundContainer) {
            throw new Error("Container para o iframe não encontrado após múltiplas tentativas");
          }
          
          // Usar o container encontrado
          containerRef.current = foundContainer;
          console.log("Container alternativo encontrado/criado:", foundContainer);
        }
        
        // Limpar o container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        
        // Verificar se está no DOM
        const containerInDOM = document.body.contains(containerRef.current);
        if (!containerInDOM) {
          throw new Error("Container existe mas não está no DOM");
        }
        
        return containerRef.current;
      };
      
      // Função principal para criar a chamada do Daily.co
      const createDailyCall = async () => {
        try {
          // Mostrar loading
          setIsLoading(true);
          
          // 1. Limpar todas as instâncias anteriores
          await cleanupAllDailyInstances();
          
          // Verificar se o componente ainda está montado após a limpeza
          if (!isMountedRef.current) {
            console.log("Componente desmontado durante limpeza, abortando");
            return;
          }
          
          // 2. Garantir que o container existe e está pronto
          const container = ensureContainerExists();
          
          // 3. Gerar ID único para este componente
          const instanceId = `daily-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          container.dailyLockId = instanceId;
          
          // 4. Adquirir lock
          if (!window.dailyInstanceLock.acquireLock(instanceId)) {
            console.warn("Não foi possível adquirir lock para criar DailyIframe");
            setError("Outro componente de vídeo já está em uso. Aguarde um momento.");
            setIsLoading(false);
            
            // Tentar novamente após delay
            setTimeout(() => {
              if (isMountedRef.current) {
                console.log("Tentando novamente após falha na aquisição do lock");
                initDailyRoom();
              }
            }, 2000);
            
            return;
          }
          
          // 5. Verificar se o modo flutuante está ativado
          if (!floating) {
            try {
              // 6. Configurar opções
              const options = {
                url: validatedUrl,
                showLeaveButton: true,
                showFullscreenButton: true,
                iframeStyle: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }
              };
              
              console.log('Criando Daily.co call com opções:', options);
              
              // 7. Criar o frame
              console.log("Iniciando criação do frame Daily.co");
              const frame = DailyIframe.createFrame(container, options);
              
              // 8. Configurar handlers
              frame.on('error', (e) => {
                console.error('Erro do Daily.co:', e);
                
                // Verificar se é um erro de sala não disponível
                if (e && (
                    e.errorMsg === 'This room is no longer available' || 
                    e.errorMsg === 'The meeting you\'re trying to join does not exist' ||
                    e.errorMsg?.includes('does not exist')
                )) {
                  console.log('Sala não disponível, tentando recriar...');
                  
                  // Limpar estado da sessão atual
                  setSessionDetails(null);
                  
                  // Extrair apenas a parte simples do ID (sem "tc-")
                  const sessionId = getSessionId();
                  const simplifiedId = sessionId.startsWith('tc-') ? sessionId.substring(3) : sessionId;
                  
                  // Gerar um nome de sala simples e curto baseado em timestamp
                  const timestamp = Date.now().toString().slice(-6);
                  const simpleRoomName = `room${timestamp}`;
                  
                  // Log claro mostrando o que estamos fazendo
                  console.log('⭐️ Criando nova sala com nome simplificado:', simpleRoomName, 'em vez de UUID longo:', simplifiedId);
                  
                  // Usar o serviço de criação de sala com nome simples
                  try {
                    createMeeting(simpleRoomName).then(roomDetails => {
                      if (roomDetails) {
                        console.log('✅ Sala recriada com sucesso:', roomDetails);
                        
                        // Usar a URL exatamente como retornada pelo backend
                        const cleanedUrl = roomDetails.url || '';
                        
                        console.log('🔗 URL para reconexão:', cleanedUrl);
                        
                        // Atualizar sessionDetails com a sala recriada
                        setSessionDetails({
                          ...roomDetails,
                          url: cleanedUrl
                        });
                        
                        // Notificar usuário
                        toast.success('Sala recriada com sucesso, reconectando...');
                        
                        // Recarregar após delay
                        setTimeout(() => {
                          if (isMountedRef.current) {
                            // Liberar o lock para poder adquiri-lo novamente
                            window.dailyInstanceLock.releaseLock(instanceId);
                            
                            // Iniciar novamente
                            initDailyRoom();
                          }
                        }, 1000);
                      }
                    }).catch(err => {
                      console.error('❌ Falha ao recriar sala:', err);
                      handleError(`Não foi possível criar nova sala: ${err.message || 'Erro desconhecido'}`);
                    });
                  } catch (recreateError) {
                    console.error('❌ Exceção ao tentar recriar sala:', recreateError);
                    handleError(recreateError);
                  }
                }
                
                // Verificar se é erro de token inválido
                if (e && (
                    e.errorMsg?.includes('token') || 
                    e.errorMsg?.includes('unauthorized') ||
                    e.errorMsg?.includes('permission')
                )) {
                  console.log('Erro de autorização, solicitando novo token...');
                  
                  // Solicitar novo token/sala
                  fetchRoomUrlFromBackend().then(roomDetails => {
                    if (roomDetails) {
                      setSessionDetails({
                        ...roomDetails,
                        url: cleanRoomUrl(roomDetails.url)
                      });
                      
                      toast.info('Atualizando credenciais, reconectando...');
                      
                      // Tentar novamente após obter novo token
                      setTimeout(() => {
                        if (isMountedRef.current) {
                          window.dailyInstanceLock.releaseLock(instanceId);
                          initDailyRoom();
                        }
                      }, 1000);
                    }
                  });
                  
                  return;
                }
                
                // Verificar se é erro de conexão
                if (e && (
                    e.errorMsg?.includes('connection') ||
                    e.errorMsg?.includes('network') ||
                    e.errorMsg?.includes('timeout')
                )) {
                  console.log('Erro de conexão, tentando reconectar...');
                  
                  // Notificar usuário
                  toast.warning('Problema de conexão detectado, tentando reconectar...');
                  
                  // Tentar novamente após um delay
                  setTimeout(() => {
                    if (isMountedRef.current) {
                      window.dailyInstanceLock.releaseLock(instanceId);
                      initDailyRoom();
                    }
                  }, 3000);
                  
                  return;
                }
                
                // Para outros tipos de erro, exibir mensagem detalhada
                let errorMsg = e.errorMsg || 'Erro ao conectar à sala de vídeo';
                if (e.info) {
                  try {
                    const infoStr = typeof e.info === 'string' ? e.info : JSON.stringify(e.info);
                    errorMsg += ` (${infoStr})`;
                  } catch (err) {
                    console.warn('Erro ao converter detalhes adicionais:', err);
                  }
                }
                
                // Exibir detalhes completos no console
                console.error('Detalhes completos do erro Daily.co:', {
                  errorMsg: e.errorMsg,
                  info: e.info,
                  type: e.type,
                  callState: frame?.callState?.state || 'unknown',
                  fullError: e
                });
                
                handleError(e);
                
                // Liberar o lock em caso de erro
                window.dailyInstanceLock.releaseLock(instanceId);
              });
              
              // Handler para saída da chamada
              frame.on('left-meeting', () => {
                console.log("Usuário saiu da chamada");
                
                // Liberar o lock quando o usuário sair da chamada
                window.dailyInstanceLock.releaseLock(instanceId);
              });
              
              // 9. Entrar na sala
              try {
                await frame.join();
                console.log("Conectado com sucesso à sala");
                
                // 10. Registrar o frame globalmente e no ref
                window.dailyFrame = frame;
                dailyFrameRef.current = frame;
                
                // 11. Atualizar estado
                setIsCallActive(true);
                setIsLoading(false);
              } catch (joinError) {
                console.error("Erro ao conectar à sala:", joinError);
                
                // Tentar extrair o máximo de informações do erro
                let errorMessage = joinError.message || "Erro desconhecido";
                
                // Verificar se temos objeto de erro com mais detalhes
                if (typeof joinError === 'object') {
                  const detalhes = [];
                  
                  // Tentar extrair propriedades comuns de erro
                  if (joinError.errorMsg) detalhes.push(joinError.errorMsg);
                  if (joinError.error) {
                    if (typeof joinError.error === 'string') {
                      detalhes.push(joinError.error);
                    } else if (typeof joinError.error === 'object') {
                      try {
                        detalhes.push(JSON.stringify(joinError.error));
                      } catch (e) {
                        detalhes.push('Erro estruturado não serializável');
                      }
                    }
                  }
                  if (joinError.info) {
                    if (typeof joinError.info === 'string') {
                      detalhes.push(joinError.info);
                    } else {
                      try {
                        detalhes.push(JSON.stringify(joinError.info));
                      } catch (e) {
                        // Ignorar erro de serializarão
                      }
                    }
                  }
                  if (joinError.status) detalhes.push(`Status: ${joinError.status}`);
                  if (joinError.code) detalhes.push(`Código: ${joinError.code}`);
                  
                  // Se temos detalhes, construir mensagem rica
                  if (detalhes.length > 0) {
                    errorMessage = `Erro ao conectar: ${detalhes.join(' | ')}`;
                  } else {
                    // Tentar serializar o objeto inteiro
                    try {
                      errorMessage = `Erro ao conectar: ${JSON.stringify(joinError)}`;
                    } catch (e) {
                      // Manter mensagem original se não conseguir serializar
                    }
                  }
                }
                
                // Logar erro completo para depuração
                console.warn("Detalhes técnicos do erro de join():", {
                  error: joinError,
                  url: validatedUrl,
                  options: options,
                  container: container ? container.id : 'container não disponível',
                  dailyVersion: DailyIframe.version || 'desconhecida'
                });
                
                // Tratar erro de forma mais legível
                handleError(errorMessage);
                
                // Liberar o lock em caso de erro
                window.dailyInstanceLock.releaseLock(instanceId);
              }
            } catch (frameError) {
              console.error("Erro ao criar Daily frame:", frameError);
              handleError(`Erro ao criar videoconferência: ${frameError.message || 'Falha desconhecida'}`);
              setIsLoading(false);
              
              // Liberar o lock em caso de erro
              window.dailyInstanceLock.releaseLock(instanceId);
            }
          } else {
            console.log('Modo flutuante ativado, não injetando iframe');
            setIsLoading(false);
            
            // Liberar o lock já que não vamos usar
            window.dailyInstanceLock.releaseLock(instanceId);
          }
        } catch (error) {
          console.error('Erro ao criar Daily call:', error);
          handleError(error);
          setIsLoading(false);
          
          // Liberar o lock em caso de erro não capturado
          if (containerRef.current && containerRef.current.dailyLockId) {
            window.dailyInstanceLock.releaseLock(containerRef.current.dailyLockId);
          }
        }
      };
      
      // Iniciar o processo
      createDailyCall();
    } catch (error) {
      console.error('Erro ao inicializar Daily.co:', error);
      handleError(error);
      setIsLoading(false);
    }
  }, [roomUrl, floating, handleError, isMountedRef, containerRef, videoContainerRef, fetchRoomUrlFromBackend, cleanRoomUrl, sessionDetails]);
  
  // useEffect para gerenciar ciclo de vida
  useEffect(() => {
    // Verificar se o componente está montado
    if (!isMountedRef.current) return;
    
    console.log("useEffect para inicialização está executando");
    
    // Garantir que o componente não seja inicializado prematuramente
    if (!sessionDetails || !roomUrl) {
      console.log("Aguardando URL da sala ser definida", { 
        hasSessionDetails: !!sessionDetails, 
        sessionUrl: sessionDetails?.url,
        hasRoomUrl: !!roomUrl,
        roomUrl
      });
      return;
    }
    
    // Aguardar um pequeno delay para garantir que o DOM foi renderizado
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        console.log("Iniciando sala após delay", containerRef?.current ? "container existe" : "container não existe");
        
        // Verificar se o container existe, se não, criar um
        if (!containerRef.current && videoContainerRef.current) {
          console.log("Container não encontrado, criando dinamicamente");
          const newContainer = document.createElement('div');
          newContainer.id = 'daily-container';
          newContainer.style.width = '100%';
          newContainer.style.height = '100%';
          newContainer.style.position = 'relative';
          
          // Limpar antes de adicionar novo elemento
          if (videoContainerRef.current.querySelector('#daily-container')) {
            videoContainerRef.current.querySelector('#daily-container').remove();
          }
          
          // Adicionar ao videoContainer
          videoContainerRef.current.appendChild(newContainer);
          
          // Atualizar a referência
          containerRef.current = newContainer;
        }
        
        // Inicializar sala
        initDailyRoom();
      }
    }, 500);
    
    // Cleanup ao desmontar
    return () => {
      console.log("Desmontando FallbackMeeting, realizando cleanup");
      clearTimeout(timer);
      isMountedRef.current = false;
      
      // Liberar o lock se existir
      if (containerRef.current && containerRef.current.dailyLockId) {
        if (window.dailyInstanceLock) {
          window.dailyInstanceLock.releaseLock(containerRef.current.dailyLockId);
          console.log("Lock liberado durante desmontagem do componente");
        }
      }
      
      // Encontrar e destruir todos os iframes do Daily
      const dailyIframes = document.querySelectorAll('iframe[allow*="camera"][allow*="microphone"]');
      if (dailyIframes.length > 0) {
        console.log(`Encontrados ${dailyIframes.length} iframes do Daily, removendo todos`);
        dailyIframes.forEach(iframe => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        });
      }
      
      // Fechar a sala e limpar com segurança
      if (dailyFrameRef.current) {
        try {
          dailyFrameRef.current.destroy();
          console.log("Daily frame destruído com sucesso");
        } catch (e) {
          console.warn("Erro ao destruir frame:", e);
        } finally {
          dailyFrameRef.current = null;
        }
      }
      
      // Limpar a referência global
      if (window.dailyFrame) {
        try {
          window.dailyFrame.destroy();
        } catch (e) {
          console.warn("Erro ao destruir frame global:", e);
        } finally {
          window.dailyFrame = null;
        }
      }
      
      // Tentar garantir que DailyIframe não mantenha nenhuma referência interna
      try {
        if (typeof DailyIframe !== 'undefined' && DailyIframe.destroyFrame) {
          DailyIframe.destroyFrame();
        }
      } catch (e) {
        console.warn("Erro ao chamar DailyIframe.destroyFrame:", e);
      }
      
      // Fechar janela flutuante se estiver aberta
      closeFloatingWindow();
    };
  }, [initDailyRoom, closeFloatingWindow, sessionDetails, roomUrl]);
  
  // Adicionar um listener para limpar o frame quando o usuário navega para outra página
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("Navegando para outra página, limpando recursos do Daily.co");
      if (window.dailyFrame) {
        try {
          window.dailyFrame.destroy();
        } catch (e) {
          console.warn("Erro ao destruir frame durante navegação:", e);
        }
        window.dailyFrame = null;
      }
      
      // Resetar todo o sistema de locks
      if (window.dailyInstanceLock) {
        window.dailyInstanceLock.isLocked = false;
        window.dailyInstanceLock.lockId = null;
        console.log("Sistema de locks resetado durante navegação");
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // ========== UI COMPONENTS ==========
  // Componente de seletor de modo de transcrição
  // Removido para AIComponents.jsx
  
  // Componente de botões de IA
  // Removido para AIComponents.jsx
  
  // Componente para status de transcrição
  // Removido para AIComponents.jsx
  
  // ========== RENDER ==========
  return (
    <div className={`fallback-meeting-container ${floating ? 'floating' : ''}`}>
      <VideoErrorBoundary>
        <div
          ref={videoContainerRef}
          className={`video-container ${isVideoEnabled ? 'video-active' : 'video-inactive'}`}
        >
          {/* Componente para gerenciar a janela flutuante */}
          <FloatingWindowManager 
            url={(sessionDetails?.url || roomUrl || '')}
            sessionId={getSessionId() || ''}
            isOpen={isFloatingWindowVisible && !floating && !!(sessionDetails?.url || roomUrl)}
            onClose={closeFloatingWindow}
            width={480}
            height={320}
          />
          
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontFamily: 'sans-serif',
              zIndex: 5
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
              fontFamily: 'sans-serif',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '80%',
              zIndex: 10
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#ff6b6b' }}>Problema na conexão</h3>
              <div style={{ marginBottom: '15px' }}>{error}</div>
              
              {errorDetails && (
                <details style={{ fontSize: '12px', marginTop: '15px', textAlign: 'left', cursor: 'pointer' }}>
                  <summary style={{ marginBottom: '5px' }}>Detalhes técnicos (para suporte)</summary>
                  <pre style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    padding: '10px', 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#aaa'
                  }}>
                    {errorDetails}
                  </pre>
                </details>
              )}
              
              <div style={{ fontSize: '12px', marginTop: '15px', opacity: 0.8 }}>
                Domínio usado: <strong>teraconect.daily.co</strong>
                <br />
                ID da sessão: <strong>{getSessionId() || roomName || 'N/D'}</strong>
              </div>
              
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button 
                  onClick={initDailyRoom}
                  style={{
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
                
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Recarregar Página
                </button>
              </div>
            </div>
          )}
          
          {/* Container para o Daily.co - sempre presente independente do loading */}
          <div 
            ref={containerRef} 
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              display: isLoading || error ? 'none' : 'block'
            }}
            id="daily-container"
          />
          
          {/* Apenas um único botão para abrir janela separada */}
          {!floating && isVideoEnabled && (
            <button 
              onClick={openFloatingWindow}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 15px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 9999,
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                animation: 'pulse-blue 2s infinite'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#3367d6';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#4285f4';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 19H5V5H12V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V12H19V19ZM14 3V5H17.59L7.76 14.83L9.17 16.24L19 6.41V10H21V3H14Z" fill="white"/>
              </svg>
              Abrir Sessão em Nova Janela
            </button>
          )}
        </div>
      </VideoErrorBoundary>
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