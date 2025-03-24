import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FallbackMeeting from '../components/FallbackMeeting';
import { getSessionById, markSessionCompleted } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import Button from '../components/Button';
import '../styles/SessionRoom.css';

const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [meetingView, setMeetingView] = useState('embedded'); // 'embedded', 'external', 'hidden'
  const [toolsVisible, setToolsVisible] = useState(true);
  const [videoMinimized, setVideoMinimized] = useState(false);

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

  useEffect(() => {
    // Quando uma ferramenta é ativada, minimizar o vídeo
    if (activeTool) {
      setVideoMinimized(true);
    } else {
      setVideoMinimized(false);
    }
  }, [activeTool]);

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

  const switchTool = (toolName) => {
    console.log("Ferramenta selecionada:", toolName);
    
    if (activeTool === toolName) {
      setActiveTool(null);
      setVideoMinimized(false);
    } else {
      setActiveTool(toolName);
      setVideoMinimized(true);
    }
  };

  const toggleTools = () => {
    setToolsVisible(!toolsVisible);
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
        <div className={`session-workspace ${activeTool ? 'with-tool' : ''}`}>
          {activeTool === 'constellation' && (
            <div className="tool-fullscreen constellation-tool">
              <div className="tool-header">
                <h2>Campo de Constelação</h2>
                <button className="close-tool" onClick={() => setActiveTool(null)}>&times;</button>
              </div>
              <div className="tool-content">
                <div className="constellation-placeholder">
                  <div>
                    <p style={{textAlign: 'center', margin: '0 0 20px 0'}}>
                      <span style={{fontSize: '48px', display: 'block', marginBottom: '20px'}}>☀️</span>
                      <strong style={{fontSize: '18px'}}>Visualização do Campo de Constelação</strong>
                    </p>
                    <p>
                      Arraste os elementos para posicionar no campo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'ai' && (
            <div className="tool-fullscreen ai-tool">
              <div className="tool-header">
                <h2>Assistente IA</h2>
                <button className="close-tool" onClick={() => setActiveTool(null)}>&times;</button>
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
        </div>

        {activeTool && meetingView === 'embedded' && (
          <div className="floating-video-container">
            <div className="floating-video-header">
              <span>Videochamada</span>
              <button className="maximize-video" onClick={() => setActiveTool(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"/>
                </svg>
              </button>
            </div>
            <div className="floating-video-content">
              <FallbackMeeting
                sessionId={sessionId}
                therapistName={session.therapist?.user?.name}
                clientName={session.client?.user?.name}
                isFloating={true}
              />
            </div>
          </div>
        )}

        <div className="session-tools" id="tools-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>Ferramentas</h3>
            <button 
              onClick={toggleTools} 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '0.9rem', 
                color: '#555' 
              }}
            >
              {toolsVisible ? 'Ocultar' : 'Mostrar'} Ferramentas
            </button>
          </div>
          
          {toolsVisible && (
            <div className="tools-grid">
              <div 
                className={`tool-card ${activeTool === 'constellation' ? 'active' : ''}`}
                onClick={() => switchTool('constellation')}
              >
                <div className="tool-icon">☀️</div>
                <div className="tool-name">Campo de Constelação</div>
              </div>
              
              <div 
                className={`tool-card ${activeTool === 'ai' ? 'active' : ''}`}
                onClick={() => switchTool('ai')}
              >
                <div className="tool-icon">🤖</div>
                <div className="tool-name">Assistente IA</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionRoom; 