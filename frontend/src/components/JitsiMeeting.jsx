import React, { useEffect, useRef, useState } from 'react';
import { JitsiMeeting as JitsiMeetComponent } from '@jitsi/react-sdk';
import AITools from './AITools';
import aiService from '../services/aiService';
import './JitsiMeeting.css';

const JitsiMeeting = ({ sessionId, userName, onError }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const apiRef = useRef(null);

  // Funções para lidar com as ações da IA
  const handleAnalyze = async () => {
    try {
      setIsProcessing(true);
      const result = await aiService.analyzeSession(sessionId, transcription);
      console.log('Análise:', result);
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggest = async () => {
    try {
      setIsProcessing(true);
      const result = await aiService.generateSuggestions(sessionId, transcription);
      console.log('Sugestões:', result);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReport = async () => {
    try {
      setIsProcessing(true);
      const result = await aiService.generateReport(sessionId, transcription);
      console.log('Relatório:', result);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJitsiIFrameRef = iframeRef => {
    iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
  };

  const handleApiReady = apiObj => {
    apiRef.current = apiObj;
    apiObj.on('videoConferenceJoined', () => {
      setIsLoading(false);
      setHasJoined(true);
      console.log('Usuário entrou na conferência');
    });

    apiObj.on('videoConferenceLeft', () => {
      setHasJoined(false);
      console.log('Usuário saiu da conferência');
    });
  };

  if (error) {
    return (
      <div className="jitsi-error">
        <p>Erro: {error}</p>
        <button onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="jitsi-meeting-container">
      <JitsiMeetComponent
        roomName={sessionId}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          subject: 'Sessão de Terapia',
          defaultLanguage: 'pt',
          prejoinPageEnabled: false,
          enableClosePage: true,
          disableModeratorIndicator: true,
          enableLobbyChat: false,
          enableInsecureRoomNameWarning: false,
          enableClosePage: true,
          disableDeepLinking: true,
          startAsModerator: true,
          startWithVideoMuted: false,
          startWithAudioMuted: false,
          enableLobby: false,
          p2p: {
            enabled: true
          }
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'settings', 'raisehand', 'videoquality', 'filmstrip',
            'shortcuts', 'tileview'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_BACKGROUND: '#1a1a1a',
          DEFAULT_LOCAL_DISPLAY_NAME: 'Eu',
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
          SHOW_PREJOIN_PAGE: false,
          DISABLE_FOCUS_INDICATOR: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
        }}
        userInfo={{
          displayName: userName,
          role: 'moderator'
        }}
        onApiReady={handleApiReady}
        getIFrameRef={handleJitsiIFrameRef}
        onError={err => {
          console.error('Erro Jitsi:', err);
          setError(err.message || 'Erro ao iniciar videoconferência');
          if (onError) onError(err);
        }}
      />

      {hasJoined && (
        <AITools
          onAnalyze={handleAnalyze}
          onSuggest={handleSuggest}
          onReport={handleReport}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default JitsiMeeting; 