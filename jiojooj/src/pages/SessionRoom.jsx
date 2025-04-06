import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AIProvider } from '../contexts/AIContext';
import FallbackMeeting from '../components/FallbackMeeting';
import '../styles/SessionRoom.css';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { getSessionById } from '../services/sessionService';

const SessionRoom = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  // Verificar se o usuário tem acesso à sessão
  useEffect(() => {
    const checkSessionAccess = async () => {
      try {
        if (!user) {
          navigate('/login?redirect=/sessions/' + sessionId);
          return;
        }

        // Buscar a sessão pela API RESTful
        const sessionData = await getSessionById(sessionId);

        if (!sessionData) {
          setError('Sessão não encontrada');
          setLoading(false);
          return;
        }
        
        // Verifica se o usuário atual é o terapeuta ou o cliente desta sessão
        // Verifica IDs de diferentes formatos possíveis (tanto .id quanto .uid)
        const userId = user.id || user.uid;
        
        // Verificações de acesso
        let hasAccess = false;
        
        // 1. Verificação direta por ID
        if (sessionData.therapistId === userId || sessionData.clientId === userId) {
          console.log('Acesso concedido: ID do usuário corresponde ao terapeuta ou cliente da sessão');
          hasAccess = true;
        }
        // 2. Verificação por role (THERAPIST pode acessar qualquer sessão)
        else if (user.role === 'THERAPIST') {
          console.log('Acesso concedido: Usuário é terapeuta e pode acessar a sessão');
          hasAccess = true;
        }
        // 3. Verificação por role (CLIENT só pode acessar suas próprias sessões)
        else if (user.role === 'CLIENT' && sessionData.clientRole === 'CLIENT') {
          console.log('Acesso concedido: Usuário é cliente e a sessão é para clientes');
          hasAccess = true;
        }
        
        if (!hasAccess) {
          console.error('Erro de permissão:', { 
            userId, 
            userRole: user.role,
            terapeutaId: sessionData.therapistId,
            clienteId: sessionData.clientId
          });
          setError('Você não tem permissão para acessar esta sessão');
          setLoading(false);
          return;
        }

        setSession(sessionData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao verificar acesso à sessão:', err);
        setError('Erro ao verificar acesso à sessão');
        setLoading(false);
      }
    };

    checkSessionAccess();
  }, [sessionId, user, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</button>
      </div>
    );
  }

  return (
    <AIProvider>
      <div className="session-room-container">
        <div className="video-container-wrapper">
          <div className="video-container">
            <FallbackMeeting
              roomName={`session-${sessionId}`}
              userInfo={{
                displayName: user.name || user.displayName || 'Usuário',
                email: user.email,
                uid: user.id || user.uid,
                isTherapist: user.role === 'THERAPIST' || session.therapistId === (user.id || user.uid)
              }}
            />
          </div>
        </div>
      </div>
    </AIProvider>
  );
};

export default SessionRoom;