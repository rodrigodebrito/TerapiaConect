import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './FallbackMeeting.css';

// Versão simplificada do componente de videochamada
const FallbackMeeting = ({ 
  roomName, 
  userName,
  onDailyReference
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  
  // Gerar ID único para o iframe
  const iframeId = useRef(`daily-iframe-${Date.now()}`).current;
  
  // Inicializar a chamada
  useEffect(() => {
    console.log('Iniciando videochamada simplificada para sala:', roomName);
    
    // Limpar estado
    setLoading(true);
    setError(null);
    
    try {
      // Sanitizar o ID da sala
      const sanitizedRoomId = (roomName || '').substring(0, 15).replace(/[^a-zA-Z0-9-]/g, '-');
      
      // Apenas usar a URL completa para o Daily.co
      const roomUrl = `https://teraconect.daily.co/${sanitizedRoomId}?prejoin=false&skip_prejoin=true&auto_join=true`;
      
      // Criar um objeto simulado do Daily.co para compatibilidade
      const dailyObj = {
        meetingState: 'joined-meeting',
        on: (event, callback) => {
          console.log(`Registrando callback para evento: ${event}`);
          window.addEventListener(`daily-${event}`, callback);
          return dailyObj;
        },
        off: (event, callback) => {
          window.removeEventListener(`daily-${event}`, callback);
          return dailyObj;
        },
        sendAppMessage: (message) => {
          console.log('Enviando mensagem:', message);
          // Disparar evento para simular comunicação
          window.dispatchEvent(new CustomEvent('daily-app-message', { 
            detail: { data: message } 
          }));
          return dailyObj;
        },
        destroy: () => {
          console.log('Destruindo objeto Daily.co simulado');
        }
      };
      
      // Passar referência para o componente pai
      if (onDailyReference) {
        setTimeout(() => {
          onDailyReference(dailyObj);
        }, 1000);
      }
      
      // Marca como carregado
      setLoading(false);
      
    } catch (err) {
      console.error('Erro ao inicializar videochamada:', err);
      setError('Erro ao inicializar videochamada. Tente recarregar a página.');
      setLoading(false);
    }
    
    // Cleanup
    return () => {
      console.log('Limpando recursos da videochamada');
      
      // Limpar apenas as referências, sem manipular o DOM diretamente
      if (iframeRef.current) {
        iframeRef.current = null;
      }
    };
  }, [roomName, onDailyReference, iframeId]);
  
  // Construir a URL da sala
  const sanitizedRoomId = (roomName || '').substring(0, 15).replace(/[^a-zA-Z0-9-]/g, '-');
  const roomUrl = `https://teraconect.daily.co/${sanitizedRoomId}?prejoin=false&skip_prejoin=true&auto_join=true`;
  
  return (
    <div className="fallback-meeting" ref={containerRef}>
      {loading && (
        <div className="loading-container">
          <div>Carregando videochamada...</div>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <div>{error}</div>
          <button onClick={() => window.location.reload()}>
            Tentar Novamente
          </button>
        </div>
      )}
      
      {!loading && !error && (
        <iframe
          ref={iframeRef}
          key={iframeId} // Importante: key única para evitar reutilização do React
          id={iframeId}
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px'
          }}
          title="Videochamada"
        />
      )}
    </div>
  );
};

FallbackMeeting.propTypes = {
  roomName: PropTypes.string.isRequired,
  userName: PropTypes.string,
  onDailyReference: PropTypes.func
};

export default FallbackMeeting;
