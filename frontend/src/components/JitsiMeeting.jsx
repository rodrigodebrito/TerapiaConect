import React, { useEffect, useRef, useState } from 'react';
import { JitsiMeeting as JitsiMeetComponent } from '@jitsi/react-sdk';
import AITools from './AITools';
import { useAI } from '../contexts/AIContext';
import { toast } from 'react-toastify';
import './JitsiMeeting.css';
import PropTypes from 'prop-types';
import FallbackMeeting from './FallbackMeeting';

const JitsiMeeting = ({ 
  sessionId,
  roomName = 'terapiaconect', 
  userName = 'Usuário',
  audioEnabled = true,
  videoEnabled = true,
  onError
}) => {
  const { 
    isProcessing, 
    analyze: analyzeSession, 
    suggest: getSuggestions,
    report: generateReport 
  } = useAI();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isPipMode, setIsPipMode] = useState(false);
  const [transcription, setTranscription] = useState('');
  const apiRef = useRef(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleError = (errorMessage) => {
    console.error('Erro na reunião:', errorMessage);
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  const handlePipModeChange = (isPip) => {
    console.log('Modo PIP alterado:', isPip);
    setIsPipMode(isPip);
  };

  const handleAnalyze = async () => {
    try {
      const result = await analyzeSession(sessionId, transcription);
      console.log('Análise completa:', result);
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
    }
  };

  const handleSuggest = async () => {
    try {
      const suggestions = await getSuggestions(sessionId, transcription);
      console.log('Sugestões geradas:', suggestions);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    }
  };

  const handleReport = async () => {
    try {
      const report = await generateReport(sessionId, transcription);
      console.log('Relatório gerado:', report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const handleJitsiIFrameRef = iframeRef => {
    iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
  };

  const handleJitsiLoad = () => {
    setIsLoading(false);
  };

  const handleJaaSIFrameRef = iframeRef => {
    iframeRef.style.border = '0';
    iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
  };

  // Configurações do Jitsi
  const jitsiConfig = {
    startAsModerator: true,
    roomName: sessionId,
    configOverwrite: {
      prejoinPageEnabled: false,
      disableDeepLinking: true,
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      enableClosePage: false,
      disableInviteFunctions: true,
      p2p: {
        enabled: true,
        stunServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      DEFAULT_BACKGROUND: '#3c4043',
      DEFAULT_LOCAL_DISPLAY_NAME: 'Eu',
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'desktop', 'chat',
        'settings', 'hangup'
      ],
      SETTINGS_SECTIONS: ['devices', 'language']
    },
    userInfo: {
      displayName: userName,
      role: 'moderator'
    },
    onApiReady: (api) => {
      apiRef.current = api;
      window.jitsiApi = api; // Para acesso global (usado pelo AITools)
      
      // Adicionar listeners para status da reunião
      api.addListener('videoConferenceJoined', () => {
        setHasJoined(true);
        toast.success('Você entrou na sessão', {
          position: 'bottom-right',
          autoClose: 3000
        });
      });
      
      api.addListener('videoConferenceLeft', () => {
        setHasJoined(false);
      });
      
      api.addListener('participantJoined', (participant) => {
        toast.info(`${participant.displayName} entrou na sessão`, {
          position: 'bottom-right',
          autoClose: 3000
        });
      });
    }
  };

  if (isLoading) {
    return <div className="jitsi-loading">Carregando reunião...</div>;
  }

  if (error) {
    return (
      <div className="jitsi-error">
        <h3>Erro ao conectar à reunião</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className={`jitsi-container ${isPipMode ? 'pip-mode' : ''}`}>
      <FallbackMeeting
        roomName={roomName}
        userName={userName}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isFloating={isPipMode}
        onPipModeChange={handlePipModeChange}
        onAnalyze={handleAnalyze}
        onSuggest={handleSuggest}
        onReport={handleReport}
        isProcessing={isProcessing}
      />
    </div>
  );
};

JitsiMeeting.propTypes = {
  sessionId: PropTypes.string.isRequired,
  roomName: PropTypes.string,
  userName: PropTypes.string,
  audioEnabled: PropTypes.bool,
  videoEnabled: PropTypes.bool,
  onError: PropTypes.func
};

export default JitsiMeeting; 