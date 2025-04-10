﻿import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import './FallbackMeeting.css';
import config from '../environments';
import axios from 'axios';

// API Key do Daily.co
const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;

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
    console.log('Daily.co iframe carregando: ' + roomUrl);
    if (iframeRef.current) {
      iframeRef.current.setAttribute('allow', 'camera; microphone; fullscreen; speaker; display-capture');
      onLoad && onLoad(iframeRef.current);
    }
  }, [roomUrl, onLoad]);
  
  return (
    <iframe
      title="Daily.co Meeting"
      ref={iframeRef}
      id="daily-iframe"
      className="daily-iframe"
      src={roomUrl}
      allow="camera; microphone; fullscreen; speaker; display-capture"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: '#1a1a1a',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
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
  const videoContainerRef = useRef(null);
  const dailyFrameRef = useRef(null);
  
  // ========== STATE HOOKS ==========
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPipMode, setIsPipMode] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(videoEnabled);
  
  // Função para verificar/criar sala no Daily.co
  const ensureRoomExists = useCallback(async (roomId) => {
    if (!DAILY_API_KEY) {
      console.warn('Daily API Key não encontrada nas variáveis de ambiente');
      // Se não temos API key, apenas retornamos a URL direta
      return `https://teraconect.daily.co/${roomId}`;
    }
    
    try {
      console.log('Verificando/criando sala Daily.co:', roomId);
      
      // Primeiro tentar obter a sala existente
      try {
        const checkResponse = await fetch(`https://api.daily.co/v1/rooms/${roomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DAILY_API_KEY}`
          }
        });
        
        if (checkResponse.ok) {
          const data = await checkResponse.json();
          console.log('Sala existente encontrada:', data);
          return `https://teraconect.daily.co/${roomId}`;
        }
      } catch (checkError) {
        console.log('Sala não encontrada, criando nova:', checkError);
      }
      
      // Se chegou aqui, a sala não existe ou houve erro ao verificar
      // Criamos uma nova sala
      const createResponse = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DAILY_API_KEY}`
        },
        body: JSON.stringify({
          name: roomId,
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: !videoEnabled,
            start_audio_off: !audioEnabled,
            exp: Math.floor(Date.now() / 1000) + 3600 // 1 hora de expiração
          }
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Erro ao criar sala: ${createResponse.status}`);
      }
      
      const data = await createResponse.json();
      console.log('Sala criada com sucesso:', data);
      
      return `https://teraconect.daily.co/${roomId}`;
    } catch (error) {
      console.error('Erro ao verificar/criar sala Daily.co:', error);
      // Em caso de erro, retornar URL direta como fallback
      return `https://teraconect.daily.co/${roomId}`;
    }
  }, [audioEnabled, videoEnabled]);
  
  // Função para obter a URL da sala
  const getRoomUrl = useCallback(async () => {
    // Limpar o roomName para garantir compatibilidade
    const cleanRoomName = roomName.replace(/[^a-zA-Z0-9-_]/g, '');
    console.log('Room name limpo para Daily.co:', cleanRoomName);
    
    // Verificar/criar sala no Daily.co
    const baseUrl = await ensureRoomExists(cleanRoomName);
    
    // Construir parâmetros da URL simplificados
    const params = new URLSearchParams();
    
    // Adicionar nome do usuário se disponível
    if (userName) {
      params.append('name', userName);
    }
    
    // Configurações básicas
    params.append('showLeaveButton', 'true');
    params.append('showFullscreenButton', 'true');
    
    // Áudio e vídeo
    params.append('startAudioOff', !audioEnabled);
    params.append('startVideoOff', !videoEnabled);
    
    // Construir URL final
    const finalUrl = `${baseUrl}?${params.toString()}`;
    console.log('URL final da sala:', finalUrl);
    
    return finalUrl;
  }, [roomName, userName, audioEnabled, videoEnabled, ensureRoomExists]);

  // Carregar dados da sessão e inicializar a chamada
  useEffect(() => {
    const startSession = async () => {
      try {
        setIsLoading(true);
        
        // Obter URL da sala com verificação/criação
        const roomUrl = await getRoomUrl();
        
        // Configurar detalhes da sessão
        setSessionDetails({
          url: roomUrl,
          roomName,
          userName
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao inicializar sessão:', err);
        setError('Não foi possível inicializar a sessão de vídeo. Por favor, recarregue a página.');
        setIsLoading(false);
      }
    };
    
    startSession();
  }, [roomName, userName, getRoomUrl]);
  
  // Callback quando o iframe é carregado
  const handleIframeLoad = useCallback((iframeElement) => {
    console.log('Daily iframe carregado com sucesso');
    dailyFrameRef.current = iframeElement;
    setIsVideoEnabled(true);
    setIsLoading(false);
    
    // Adicionar classe para indicar que o iframe está carregado
    if (iframeElement) {
      iframeElement.classList.add('loaded');
    }
  }, []);

  // PIP e controles de tela
  const handlePipClick = useCallback(() => {
    if (!videoContainerRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
        onPipModeChange(false);
        setIsPipMode(false);
      } else {
        const video = videoContainerRef.current.querySelector('video');
        if (video) {
          video.requestPictureInPicture()
            .then(() => {
              setIsPipMode(true);
              onPipModeChange(true);
            })
            .catch(e => {
              console.error('Erro ao ativar PiP:', e);
            });
        } else {
          console.error('Nenhum elemento de vídeo encontrado para PiP');
        }
        }
      } catch (e) {
      console.error('Erro ao alternar modo PiP:', e);
      }
  }, [onPipModeChange]);
  
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
  // Renderizar durante carregamento
  if (isLoading) {
  return (
      <div className="fallback-loading">
        <div className="loading-spinner"></div>
        <p>Carregando videoconferência...</p>
            </div>
    );
  }

  // Renderizar em caso de erro
  if (error) {
    return (
      <div className="fallback-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
                Tentar Novamente
            </button>
        </div>
    );
  }

  // Renderizar a reunião
  return (
    <div className="fallback-meeting-container">
      <VideoErrorBoundary onReset={() => window.location.reload()}>
        <div className="video-container" ref={videoContainerRef}>
          {sessionDetails && (
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
