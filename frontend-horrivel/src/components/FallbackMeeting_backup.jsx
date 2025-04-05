import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import hybridAIService from '../services/hybridAI.service';
import WhisperTranscriptionService from '../services/whisperTranscriptionService';
import AIResultsPanel from './AIResultsPanel';
import FloatingVideo from './FloatingVideo'; // Importar o componente FloatingVideo
import './FallbackMeeting.css';
import './AITools.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import config from '../environments';

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
  // Adicionar parâmetro pip=true à URL
  const pipEnabledUrl = roomUrl.includes('?') 
    ? `${roomUrl}&pip=true` 
    : `${roomUrl}?pip=true`;
  
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    console.log('Daily.co iframe carregando: ' + pipEnabledUrl);
  }, [pipEnabledUrl]);
  
  const handleIframeLoad = (ref) => {
    setIsLoaded(true);
    if (ref && onLoad) onLoad(ref);
  };
  
  return (
    <iframe
      title="Daily.co Meeting"
      ref={handleIframeLoad}
      id="daily-iframe"
      className={`daily-iframe ${isLoaded ? 'loaded' : ''}`}
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
  const [isFloatingWindowVisible, setIsFloatingWindowVisible] = useState(false);
  
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
    if (isFloatingWindowVisible) {
      // Se já estiver aberta, apenas focar nela
      console.log('Janela flutuante já está aberta');
      if (window.dailyPopupWindow && !window.dailyPopupWindow.closed) {
        window.dailyPopupWindow.focus();
      }
      return;
    }
    
    try {
      // Se estiver em modo PiP, sair dele primeiro
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(e => {
          console.error('Erro ao sair do PiP:', e);
        });
      }
      
      // Obter URL da sala
      const roomUrl = sessionDetails?.url;
      if (!roomUrl) {
        toast.error('URL da sala não disponível');
        return;
      }
      
      console.log('Abrindo janela flutuante para sessão:', getSessionId());
      
      // Configurar a janela popup
      const width = 400;
      const height = 300;
      const left = window.screen.width - width - 20;
      const top = window.screen.height - height - 60;
      
      // Configurar a URL com parâmetros específicos para o modo flutuante
      const popupUrl = roomUrl.includes('?') 
        ? `${roomUrl}&floating=true&showControls=minimal&layout=active` 
        : `${roomUrl}?floating=true&showControls=minimal&layout=active`;
      
      // Abrir uma janela popup real
      const popupWindow = window.open(
        popupUrl,
        'TerapiaConect_Video',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,menubar=no,toolbar=no`
      );
      
      // Guardar referência à janela para poder gerenciá-la depois
      window.dailyPopupWindow = popupWindow;
      
      if (popupWindow) {
        // Notificar sucesso
        setIsFloatingWindowVisible(true);
        setIsPipMode(true);
        onPipModeChange(true);
        toast.success('Janela flutuante ativada');
        
        // Configurar evento para quando o usuário fechar a janela
        const checkClosed = setInterval(() => {
          if (popupWindow.closed) {
            clearInterval(checkClosed);
            setIsFloatingWindowVisible(false);
            setIsPipMode(false);
            onPipModeChange(false);
            console.log('Janela flutuante fechada pelo usuário');
          }
        }, 1000);
      } else {
        // A janela foi bloqueada pelo navegador
        toast.error('Não foi possível abrir a janela flutuante. Verifique as configurações do seu navegador.');
      }
    } catch (e) {
      console.error('Erro ao abrir janela flutuante:', e);
      toast.error('Não foi possível abrir a janela flutuante');
    }
  }, [isFloatingWindowVisible, getSessionId, onPipModeChange, sessionDetails]);
  
  // Função para fechar a janela flutuante
  const closeFloatingWindow = useCallback(() => {
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import hybridAIService from '../services/hybridAI.service';
import WhisperTranscriptionService from '../services/whisperTranscriptionService';
import AIResultsPanel from './AIResultsPanel';
import FloatingVideo from './FloatingVideo'; // Importar o componente FloatingVideo
import './FallbackMeeting.css';
import './AITools.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import config from '../environments';

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
  // Adicionar parâmetro pip=true à URL
  const pipEnabledUrl = roomUrl.includes('?') 
    ? `${roomUrl}&pip=true` 
    : `${roomUrl}?pip=true`;
  
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    console.log('Daily.co iframe carregando: ' + pipEnabledUrl);
  }, [pipEnabledUrl]);
  
  const handleIframeLoad = (ref) => {
    setIsLoaded(true);
    if (ref && onLoad) onLoad(ref);
  };
  
  return (
    <iframe
      title="Daily.co Meeting"
      ref={handleIframeLoad}
      id="daily-iframe"
      className={`daily-iframe ${isLoaded ? 'loaded' : ''}`}
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
  const [isFloatingWindowVisible, setIsFloatingWindowVisible] = useState(false);
  
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
    if (isFloatingWindowVisible) {
      // Se já estiver aberta, apenas focar nela
      console.log('Janela flutuante já está aberta');
      if (window.dailyPopupWindow && !window.dailyPopupWindow.closed) {
        window.dailyPopupWindow.focus();
      }
      return;
    }
    
    try {
      // Se estiver em modo PiP, sair dele primeiro
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(e => {
          console.error('Erro ao sair do PiP:', e);
        });
      }
      
      // Obter URL da sala
      const roomUrl = sessionDetails?.url;
      if (!roomUrl) {
        toast.error('URL da sala não disponível');
        return;
      }
      
      console.log('Abrindo janela flutuante para sessão:', getSessionId());
      
      // Configurar a janela popup
      const width = 400;
      const height = 300;
      const left = window.screen.width - width - 20;
      const top = window.screen.height - height - 60;
      
      // Configurar a URL com parâmetros específicos para o modo flutuante
      const popupUrl = roomUrl.includes('?') 
        ? `${roomUrl}&floating=true&showControls=minimal&layout=active` 
        : `${roomUrl}?floating=true&showControls=minimal&layout=active`;
      
      // Abrir uma janela popup real
      const popupWindow = window.open(
        popupUrl,
        'TerapiaConect_Video',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,menubar=no,toolbar=no`
      );
      
      // Guardar referência à janela para poder gerenciá-la depois
      window.dailyPopupWindow = popupWindow;
      
      if (popupWindow) {
        // Notificar sucesso
        setIsFloatingWindowVisible(true);
        setIsPipMode(true);
        onPipModeChange(true);
        toast.success('Janela flutuante ativada');
        
        // Configurar evento para quando o usuário fechar a janela
        const checkClosed = setInterval(() => {
          if (popupWindow.closed) {
            clearInterval(checkClosed);
            setIsFloatingWindowVisible(false);
            setIsPipMode(false);
            onPipModeChange(false);
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import hybridAIService from '../services/hybridAI.service';
import WhisperTranscriptionService from '../services/whisperTranscriptionService';
import AIResultsPanel from './AIResultsPanel';
import FloatingVideo from './FloatingVideo'; // Importar o componente FloatingVideo
import './FallbackMeeting.css';
import './AITools.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import config from '../environments';

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
  // Adicionar parâmetro pip=true à URL
  const pipEnabledUrl = roomUrl.includes('?') 
    ? `${roomUrl}&pip=true` 
    : `${roomUrl}?pip=true`;
  
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    console.log('Daily.co iframe carregando: ' + pipEnabledUrl);
  }, [pipEnabledUrl]);
  
  const handleIframeLoad = (ref) => {
    setIsLoaded(true);
    if (ref && onLoad) onLoad(ref);
  };
  
  return (
    <iframe
      title="Daily.co Meeting"
      ref={handleIframeLoad}
      id="daily-iframe"
      className={`daily-iframe ${isLoaded ? 'loaded' : ''}`}
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
  const [isFloatingWindowVisible, setIsFloatingWindowVisible] = useState(false);
  
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
    if (isFloatingWindowVisible) {
      // Se já estiver aberta, apenas focar nela
      console.log('Janela flutuante já está aberta');
      return;
    }
    
    try {
      // Se estiver em modo PiP, sair dele primeiro
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(e => {
          console.error('Erro ao sair do PiP:', e);
        });
      }
      
      console.log('Abrindo janela flutuante para sessão:', getSessionId());
      setIsFloatingWindowVisible(true);
      setIsPipMode(true);
      onPipModeChange(true);
      toast.success('Janela flutuante ativada');
    } catch (e) {
      console.error('Erro ao abrir janela flutuante:', e);
      toast.error('Não foi possível abrir a janela flutuante');
    }
  }, [isFloatingWindowVisible, getSessionId, onPipModeChange]);
  
  // Função para fechar a janela flutuante
  const closeFloatingWindow = useCallback(() => {
    if (!isFloatingWindowVisible) return;
    
    try {
      console.log('Fechando janela flutuante');
      setIsFloatingWindowVisible(false);
      setIsPipMode(false);
      onPipModeChange(false);
      toast.info('Janela flutuante fechada');
    } catch (e) {
      console.error('Erro ao fechar janela flutuante:', e);
    }
  }, [isFloatingWindowVisible, onPipModeChange]);
  
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
  
  // Inicializar a sala ao montar
  useEffect(() => {
    if (isMountedRef.current) {
      initDailyRoom();
    }
  }, [initDailyRoom]);
  
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
  
  // Quando o iframe é carregado
  const handleIframeLoad = useCallback((iframeElement) => {
    if (!isMountedRef.current) return;
    
    console.log('Daily.co iframe carregado com sucesso');
    
    // Salvar referência ao iframe
    dailyFrameRef.current = iframeElement;
    
    // Marcar que o vídeo foi carregado
    setIsVideoEnabled(true);
    
    try {
      // Tentar configurar o currentCall globalmente
      if (typeof window.DailyIframe !== 'undefined') {
        const dailyObjects = window.DailyIframe.wrap(iframeElement);
        // Disponibilizar globalmente para verificação de participantes
        dailyCallRef.current = dailyObjects;
        console.log('API da Daily.co acessível globalmente via dailyCallRef');
        
        // Inspecionar o objeto Daily para verificar métodos de PiP
        console.log('Métodos disponíveis no objeto Daily:', Object.getOwnPropertyNames(dailyObjects));
        console.log('Propriedades do objeto Daily:', dailyObjects);
        
        // Verificar se existem métodos específicos relacionados a PiP
        if (typeof dailyObjects.enablePictureInPicture === 'function') {
          console.log('Método enablePictureInPicture encontrado!');
        }
        if (typeof dailyObjects.requestPictureInPicture === 'function') {
          console.log('Método requestPictureInPicture encontrado!');
        }
        if (dailyObjects.properties && dailyObjects.properties.enable_pip_ui !== undefined) {
          console.log('Propriedade enable_pip_ui encontrada:', dailyObjects.properties.enable_pip_ui);
        }
      }
    } catch (error) {
      console.error('Erro ao configurar API da Daily:', error);
    }
    
    // Remover a tela de carregamento
    setIsLoading(false);
    
    // Tentar detectar elementos de vídeo para o PiP
    setTimeout(() => {
      try {
        const findVideoElements = () => {
          try {
            if (iframeElement.contentDocument) {
              const videos = iframeElement.contentDocument.querySelectorAll('video');
              if (videos && videos.length > 0) {
                console.log(`Encontrados ${videos.length} elementos de vídeo no iframe`);
                return true;
              }
            }
            return false;
          } catch (e) {
            // Isso é esperado devido a CORS
            console.log('Não foi possível acessar o conteúdo do iframe devido a CORS');
            return false;
          }
        };
        
        // Tentar encontrar vídeos (pode falhar devido a CORS)
        const foundVideos = findVideoElements();
        
        // Se não encontrar vídeos, tenta alternativas
        if (!foundVideos) {
          console.log('Buscando elementos de vídeo no documento principal');
          
          // Verificar se há elementos de vídeo em qualquer lugar no documento
          const allVideos = document.querySelectorAll('video');
          if (allVideos && allVideos.length > 0) {
            console.log(`Encontrados ${allVideos.length} elementos de vídeo no documento`);
          }
        }
      } catch (e) {
        console.warn('Erro ao inspecionar iframe:', e);
      }
    }, 3000);
    
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
  
  // Componente para mostrar status da transcrição contínua
  const TranscriptionStatus = () => {
    if (!isTranscribing) return null;
    
    return (
      <div className="transcription-status">
        <div className={`status-indicator ${processingChunk ? 'processing' : 'recording'}`}></div>
        <div className="status-text">
          {processingChunk 
            ? 'Processando chunk de áudio...' 
            : 'Gravando áudio...'}
        </div>
        {chunkStats.count > 0 && (
          <div className="chunk-stats">
            {chunkStats.count} chunk{chunkStats.count !== 1 ? 's' : ''} processado{chunkStats.count !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };
  
  // Adicionar CSS para o status da transcrição
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .transcription-status {
        position: absolute;
        bottom: 150px;
        left: 20px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        align-items: center;
        z-index: 1000;
      }
      
      .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 8px;
      }
      
      .status-indicator.recording {
        background: #ff4433;
        animation: pulse 1.5s infinite;
      }
      
      .status-indicator.processing {
        background: #ffaa33;
        animation: blink 1s infinite;
      }
      
      .chunk-stats {
        margin-left: 8px;
        font-size: 10px;
        opacity: 0.8;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Efeito para configurar o acesso ao vídeo após o carregamento do iframe
  useEffect(() => {
    if (!dailyFrameRef.current || !sessionDetails) return;
    
    const setupVideoAccess = () => {
      try {
        // Tentativa de comunicação com o iframe para obter acesso ao vídeo
        const iframe = dailyFrameRef.current;
        
        // Adiciona um listener para mensagens do iframe
        const handleIframeMessage = (event) => {
          // Verificar origem para segurança
          if (event.origin !== 'https://teraconect.daily.co') return;
          
          // Processar mensagem do iframe (se implementarmos comunicação postMessage no futuro)
          if (event.data && event.data.type === 'video-ready') {
            console.log('Vídeo pronto para PiP:', event.data);
          }
        };
        
        window.addEventListener('message', handleIframeMessage);
        
        // Tenta acessar o documento do iframe após um curto delay
        setTimeout(() => {
          try {
            if (iframe.contentDocument) {
              const videos = iframe.contentDocument.querySelectorAll('video');
              if (videos && videos.length > 0) {
                console.log('Elementos de vídeo encontrados para PiP:', videos.length);
              }
            }
          } catch (e) {
            // O acesso pode falhar devido a restrições de CORS, o que é normal
            console.log('Não foi possível acessar o conteúdo do iframe (restrições de CORS)');
          }
        }, 2000);
        
        return () => {
          window.removeEventListener('message', handleIframeMessage);
        };
      } catch (error) {
        console.error('Erro ao configurar acesso ao vídeo:', error);
      }
    };
    
    // Configurar após o iframe estar disponível
    setupVideoAccess();
    
  }, [dailyFrameRef.current, sessionDetails]);
  
  // ========== RENDER ==========
  return (
    <div className={`fallback-meeting-container ${floating ? 'floating' : ''}`}>
      <VideoErrorBoundary>
        <div
          ref={videoContainerRef}
          className={`video-container ${isVideoEnabled ? 'video-active' : 'video-inactive'}`}
        >
          {/* Renderizar a janela flutuante quando visível */}
          <FloatingVideo 
            roomUrl={sessionDetails?.url}
            sessionId={getSessionId()}
            isVisible={isFloatingWindowVisible && !floating}
            onClose={closeFloatingWindow}
          />
          
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
          
          {isPipSupported() && !floating && isVideoEnabled && (
            <button 
              onClick={() => {
                // Tentar o PiP nativo do Daily.co primeiro, se disponível
                if (dailyCallRef.current && typeof dailyCallRef.current.requestPictureInPicture === 'function') {
                  try {
                    console.log('Tentando ativar PiP nativo do Daily.co');
                    dailyCallRef.current.requestPictureInPicture()
                      .then(() => {
                        console.log('PiP nativo do Daily.co ativado com sucesso');
                        toast.success('Picture-in-Picture nativo ativado');
                        setIsPipMode(true);
                        onPipModeChange(true);
                      })
                      .catch(e => {
                        console.error('Erro ao ativar PiP nativo:', e);
                        toast.warning('Usando modo PiP alternativo');
                        // Continuar com o PiP personalizado como fallback
                        handlePipClick();
                      });
                    return; // Sair da função se o método nativo estiver disponível
                  } catch (e) {
                    console.error('Exceção ao tentar PiP nativo:', e);
                    // Continuar com a abordagem personalizada
                  }
                }
                
                // PiP personalizado (fallback)
                if (window.globalPipVideo && window.globalPipVideo.active) {
                  document.exitPictureInPicture()
                    .then(() => {
                      console.log('Saiu do PiP global com sucesso');
                      onPipModeChange(false);
                      setIsPipMode(false);
                      window.globalPipVideo.active = false;
                    })
                    .catch(e => {
                      console.error('Erro ao sair do PiP:', e);
                      toast.error('Erro ao desativar o modo Picture-in-Picture');
                    });
                } else if (document.pictureInPictureElement) {
                  document.exitPictureInPicture()
                    .then(() => {
                      console.log('Saiu do PiP com sucesso');
                      onPipModeChange(false);
                      setIsPipMode(false);
                    })
                    .catch(e => {
                      console.error('Erro ao sair do PiP:', e);
                      toast.error('Erro ao desativar o modo Picture-in-Picture');
                    });
                } else {
                  const video = document.createElement('video');
                  video.id = 'global-pip-video';
                  video.width = 640;
                  video.height = 360;
                  video.autoplay = true;
                  
                  const canvas = document.createElement('canvas');
                  canvas.width = 640;
                  canvas.height = 360;
                  document.body.appendChild(canvas);
                  
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = '#1a1a1a';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  
                  ctx.fillStyle = 'white';
                  ctx.font = 'bold 28px Arial';
                  ctx.textAlign = 'center';
                  ctx.fillText('Modo Picture-in-Picture ativo', canvas.width/2, canvas.height/2 - 40);
                  
                  ctx.font = '20px Arial';
                  ctx.fillText('Sua chamada continua ativa', canvas.width/2, canvas.height/2 + 10);
                  ctx.fillText('Para retornar, clique no botão X', canvas.width/2, canvas.height/2 + 50);
                  
                  ctx.font = 'bold 18px Arial';
                  ctx.fillText('TerapiaConect', canvas.width/2, canvas.height - 30);
                  
                  // Obter o stream do canvas
                  const stream = canvas.captureStream();
                  video.srcObject = stream;
                  
                  video.style.position = 'fixed';
                  video.style.top = '-1px';
                  video.style.left = '-1px';
                  video.style.opacity = '0.01';
                  video.style.height = '1px';
                  video.style.width = '1px';
                  document.body.appendChild(video);
                  
                  if (!window.globalPipVideo) {
                    window.globalPipVideo = { active: false };
                  }
                  
                  video.onloadedmetadata = () => {
                    video.requestPictureInPicture()
                      .then(() => {
                        console.log('PiP ativado com sucesso');
                        onPipModeChange(true);
                        setIsPipMode(true);
                        window.globalPipVideo.active = true;
                        
                        video.addEventListener('leavepictureinpicture', () => {
                          console.log('Usuário saiu do modo PiP');
                          onPipModeChange(false);
                          setIsPipMode(false);
                          window.globalPipVideo.active = false;
                          
                          // Limpar recursos
                          if (video.srcObject) {
                            const tracks = video.srcObject.getTracks();
                            tracks.forEach(track => track.stop());
                          }
                          if (video.parentNode) {
                            video.parentNode.removeChild(video);
                          }
                          if (canvas.parentNode) {
                            canvas.parentNode.removeChild(canvas);
                          }
                        }, { once: true });
                        
                        toast.success('Picture-in-Picture ativado com sucesso');
                      })
                      .catch(e => {
                        console.error('Erro ao ativar PiP:', e);
                        toast.error('Não foi possível ativar o Picture-in-Picture');
                        
                        // Limpar recursos em caso de erro
                        if (video.parentNode) {
                          video.parentNode.removeChild(video);
                        }
                        if (canvas.parentNode) {
                          canvas.parentNode.removeChild(canvas);
                        }
                      });
                  };
                }
              }} 
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
          
          {isVideoEnabled && !floating && (
            <div>
              {isPipSupported() && (
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
                  PiP Custom
                </button>
              )}
              
              {/* Botão para PiP nativo do Daily.co */}
              {dailyCallRef.current && typeof dailyCallRef.current.requestPictureInPicture === 'function' && (
                <button 
                  onClick={() => {
                    try {
                      console.log('Ativando PiP nativo do Daily.co');
                      dailyCallRef.current.requestPictureInPicture()
                        .then(() => {
                          console.log('PiP nativo do Daily.co ativado com sucesso');
                          toast.success('Picture-in-Picture nativo ativado');
                          setIsPipMode(true);
                        })
                        .catch(e => {
                          console.error('Erro ao ativar PiP nativo:', e);
                          toast.error('Erro ao ativar PiP nativo');
                        });
                    } catch (e) {
                      console.error('Exceção ao tentar PiP nativo:', e);
                      toast.error('Não foi possível ativar o PiP nativo');
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '100px',
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
                  PiP Nativo
                </button>
              )}
            </div>
          )}
          
          {isPipSupported() && !floating && isVideoEnabled && (
            <button 
              onClick={openFloatingWindow}
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
              Janela Flutuante
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