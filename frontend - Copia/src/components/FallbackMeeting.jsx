import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import './FallbackMeeting.css';
import config from '../environments';
import { useParams, useNavigate } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';

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
  const containerRef = useRef(null);
  
  // ========== STATE HOOKS ==========
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isPipMode, setIsPipMode] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(videoEnabled);
  
  // Refs para controle do PiP (Picture-in-Picture)
  const pipVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureIntervalRef = useRef(null);
  
  // ========== ERROR HANDLING ==========
  
  // Manipular erros
  const handleError = useCallback((errOrMessage) => {
    try {
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
  
  // ========== LIFECYCLE MANAGEMENT ==========
  useEffect(() => {
    console.log('FallbackMeeting montado');
    isMountedRef.current = true;
    
    return () => {
      console.log('FallbackMeeting desmontado');
      isMountedRef.current = false;
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
            setIsPipMode(true);
          })
          .catch(e => {
            console.error('Erro ao ativar PiP:', e);
            toast.error('Não foi possível ativar o modo Picture-in-Picture');
          });
      } else {
        // Sair do modo PiP
        document.exitPictureInPicture()
          .then(() => {
            console.log('Saiu do modo PiP');
            onPipModeChange(false);
            setIsPipMode(false);
          })
          .catch(e => {
            console.error('Erro ao sair do PiP:', e);
          });
      }
    } catch (e) {
      console.error('Erro ao manipular Picture-in-Picture:', e);
      toast.error('Erro ao usar o Picture-in-Picture');
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
      const sanitizedId = (sessionId || roomName || `room${Date.now().toString().slice(-6)}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .substring(0, 15);
      
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
  
  // Inicializar a sala ao montar
  useEffect(() => {
    if (isMountedRef.current) {
      initDailyRoom();
    }
  }, [initDailyRoom]);
  
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
  }, [getSessionId, roomName, userName]);
  
  // Adicionar CSS para os botões e a transcrição
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .daily-container {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .pip-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
  
  // ========== RENDER ==========
  return (
    <div className="meeting-root daily-container" style={{ width: '100%', height: '100%' }}>
      <VideoErrorBoundary onReset={initDailyRoom}>
        <div className="video-container daily-container" style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
          borderRadius: floating ? '8px' : '0'
        }}>
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
          
          {document.pictureInPictureEnabled && !floating && isVideoEnabled && (
            <button 
              onClick={handlePipClick}
              className="pip-button"
            >
              PiP
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
