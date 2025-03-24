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
  const [showToolsMenu, setShowToolsMenu] = useState(false);

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

  // Fecha o menu de ferramentas quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      const toolsContainer = document.querySelector('.session-tools-container');
      if (toolsContainer && !toolsContainer.contains(event.target)) {
        setShowToolsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setShowToolsMenu(false); // Fechar o menu após selecionar uma ferramenta
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleToolsMenu = () => {
    setShowToolsMenu(!showToolsMenu);
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
      <header className="session-header">
        <div className="session-title">
          <h1>Sessão de Terapia</h1>
          <div className="session-info">
            <span>{new Date(session.date).toLocaleDateString('pt-BR')}</span>
            <span className="divider">•</span>
            <span>{session.startTime} às {session.endTime}</span>
          </div>
        </div>
        
        <div className="session-participants">
          <div className="participant therapist">
            <span className="role">Terapeuta:</span>
            <span className="name">{session.therapist?.user?.name || 'Nome não disponível'}</span>
          </div>
          <div className="participant client">
            <span className="role">Cliente:</span>
            <span className="name">{session.client?.user?.name || 'Nome não disponível'}</span>
          </div>
        </div>

        <div className="session-actions">
          <Button variant="primary" onClick={openDirectJitsi}>
            Abrir Jitsi Meet
          </Button>
          <Button variant="danger" onClick={handleEndSession}>
            Encerrar Sessão
          </Button>
          <Button variant="secondary" onClick={() => navigate('/appointments')}>
            Voltar
          </Button>
        </div>
      </header>

      <div className="session-main">
        <div className={`session-workspace ${activeTool ? 'with-tool' : ''} ${isFullscreen ? 'fullscreen-tool' : ''}`}>
          {!activeTool && meetingView === 'embedded' && (
            <div className="video-conference-container full">
              <FallbackMeeting
                sessionId={sessionId}
                therapistName={session.therapist?.user?.name}
                clientName={session.client?.user?.name}
              />
            </div>
          )}

          {!activeTool && meetingView === 'external' && (
            <div className="external-meeting-notice">
              <div className="notice-content">
                <div className="notice-icon">🎥</div>
                <h3>Videoconferência aberta em nova janela</h3>
                <p>A videoconferência foi aberta em uma nova janela. Você pode continuar usando as ferramentas nesta janela.</p>
                <Button 
                  variant="secondary" 
                  onClick={() => setMeetingView('embedded')}
                >
                  Mostrar Videoconferência Aqui
                </Button>
              </div>
            </div>
          )}

          {activeTool === 'constellation' && (
            <div className={`tool-panel constellation-tool ${isFullscreen ? 'fullscreen' : 'fullscreen'}`}>
              <div className="tool-header">
                <h2>Campo de Constelação</h2>
                <div className="tool-header-actions">
                  <button 
                    className="fullscreen-toggle" 
                    onClick={toggleFullscreen} 
                    title={isFullscreen ? "Minimizar" : "Maximizar"}
                  >
                    {isFullscreen ? (
                      <span>🗕</span>
                    ) : (
                      <span>🗖</span>
                    )}
                  </button>
                  <button className="close-tool" onClick={() => setActiveTool(null)} title="Fechar">&times;</button>
                </div>
              </div>
              <div className="tool-content">
                {/* Renderizar o componente do campo de constelação */}
                {ConstellationField ? (
                  <ConstellationField.default />
                ) : (
                  <iframe 
                    src="/teste-constelacao" 
                    title="Campo de Constelação"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      overflow: 'hidden',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {activeTool === 'ai' && (
            <div className={`tool-panel ai-tool ${isFullscreen ? 'fullscreen' : ''}`}>
              <div className="tool-header">
                <h2>Assistente IA</h2>
                <div className="tool-header-actions">
                  <button 
                    className="fullscreen-toggle" 
                    onClick={toggleFullscreen} 
                    title={isFullscreen ? "Minimizar" : "Maximizar"}
                  >
                    {isFullscreen ? (
                      <span>🗕</span>
                    ) : (
                      <span>🗖</span>
                    )}
                  </button>
                  <button className="close-tool" onClick={() => setActiveTool(null)} title="Fechar">&times;</button>
                </div>
              </div>
              <div className="tool-content">
                <div className="ai-placeholder">
                  <p>
                    Interface do Assistente de IA<br />
                    Faça perguntas e receba insights para a terapia
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTool && meetingView === 'embedded' && (
            <FallbackMeeting
              sessionId={sessionId}
              therapistName={session.therapist?.user?.name}
              clientName={session.client?.user?.name}
              isFloating={true}
            />
          )}
        </div>

        {/* Menu dropdown de ferramentas */}
        <div className="session-tools-container">
          <button 
            className={`tools-toggle ${showToolsMenu ? 'active' : ''}`} 
            onClick={toggleToolsMenu}
            title="Ferramentas"
          >
            🛠️
          </button>
          <div className="session-tools">
            <div className={`tools-grid ${showToolsMenu ? 'show' : ''}`}>
              <div 
                className={`tool-card ${activeTool === 'constellation' ? 'active' : ''}`}
                onClick={() => handleSelectTool('constellation')}
              >
                <div className="tool-icon">☀️</div>
                <div className="tool-name">Campo de Constelação</div>
              </div>
              
              <div 
                className={`tool-card ${activeTool === 'ai' ? 'active' : ''}`}
                onClick={() => handleSelectTool('ai')}
              >
                <div className="tool-icon">🤖</div>
                <div className="tool-name">Assistente IA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRoom; 