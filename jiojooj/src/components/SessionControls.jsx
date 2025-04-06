import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './SessionControls.css';

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${mins}min`;
};

const SessionControls = ({ sessionId, onStatusChange }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [sessionId]);
  
  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${sessionId}`);
      setSession(response.data);
      
      // Se a sessão estiver ativa, iniciar o temporizador
      if (response.data.status === 'ACTIVE') {
        startTimer(response.data.startTime);
      }
      
      setNotes(response.data.notes || '');
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar detalhes da sessão:', error);
      setError('Erro ao carregar informações da sessão.');
      setLoading(false);
    }
  };
  
  const startTimer = (startTime) => {
    const start = new Date(startTime).getTime();
    
    // Calcular o tempo já decorrido
    const now = new Date().getTime();
    const initialElapsed = Math.floor((now - start) / 1000 / 60);
    setElapsedTime(initialElapsed);
    
    // Configurar um intervalo para atualizar o tempo a cada minuto
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 60000);
    
    setTimerInterval(interval);
  };
  
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };
  
  const handleStartSession = async () => {
    try {
      const response = await api.post(`/sessions/${sessionId}/start`);
      
      setSession(response.data);
      startTimer(response.data.startTime);
      if (onStatusChange) onStatusChange('ACTIVE');
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      alert('Erro ao iniciar sessão. Tente novamente.');
    }
  };
  
  const handlePauseSession = async () => {
    try {
      const response = await api.post(`/sessions/${sessionId}/pause`);
      
      setSession(response.data);
      stopTimer();
      if (onStatusChange) onStatusChange('PAUSED');
    } catch (error) {
      console.error('Erro ao pausar sessão:', error);
      alert('Erro ao pausar sessão. Tente novamente.');
    }
  };
  
  const handleResumeSession = async () => {
    try {
      const response = await api.post(`/sessions/${sessionId}/resume`);
      
      setSession(response.data);
      startTimer(session.startTime);
      if (onStatusChange) onStatusChange('ACTIVE');
    } catch (error) {
      console.error('Erro ao retomar sessão:', error);
      alert('Erro ao retomar sessão. Tente novamente.');
    }
  };
  
  const handleEndSession = async () => {
    if (!window.confirm('Tem certeza que deseja encerrar a sessão?')) {
      return;
    }
    
    try {
      const response = await api.post(`/sessions/${sessionId}/end`);
      
      setSession(response.data);
      stopTimer();
      if (onStatusChange) onStatusChange('COMPLETED');
      alert('Sessão encerrada com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      alert('Erro ao encerrar sessão. Tente novamente.');
    }
  };
  
  const handleCancelSession = async () => {
    const reason = window.prompt('Por favor, informe o motivo do cancelamento:');
    if (reason === null) return; // Usuário cancelou o prompt
    
    try {
      const response = await api.post(`/sessions/${sessionId}/cancel`, {
        reason
      });
      
      setSession(response.data);
      stopTimer();
      if (onStatusChange) onStatusChange('CANCELLED');
      alert('Sessão cancelada.');
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error);
      alert('Erro ao cancelar sessão. Tente novamente.');
    }
  };
  
  const handleSaveNotes = async () => {
    try {
      const response = await api.patch(`/sessions/${sessionId}/notes`, {
        notes
      });
      
      setSession(response.data);
      setIsEditingNotes(false);
      alert('Notas salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      alert('Erro ao salvar notas. Tente novamente.');
    }
  };
  
  if (loading) {
    return <div className="session-controls loading">Carregando...</div>;
  }
  
  if (error) {
    return <div className="session-controls error">{error}</div>;
  }
  
  if (!session) {
    return <div className="session-controls error">Sessão não encontrada</div>;
  }
  
  return (
    <div className="session-controls">
      <div className="session-info">
        <h2>{session.title}</h2>
        <div className="session-meta">
          <div className="session-time">
            <span className="label">Duração Agendada:</span>
            <span className="value">{formatDuration(session.scheduledDuration)}</span>
          </div>
          <div className="session-time">
            <span className="label">Tempo Decorrido:</span>
            <span className="value">{formatDuration(elapsedTime)}</span>
          </div>
          <div className="session-status">
            <span className="label">Status:</span>
            <span className={`status-badge ${session.status.toLowerCase()}`}>
              {session.status === 'SCHEDULED' && 'Agendada'}
              {session.status === 'ACTIVE' && 'Em Andamento'}
              {session.status === 'PAUSED' && 'Pausada'}
              {session.status === 'COMPLETED' && 'Concluída'}
              {session.status === 'CANCELLED' && 'Cancelada'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="session-actions">
        {session.status === 'SCHEDULED' && (
          <button onClick={handleStartSession} className="start-session-btn">
            Iniciar Sessão
          </button>
        )}
        
        {session.status === 'ACTIVE' && (
          <>
            <button onClick={handlePauseSession} className="pause-session-btn">
              Pausar Sessão
            </button>
            <button onClick={handleEndSession} className="end-session-btn">
              Encerrar Sessão
            </button>
          </>
        )}
        
        {session.status === 'PAUSED' && (
          <>
            <button onClick={handleResumeSession} className="resume-session-btn">
              Retomar Sessão
            </button>
            <button onClick={handleEndSession} className="end-session-btn">
              Encerrar Sessão
            </button>
          </>
        )}
        
        {(session.status === 'SCHEDULED' || session.status === 'PAUSED') && (
          <button onClick={handleCancelSession} className="cancel-session-btn">
            Cancelar Sessão
          </button>
        )}
      </div>
      
      <div className="session-notes">
        <div className="notes-header">
          <h3>Notas da Sessão</h3>
          {!isEditingNotes ? (
            <button 
              onClick={() => setIsEditingNotes(true)} 
              className="edit-notes-btn"
            >
              Editar
            </button>
          ) : (
            <div className="notes-actions">
              <button onClick={handleSaveNotes} className="save-notes-btn">
                Salvar
              </button>
              <button 
                onClick={() => {
                  setIsEditingNotes(false);
                  setNotes(session.notes || '');
                }} 
                className="cancel-edit-btn"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
        
        {isEditingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes-textarea"
            placeholder="Adicione suas notas sobre a sessão aqui..."
          />
        ) : (
          <div className="notes-content">
            {session.notes ? session.notes : 'Nenhuma nota adicionada.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionControls; 