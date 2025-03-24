import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSessionById } from '../services/sessionService';
import Button from '../components/Button';

const DirectJitsi = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [sessionDetails, setSessionDetails] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Gerar o nome da sala Jitsi
        const room = sessionId 
          ? `terapiaconect-${sessionId.replace(/[^a-zA-Z0-9]/g, '')}`
          : `terapiaconect-${Date.now()}`;
        
        setRoomName(room);
        
        // Buscar detalhes da sessão
        const sessionData = await getSessionById(sessionId);
        setSessionDetails(sessionData);
        
        // Abrir o Jitsi Meet em uma nova aba
        window.open(`https://8x8.vc/${room}`, '_blank');
        
      } catch (error) {
        console.error('Erro ao preparar sessão:', error);
        toast.error('Não foi possível iniciar a videoconferência.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  return (
    <div style={{ 
      padding: '30px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      textAlign: 'center',
      marginTop: '50px'
    }}>
      <h1>Videoconferência TerapiaConect</h1>
      
      {loading ? (
        <p>Preparando sua videoconferência...</p>
      ) : (
        <>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            margin: '20px 0',
            border: '1px solid #e0e0e0'
          }}>
            <h2>Sua videoconferência foi aberta em uma nova janela</h2>
            <p>Se a janela não abriu automaticamente, clique no botão abaixo:</p>
            
            <Button 
              onClick={() => window.open(`https://8x8.vc/${roomName}`, '_blank')}
              variant="primary"
              style={{ marginTop: '15px', marginBottom: '15px' }}
            >
              Abrir Videoconferência
            </Button>
            
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              <strong>Link da sala:</strong> <a href={`https://8x8.vc/${roomName}`} target="_blank" rel="noopener noreferrer">https://8x8.vc/{roomName}</a>
            </p>
          </div>
          
          {sessionDetails && (
            <div style={{ textAlign: 'left', margin: '20px 0' }}>
              <h3>Detalhes da Sessão</h3>
              <p><strong>Data:</strong> {new Date(sessionDetails.date).toLocaleDateString('pt-BR')}</p>
              <p><strong>Horário:</strong> {sessionDetails.startTime} às {sessionDetails.endTime}</p>
              <p><strong>Terapeuta:</strong> {sessionDetails.therapist?.user?.name || 'Nome não disponível'}</p>
              <p><strong>Cliente:</strong> {sessionDetails.client?.user?.name || 'Nome não disponível'}</p>
            </div>
          )}
          
          <Button onClick={() => navigate(`/session/${sessionId}`)} variant="secondary">
            Voltar para a Sala de Sessão
          </Button>
        </>
      )}
    </div>
  );
};

export default DirectJitsi; 