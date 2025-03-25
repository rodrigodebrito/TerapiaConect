import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FallbackMeeting from '../components/FallbackMeeting';
import { getSessionById, markSessionCompleted } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import Button from '../components/Button';
import '../styles/SessionRoom.css';

// Verificar se o componente de campo de constelação existente está disponível
let ConstellationField;
try {
  ConstellationField = require('../components/ConstellationField'); // Mantém a referência ao componente original, se existir
} catch (error) {
  ConstellationField = null;
}

const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [meetingView, setMeetingView] = useState('embedded'); // 'embedded', 'external', 'hidden'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSessionById(sessionId);
        setSession(sessionData);
      } catch (err) {
        console.error('Erro ao buscar detalhes da sessão:', err);
        setError('Não foi possível carregar os detalhes da sessão.');
        toast.error('Erro ao buscar detalhes da sessão.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Notificações temporárias
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

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

  const openDirectJitsi = () => {
    window.open(`/direct-jitsi/${sessionId}`, '_blank');
    setMeetingView('external');
  };

  const handleSelectTool = (toolName) => {
    console.log(`Selecionando ferramenta: ${toolName}`);
    if (activeTool === toolName) {
      setActiveTool(null);
    } else {
      setActiveTool(toolName);
      setIsFullscreen(false); // Iniciar ferramentas em modo normal
    }
    setIsSidebarOpen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleVideo = () => {
    setVideoMuted(!videoMuted);
    setShowNotification(`Câmera ${!videoMuted ? 'desativada' : 'ativada'}`);
  };

  const toggleAudio = () => {
    setAudioMuted(!audioMuted);
    setShowNotification(`Microfone ${!audioMuted ? 'desativado' : 'ativado'}`);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="session-error-container">
        <h2>Erro</h2>
        <p>{error}</p>
        <Button onClick={() => navigate('/appointments')}>Voltar para Agendamentos</Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="session-error-container">
        <h2>Sessão não encontrada</h2>
        <p>Não foi possível encontrar a sessão solicitada.</p>
        <Button onClick={() => navigate('/appointments')}>Voltar para Agendamentos</Button>
      </div>
    );
  }

  return (
    <div className="therapy-session-container">
      {/* Header minimalista com informações da sessão */}
      <header className="session-header">
        <div className="session-info">
          <h1>Sessão: {session.therapist?.user?.name} com {session.client?.user?.name}</h1>
          <span>{new Date(session.date).toLocaleDateString('pt-BR')} • {session.startTime} às {session.endTime}</span>
        </div>
        <Button variant="secondary" onClick={() => navigate('/appointments')} className="back-btn">
          Voltar
        </Button>
      </header>

      {/* Área principal - estilo Zoom com área de vídeo e ferramentas */}
      <main className={`session-main ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Área do meeting em tela cheia quando uma ferramenta não está ativa */}
        {!activeTool && meetingView === 'embedded' && (
          <div className="zoom-video-area">
            <FallbackMeeting
              sessionId={sessionId}
              therapistName={session.therapist?.user?.name}
              clientName={session.client?.user?.name}
            />
          </div>
        )}

        {/* Se o meeting for aberto em uma janela externa */}
        {!activeTool && meetingView === 'external' && (
          <div className="external-meeting-notice">
            <div className="notice-content">
              <div className="notice-icon">🎥</div>
              <h3>Videoconferência aberta em nova janela</h3>
              <p>A videoconferência foi aberta em uma nova janela.</p>
              <Button 
                variant="secondary" 
                onClick={() => setMeetingView('embedded')}
              >
                Mostrar Videoconferência Aqui
              </Button>
            </div>
          </div>
        )}

        {/* Campo de Constelação - layout centrado e responsivo */}
        {activeTool === 'constellation' && (
          <div className={`tool-container constellation-tool ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="tool-header">
              <h2>Campo de Constelação</h2>
              <div className="tool-controls">
                <button 
                  className="control-button fullscreen-btn" 
                  onClick={toggleFullscreen} 
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? "⬆" : "⤢"}
                </button>
                <button 
                  className="control-button close-btn" 
                  onClick={() => setActiveTool(null)} 
                  title="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="tool-content">
              {ConstellationField ? (
                <ConstellationField.default />
              ) : (
                <iframe 
                  src="/teste-constelacao" 
                  title="Campo de Constelação"
                  className="constellation-iframe"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        )}

        {/* Assistente IA - mesmo estilo do campo de constelação */}
        {activeTool === 'ai' && (
          <div className={`tool-container ai-tool ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="tool-header">
              <h2>Assistente IA</h2>
              <div className="tool-controls">
                <button 
                  className="control-button fullscreen-btn" 
                  onClick={toggleFullscreen} 
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? "⬆" : "⤢"}
                </button>
                <button 
                  className="control-button close-btn" 
                  onClick={() => setActiveTool(null)} 
                  title="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="tool-content">
              <div className="ai-placeholder">
                <h3>Assistente IA</h3>
                <p>Funcionalidade em desenvolvimento...</p>
              </div>
            </div>
          </div>
        )}

        {/* Barra lateral retrátil para ferramentas - estilo Zoom */}
        <div className={`session-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h3>Ferramentas</h3>
            <button className="close-sidebar" onClick={toggleSidebar}>×</button>
          </div>
          <div className="sidebar-tools">
            <div 
              className={`tool-button ${activeTool === 'constellation' ? 'active' : ''}`} 
              onClick={() => handleSelectTool('constellation')}
            >
              <div className="tool-icon">⭐</div>
              <span>Campo de Constelação</span>
            </div>
            <div 
              className={`tool-button ${activeTool === 'ai' ? 'active' : ''}`}
              onClick={() => handleSelectTool('ai')}
            >
              <div className="tool-icon">🤖</div>
              <span>Assistente IA</span>
            </div>
            <div 
              className="tool-button"
              onClick={openDirectJitsi}
            >
              <div className="tool-icon">📺</div>
              <span>Abrir em Nova Janela</span>
            </div>
            <div 
              className="tool-button"
              onClick={handleEndSession}
            >
              <div className="tool-icon red">⏹️</div>
              <span>Encerrar Sessão</span>
            </div>
          </div>
        </div>

        {/* Notificação temporária - desaparece após alguns segundos */}
        {showNotification && (
          <div className="notification-popup">
            {showNotification}
          </div>
        )}
      </main>

      {/* Barra de controles fixa no estilo Zoom */}
      <div className="zoom-controls-bar">
        <div className="control-group left">
          <button 
            className={`control-button ${audioMuted ? 'disabled' : ''}`} 
            onClick={toggleAudio}
            title={audioMuted ? "Ativar microfone" : "Desativar microfone"}
          >
            {audioMuted ? "🔇" : "🎤"}
          </button>
          <button 
            className={`control-button ${videoMuted ? 'disabled' : ''}`} 
            onClick={toggleVideo}
            title={videoMuted ? "Ativar câmera" : "Desativar câmera"}
          >
            {videoMuted ? "🚫" : "📹"}
          </button>
        </div>
        
        <div className="control-group center">
          <button 
            className="control-button tools-btn" 
            onClick={toggleSidebar}
            title="Exibir ferramentas"
          >
            🛠️
          </button>
          {activeTool === 'constellation' && (
            <>
              <button className="control-button action-btn">
                Passar
              </button>
              <button className="control-button action-btn">
                Salvar
              </button>
              <button className="control-button action-btn">
                Ocultar
              </button>
            </>
          )}
        </div>
        
        <div className="control-group right">
          <button 
            className="control-button end-btn" 
            onClick={handleEndSession}
            title="Encerrar sessão"
          >
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRoom; 