import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import sessionService from '../services/sessionService';
import websocketService from '../services/websocketService';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children, sessionId }) => {
  const { user, token } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [status, setStatus] = useState('connecting');

  // Inicializar a sessão
  useEffect(() => {
    if (!sessionId || !user || !token) {
      setLoading(false);
      setError('Informações necessárias não fornecidas');
      return;
    }

    const initSession = async () => {
      try {
        setLoading(true);
        
        // 1. Carregar dados da sessão
        const sessionData = await sessionService.getSession(sessionId)
          .catch(() => {
            // Simulação inicial
            return {
              id: sessionId,
              title: 'Sessão Terapêutica',
              state: 'ACTIVE',
              startTime: new Date().toISOString(),
              scheduledDuration: 60, // em minutos
              participants: [
                { id: 1, role: 'therapist', name: 'Dr. Terapeuta' },
                { id: 2, role: 'client', name: 'Cliente' }
              ]
            };
          });

        setSession(sessionData);
        setParticipants(sessionData.participants);
        
        // 2. Conectar ao WebSocket
        await websocketService.connect(sessionId, token);
        
        // 3. Registrar listeners para eventos WebSocket
        websocketService.on('participant_joined', handleParticipantJoined);
        websocketService.on('participant_left', handleParticipantLeft);
        websocketService.on('session_update', handleSessionUpdate);
        websocketService.on('disconnect', handleDisconnect);
        
        setStatus('connected');
      } catch (err) {
        console.error('Erro ao inicializar sessão:', err);
        setError('Falha ao inicializar sessão. Tente novamente.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Limpar conectores quando o componente for desmontado
    return () => {
      websocketService.off('participant_joined', handleParticipantJoined);
      websocketService.off('participant_left', handleParticipantLeft);
      websocketService.off('session_update', handleSessionUpdate);
      websocketService.off('disconnect', handleDisconnect);
      websocketService.disconnect();
    };
  }, [sessionId, user, token]);

  // Handlers para eventos WebSocket
  const handleParticipantJoined = (participant) => {
    setParticipants(prev => [...prev, participant]);
  };

  const handleParticipantLeft = (participantId) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const handleSessionUpdate = (updatedSession) => {
    setSession(updatedSession);
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
  };

  // Ações da sessão
  const endSession = async () => {
    setStatus('ending');
    try {
      await sessionService.endSession(sessionId);
      websocketService.send('end_session', { sessionId });
      setStatus('ended');
      return true;
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
      setStatus('error');
      return false;
    }
  };

  const pauseSession = async () => {
    try {
      await sessionService.pauseSession(sessionId);
      websocketService.send('pause_session', { sessionId });
      setSession(prev => ({ ...prev, state: 'PAUSED' }));
      return true;
    } catch (err) {
      console.error('Erro ao pausar sessão:', err);
      return false;
    }
  };

  const resumeSession = async () => {
    try {
      await sessionService.resumeSession(sessionId);
      websocketService.send('resume_session', { sessionId });
      setSession(prev => ({ ...prev, state: 'ACTIVE' }));
      return true;
    } catch (err) {
      console.error('Erro ao retomar sessão:', err);
      return false;
    }
  };

  const value = {
    session,
    loading,
    error,
    status,
    participants,
    endSession,
    pauseSession,
    resumeSession,
    isTherapist: user?.role === 'THERAPIST',
    isClient: user?.role === 'CLIENT',
    sendMessage: (type, payload) => websocketService.send(type, payload)
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

SessionProvider.propTypes = {
  children: PropTypes.node.isRequired,
  sessionId: PropTypes.string,
};

export default SessionContext; 