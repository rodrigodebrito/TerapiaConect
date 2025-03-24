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
  const [meetingInitialized, setMeetingInitialized] = useState(false);

  useEffect(() => {
    console.log("SessionRoom: Inicializando com ID", sessionId);
    const fetchSession = async () => {
      try {
        console.log("SessionRoom: Buscando detalhes da sessão");
        const sessionData = await getSessionById(sessionId);
        console.log("SessionRoom: Dados da sessão obtidos", sessionData);
        setSession(sessionData);
        setMeetingInitialized(true);
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
    navigate(`/direct-jitsi/${sessionId}`);
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
    <div className="session-room-container">
      <div className="session-info">
        <h1>Sessão de Terapia</h1>
        <p><strong>Data:</strong> {new Date(session.date).toLocaleDateString('pt-BR')}</p>
        <p><strong>Horário:</strong> {session.startTime} às {session.endTime}</p>
        <p><strong>Terapeuta:</strong> {session.therapist?.user?.name || 'Nome não disponível'}</p>
        <p><strong>Cliente:</strong> {session.client?.user?.name || 'Nome não disponível'}</p>
        
        <div className="session-actions">
          <Button onClick={openDirectJitsi} variant="primary">Abrir Jitsi Meet</Button>
          <Button onClick={handleEndSession} variant="danger">Encerrar Sessão</Button>
          <Button onClick={() => navigate('/appointments')} variant="secondary">Voltar</Button>
        </div>
      </div>

      <div className="session-room">
        {meetingInitialized && (
          <FallbackMeeting
            sessionId={sessionId}
            therapistName={session.therapist?.user?.name}
            clientName={session.client?.user?.name}
          />
        )}
      </div>
    </div>
  );
};

export default SessionRoom; 