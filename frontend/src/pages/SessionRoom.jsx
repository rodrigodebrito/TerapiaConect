import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSessionById, markSessionCompleted } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { FallbackMeeting } from '../components/FallbackMeeting';
import ConstellationField from '../components/ConstellationField/index';
import { 
  MdMic, MdMicOff, 
  MdVideocam, MdVideocamOff,
  MdFullscreen, MdFullscreenExit,
  MdMenu, MdClose,
  MdOutlinePictureInPicture, MdOutlinePictureInPictureAlt,
  MdStars
} from 'react-icons/md';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMaximize, FiMinimize } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import Loader from '../components/Loader';
import '../styles/SessionRoom.css';

const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConstellationField, setShowConstellationField] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipMode, setIsPipMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 320, height: 180 });
  const resizeStartRef = useRef({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const videoWrapperRef = useRef(null);

  // Carregar detalhes da sessão
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSessionById(sessionId);
        setSession(sessionData);
      } catch (err) {
        console.error('Erro ao buscar detalhes da sessão:', err);
        setError('Não foi possível carregar os detalhes da sessão.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseDown = (e) => {
    if (!isPipMode) return;
    
    // Se clicar no resize handle, não iniciar o drag
    if (e.target.classList.contains('resize-handle')) {
      return;
    }
    
    setIsDragging(true);
    setIsResizing(false); // Desabilitar o resize durante o drag
    
    dragStartRef.current = {
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y
    };
    
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setDragPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleConstellationField = () => {
    console.log('Toggle Constellation Field - Estado atual:', showConstellationField);
    setShowConstellationField(!showConstellationField);
    if (!showConstellationField) {
      // Quando ativar o campo de constelação, entra em modo PIP
      console.log('Ativando modo PIP');
      setIsPipMode(true);
      
      // Calcular posição centralizada
      const videoWidth = 320; // Largura do vídeo em PIP
      const videoHeight = 180; // Altura do vídeo em PIP
      const x = (window.innerWidth - videoWidth) / 2;
      const y = (window.innerHeight - videoHeight) / 2;
      
      console.log('Posicionando vídeo centralizado em:', { x, y });
      setDragPosition({ x, y });
      
      // Forçar re-renderização do vídeo
      if (videoWrapperRef.current) {
        videoWrapperRef.current.style.display = 'none';
        setTimeout(() => {
          videoWrapperRef.current.style.display = 'block';
        }, 0);
      }
    } else {
      // Quando desativar o campo de constelação, sai do modo PIP
      console.log('Desativando modo PIP');
      setIsPipMode(false);
      setDragPosition({ x: 0, y: 0 });
    }
  };

  const handlePipModeChange = (isPip) => {
    console.log('PIP Mode Change:', isPip);
    setIsPipMode(isPip);
    if (isPip) {
      // Quando entrar em PIP, posicionar centralizado
      const videoWidth = 320;
      const videoHeight = 180;
      const x = (window.innerWidth - videoWidth) / 2;
      const y = (window.innerHeight - videoHeight) / 2;
      console.log('Posicionando vídeo centralizado em:', { x, y });
      setDragPosition({ x, y });
    }
  };

  // Adicionar useEffect para monitorar mudanças no estado PIP
  useEffect(() => {
    console.log('Estado PIP mudou:', isPipMode);
    console.log('Posição do vídeo:', dragPosition);
  }, [isPipMode, dragPosition]);

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    showNotification({
      message: `Microfone ${!audioEnabled ? 'ativado' : 'desativado'}`,
      type: !audioEnabled ? 'success' : 'info'
    });
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    showNotification({
      message: `Câmera ${!videoEnabled ? 'ativada' : 'desativada'}`,
      type: !videoEnabled ? 'success' : 'info'
    });
  };

  const handleResizeStart = (e) => {
    if (!isPipMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Iniciando redimensionamento');
    setIsResizing(true);
    setIsDragging(false);
    
    const videoWrapper = videoWrapperRef.current;
    if (!videoWrapper) return;
    
    const rect = videoWrapper.getBoundingClientRect();
    resizeStartRef.current = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY
    };
    
    videoWrapper.classList.add('resizing');
    
    // Atualizar CSS variables com o tamanho atual
    videoWrapper.style.setProperty('--video-width', `${rect.width}px`);
    videoWrapper.style.setProperty('--video-height', `${rect.height}px`);
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    
    // Calcular nova largura mantendo proporção 16:9
    let newWidth = Math.max(180, Math.min(800, resizeStartRef.current.width + deltaX));
    let newHeight = Math.max(101, Math.min(450, (newWidth * 9) / 16));
    
    // Ajustar altura se exceder o limite máximo
    if (newHeight > 450) {
      newHeight = 450;
      newWidth = (newHeight * 16) / 9;
    }
    
    console.log('Redimensionando:', { newWidth, newHeight });
    
    // Atualizar CSS variables com as novas dimensões
    const videoWrapper = videoWrapperRef.current;
    if (videoWrapper) {
      videoWrapper.style.setProperty('--video-width', `${newWidth}px`);
      videoWrapper.style.setProperty('--video-height', `${newHeight}px`);
    }
    
    setVideoSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = (e) => {
    if (!isResizing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Finalizando redimensionamento');
    setIsResizing(false);
    
    const videoWrapper = videoWrapperRef.current;
    if (videoWrapper) {
      videoWrapper.classList.remove('resizing');
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Encerrar sessão
  const handleEndSession = async () => {
    if (!window.confirm('Tem certeza que deseja encerrar esta sessão?')) {
      return;
    }

    try {
      await markSessionCompleted(sessionId);
      toast.success('Sessão encerrada com sucesso!');
      navigate('/appointments');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast.error('Não foi possível encerrar a sessão. Tente novamente.');
    }
  };

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="session-error">
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/appointments')}>
          Voltar para Agendamentos
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`session-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="content-wrapper">
        {showConstellationField && (
          <div className="constellation-wrapper">
            <ConstellationField isHost={user?.role === 'THERAPIST'} sessionId={sessionId} />
          </div>
        )}

        <div 
          ref={videoWrapperRef}
          className={`video-wrapper ${isPipMode ? 'pip-mode' : ''} ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
          style={isPipMode ? {
            transform: `translate3d(${dragPosition.x}px, ${dragPosition.y}px, 0)`,
            cursor: isDragging ? 'grabbing' : (isResizing ? 'se-resize' : 'grab'),
            position: 'fixed',
            zIndex: 2147483647,
            display: 'block',
            pointerEvents: 'auto',
            opacity: 1,
            visibility: 'visible',
            '--video-width': `${videoSize.width}px`,
            '--video-height': `${videoSize.height}px`
          } : undefined}
        >
          <FallbackMeeting
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            isFloating={isPipMode}
            onPipModeChange={handlePipModeChange}
          />
          {isPipMode && (
            <div 
              className="resize-handle"
              onMouseDown={handleResizeStart}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '20px',
                height: '20px',
                cursor: 'se-resize',
                zIndex: 2147483648,
                pointerEvents: 'auto',
                opacity: 1,
                visibility: 'visible'
              }}
            />
          )}
        </div>
      </div>

      <div className="controls-bar">
        <button
          className={`control-button ${!audioEnabled ? 'disabled' : ''}`}
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          {audioEnabled ? <FiMic /> : <FiMicOff />}
        </button>
        <button
          className={`control-button ${!videoEnabled ? 'disabled' : ''}`}
          onClick={() => setVideoEnabled(!videoEnabled)}
        >
          {videoEnabled ? <FiVideo /> : <FiVideoOff />}
        </button>
        <button
          className="control-button"
          onClick={toggleConstellationField}
        >
          <BsStars />
        </button>
        <button
          className="control-button"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              containerRef.current?.requestFullscreen();
            }
            setIsFullscreen(!isFullscreen);
          }}
        >
          {isFullscreen ? <FiMinimize /> : <FiMaximize />}
        </button>
      </div>
    </div>
  );
};

export default SessionRoom;