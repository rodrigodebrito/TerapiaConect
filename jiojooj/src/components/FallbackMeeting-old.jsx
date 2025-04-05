import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import { toast } from 'react-toastify';
import './FallbackMeeting.css';
import './AITools.css';
import AIResultsPanel from './AIResultsPanel';

// Simple component for AI Buttons
const AIButtons = React.memo(({ onAnalyze, onSuggest, onReport, isListening, onToggleListening }) => (
  <div className="ai-tools-container">
    <div 
      className="ai-buttons-container"
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '8px 16px',
        borderRadius: '50px',
        zIndex: 999999,
      }}
    >
      <button
        onClick={onAnalyze}
        style={{
          backgroundColor: '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'sans-serif',
        }}
      >
        🧠 Analisar
      </button>
      <button
        onClick={onSuggest}
        style={{
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'sans-serif',
        }}
      >
        💡 Sugestões
      </button>
      <button
        onClick={onReport}
        style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: 'sans-serif',
        }}
      >
        📝 Relatório
      </button>
    </div>
    
    <div 
      onClick={onToggleListening}
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '150px',
        zIndex: 999999,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: isListening ? '#e74c3c' : '#2ecc71',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      <span style={{ fontSize: '22px', color: 'white' }}>
        {isListening ? '🔴' : '🎙️'}
      </span>
    </div>
  </div>
));

// Componente de fallback simplificado
const FallbackMeeting = ({
  roomName,
  userName,
  audioEnabled = true,
  videoEnabled = true,
  floating = false,
  onPipModeChange = () => {},
  onAPIReady,
}) => {
  // Estado
  const [isLoading, setIsLoading] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const containerRef = useRef(null);
  
  // API de IA
  const { analyze, suggest, report, transcript, startListening, stopListening, isListening } = useAI();
  
  // Get session ID
  const getSessionId = useCallback(() => {
    if (window?.location?.pathname) {
      const matches = window.location.pathname.match(/\/session\/([^\/]+)/);
      if (matches?.[1]) return matches[1];
    }
    
    if (!roomName) return null;
    
    const parts = roomName.split('-');
    return parts.length > 1 ? parts[parts.length - 1] : roomName;
  }, [roomName]);

  // AI actions
  const handleAnalyze = useCallback(() => {
    const sessionId = getSessionId();
    if (sessionId) {
      analyze(sessionId);
    } else {
      toast.error("Erro: ID da sessão não disponível");
    }
  }, [analyze, getSessionId]);

  const handleSuggest = useCallback(() => {
    const sessionId = getSessionId();
    if (sessionId) {
      suggest(sessionId);
    } else {
      toast.error("Erro: ID da sessão não disponível");
    }
  }, [suggest, getSessionId]);

  const handleReport = useCallback(() => {
    const sessionId = getSessionId();
    if (sessionId) {
      report(sessionId);
    } else {
      toast.error("Erro: ID da sessão não disponível");
    }
  }, [report, getSessionId]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);
  
  // Inicializar Jitsi
  useEffect(() => {
    // Função para carregar o script do Jitsi
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };
    
    // Função para inicializar o Jitsi
    const initJitsi = async () => {
      try {
        // Carregar o script do Jitsi
        await loadJitsiScript();
        
        // Verificar se temos o container e o script carregado
        if (!window.JitsiMeetExternalAPI || !containerRef.current) {
          console.error("Jitsi API não disponível ou container não encontrado");
          return;
        }
        
        // Limpar container
        containerRef.current.innerHTML = '';
        
        // Gerar nome da sala
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const roomId = `tc${timestamp}${randomSuffix}`;
        
        // Configuração básica
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomId,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: !audioEnabled,
            startWithVideoMuted: !videoEnabled
          },
          interfaceConfigOverwrite: {
            DEFAULT_BACKGROUND: '#1a1a1a',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
          },
          userInfo: {
            displayName: userName || 'Usuário'
          }
        };
        
        // Criar instância
        const api = new window.JitsiMeetExternalAPI(domain, options);
        
        // Eventos
        api.addListener('videoConferenceJoined', () => {
          setIsLoading(false);
          setShowButtons(true);
          
          // Iniciar reconhecimento após entrar
          setTimeout(() => {
            if (!isListening) {
              startListening();
            }
          }, 2000);
        });
        
        api.addListener('readyToClose', () => {
          if (isListening) {
            stopListening();
          }
        });
        
        // Disponibilizar API
        if (onAPIReady) {
          onAPIReady(api);
        }
        
        // Limpar ao desmontar
        return () => {
          if (api) {
            api.dispose();
          }
          if (isListening) {
            stopListening();
          }
        };
      } catch (error) {
        console.error('Erro ao inicializar Jitsi:', error);
        setIsLoading(false);
      }
    };
    
    // Inicializar
    initJitsi();
  }, [roomName, userName, audioEnabled, videoEnabled, onAPIReady, isListening, startListening, stopListening]);

  // Abrir uma sala alternativa
  const openAlternative = useCallback(() => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    const roomUrl = `https://8x8.vc/tc${timestamp}${randomSuffix}`;
    
    window.open(roomUrl, '_blank');
    toast.info('Sala de emergência aberta em nova aba');
  }, []);

  return (
    <div className="meeting-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Container para o Jitsi */}
      <div 
        ref={containerRef} 
        className="jitsi-container"
        style={{ 
          width: '100%',
          height: '100%',
          minHeight: '400px',
          backgroundColor: '#1a1a1a'
        }}
      ></div>
      
      {/* Indicador de carregamento */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '16px',
          zIndex: 2
        }}>
          Carregando videochamada...
        </div>
      )}
      
      {/* Botão de emergência */}
      <button
        onClick={openAlternative}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '5px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        Sala Alternativa (8x8)
      </button>
      
      {/* Botões de IA */}
      {!floating && showButtons && (
        <AIButtons 
          onAnalyze={handleAnalyze}
          onSuggest={handleSuggest}
          onReport={handleReport}
          isListening={isListening}
          onToggleListening={toggleListening}
        />
      )}
      
      {/* Exibição de transcrição */}
      {transcript && !floating && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            maxWidth: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 999998
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Transcrição:</div>
          <div>{transcript.length > 150 ? `...${transcript.substring(transcript.length - 150)}` : transcript}</div>
        </div>
      )}
      
      {/* Painel de resultados da IA */}
      <AIResultsPanel />
    </div>
  );
};

FallbackMeeting.propTypes = {
  roomName: PropTypes.string.isRequired,
  userName: PropTypes.string,
  audioEnabled: PropTypes.bool,
  videoEnabled: PropTypes.bool,
  floating: PropTypes.bool,
  onPipModeChange: PropTypes.func,
  onAPIReady: PropTypes.func,
};

export default FallbackMeeting; 