import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSessionById, markSessionCompleted } from '../services/sessionService';
import FallbackMeeting from '../components/FallbackMeeting';
import { AIProvider } from '../contexts/AIContext';
import '../styles/SessionRoom.css';
import jitsiToolsInjector from '../services/jitsiToolsInjector';

const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPipMode, setIsPipMode] = useState(false);
  const [fullScreenElement, setFullScreenElement] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(false);
  const [isRoomMounted, setIsRoomMounted] = useState(false);

  // Carregar dados da sessão
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const data = await getSessionById(sessionId);
        setSession(data);
        document.title = `${data.title} - TerapiaConect`;
      } catch (err) {
        console.error('Erro ao carregar sessão:', err);
        setError('Não foi possível carregar os dados da sessão. Por favor, tente novamente mais tarde.');
        toast.error('Erro ao carregar sessão');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  // Monitorar mudanças no estado de tela cheia
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isFullScreen = document.fullscreenElement !== null;
      setFullScreenElement(document.fullscreenElement);
      
      // Mostrar controles por alguns segundos ao entrar/sair da tela cheia
      setShowControls(true);
      setTimeout(() => {
        if (!isPipMode) {
          setShowControls(false);
        }
      }, 3000);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [isPipMode]);

  // Gerenciar eventos de mouse para arrastar e redimensionar o vídeo
  useEffect(() => {
    // Só adicionar event listeners se estiver em modo PiP
    if (!isPipMode) return;

    const handleMouseMove = (e) => {
      if (isDragging && canDrag) {
        const deltaX = e.clientX - dragStartPosition.x;
        const deltaY = e.clientY - dragStartPosition.y;
        
        setVideoPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        setDragStartPosition({
          x: e.clientX,
          y: e.clientY
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPipMode, isDragging, dragStartPosition, canDrag]);

  // Função para iniciar o arrasto do vídeo em modo PiP
  const handleMouseDown = (e) => {
    if (isPipMode && !isVideoResizing(e.target)) {
      setIsDragging(true);
      setDragStartPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  // Verificar se estamos redimensionando o vídeo
  const isVideoResizing = (element) => {
    return element.classList && element.classList.contains('resizer');
  };

  // Alternar o modo PiP
  const handlePipModeChange = (enabled) => {
    setIsPipMode(enabled);
    setShowControls(!enabled);
  };

  // Sair da sessão
  const exitSession = async () => {
    try {
      // Atualizar status da sessão para concluída
      if (session && session.status === 'em_andamento') {
        await markSessionCompleted(sessionId);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao sair da sessão:', error);
      toast.error('Erro ao finalizar a sessão');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (session && !isRoomMounted) {
      // Delay para garantir estabilidade antes de montar o componente
      const timer = setTimeout(() => {
        setIsRoomMounted(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [session, isRoomMounted]);

  // Efeito para garantir que os estilos globais para os botões de IA sejam injetados
  useEffect(() => {
    // Injetar os estilos globais para os botões de IA
    const styleElement = document.createElement('style');
    styleElement.id = 'ai-tools-global-styles';
    styleElement.textContent = `
      .ai-tools-container-direct {
        position: fixed !important;
        bottom: 100px !important;
        left: 0 !important;
        width: 100% !important;
        height: auto !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
      }
      
      .ai-simple-toolbar {
        display: flex !important;
        gap: 10px !important;
        background-color: rgba(0, 0, 0, 0.8) !important;
        border-radius: 50px !important;
        padding: 8px 16px !important;
        backdrop-filter: blur(5px) !important;
        -webkit-backdrop-filter: blur(5px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        pointer-events: all !important;
      }
      
      .ai-simple-button {
        background-color: #2a3e4c !important;
        color: white !important;
        border: none !important;
        border-radius: 50px !important;
        padding: 8px 16px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        font-size: 14px !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
      }
    `;
    
    // Adicionar ao head se ainda não existir
    if (!document.getElementById('ai-tools-global-styles')) {
      document.head.appendChild(styleElement);
    }
    
    return () => {
      // Remover estilos quando componente for desmontado
      const existingStyle = document.getElementById('ai-tools-global-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  if (loading) {
    return <div className="loading-container">Carregando sessão...</div>;
  }

  if (error || !session) {
    return (
      <div className="error-container">
        <h2>Erro</h2>
        <p>{error || 'Sessão não encontrada'}</p>
        <button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</button>
      </div>
    );
  }

  return (
    <AIProvider>
      <div className="session-room">
        <div 
          className={`session-video-container ${isPipMode ? 'pip-mode' : ''} ${fullScreenElement ? 'fullscreen' : ''}`}
          style={isPipMode ? { 
            transform: `translate(${videoPosition.x}px, ${videoPosition.y}px)` 
          } : {}}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setCanDrag(true)}
          onMouseLeave={() => setCanDrag(false)}
        >
          {session && isRoomMounted && (
            <FallbackMeeting
              roomName={`terapiaconect-${sessionId}`}
              userName={session.therapist?.name || 'Terapeuta'}
              floating={isPipMode}
              onPipModeChange={handlePipModeChange}
            />
          )}
          
          {showControls && !isPipMode && (
            <div className="video-controls">
              <button className="exit-button" onClick={exitSession}>
                Encerrar Sessão
              </button>
            </div>
          )}
          
          {isPipMode && (
            <>
              <div 
                className="resizer resizer-r"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // Lógica para redimensionar
                }}
              />
              <div className="pip-controls">
                <button onClick={() => setIsPipMode(false)}>
                  Sair do PiP
                </button>
              </div>
            </>
          )}
        </div>
        
        <div className={`session-info ${isPipMode ? 'hidden' : ''}`}>
          <h1>{session.title}</h1>
          <p>Paciente: {session.patient?.name || 'Não especificado'}</p>
          <p>Duração: {session.duration || 50} minutos</p>
          {session.notes && (
            <div className="session-notes">
              <h3>Notas prévias:</h3>
              <p>{session.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AIProvider>
  );
};

export default SessionRoom;