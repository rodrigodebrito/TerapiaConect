import React, { useEffect, useRef, useState } from 'react';
import { useDyteClient, DyteProvider } from '@dytesdk/react-web-core';
import { DyteMeeting } from '@dytesdk/react-ui-kit';
import { joinMeeting } from '../services/meetingService';
import aiService from '../services/aiService';
import AITools from './AITools';
import './DyteMeeting.css';

const DyteVideoMeeting = ({ sessionId, onError }) => {
  const [meeting, initMeeting] = useDyteClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const meetingEl = useRef();
  const maxReconnectAttempts = 3;

  // Funções para lidar com as ações da IA
  const handleAnalyze = async () => {
    try {
      setIsProcessing(true);
      const result = await aiService.analyzeSession(sessionId, transcription);
      // Aqui você pode mostrar o resultado em um modal ou componente de feedback
      console.log('Análise:', result);
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      // Mostrar mensagem de erro para o usuário
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggest = async () => {
    try {
      setIsProcessing(true);
      const result = await aiService.generateSuggestions(sessionId, transcription);
      // Mostrar sugestões em um componente de feedback
      console.log('Sugestões:', result);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      // Mostrar mensagem de erro para o usuário
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReport = async () => {
    try {
      setIsProcessing(true);
      const result = await aiService.generateReport(sessionId, transcription);
      // Mostrar relatório em um modal ou nova página
      console.log('Relatório:', result);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      // Mostrar mensagem de erro para o usuário
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para atualizar a transcrição
  const updateTranscription = async (text) => {
    try {
      await aiService.addTranscription(sessionId, text);
      setTranscription(prev => prev + ' ' + text);
    } catch (error) {
      console.error('Erro ao atualizar transcrição:', error);
    }
  };

  useEffect(() => {
    if (!sessionId) {
      setError('ID da sessão não fornecido');
      setIsLoading(false);
      return;
    }

    const setupMeeting = async () => {
      try {
        setIsLoading(true);
        
        // Obter token de acesso do backend
        console.log('Obtendo token para a sessão:', sessionId);
        const meetingData = await joinMeeting(sessionId);
        console.log('Dados da reunião recebidos:', meetingData);
        
        const { authToken, meetingId, roomName, clientConfig } = meetingData;
        
        if (!authToken || !meetingId) {
          throw new Error('Token de acesso ou ID da reunião não encontrado');
        }

        setDebugInfo({
          meetingId,
          roomName,
          tokenLength: authToken ? authToken.length : 0
        });

        // Inicializar cliente Dyte com configurações para usar HTTP
        console.log('Inicializando cliente Dyte com authToken e roomName:', { roomName: meetingId });
        await initMeeting({
          authToken,
          roomName: meetingId,
          defaults: {
            audio: true,
            video: true,
          },
          // Usar configurações recebidas do backend ou fallback para configurações locais
          config: clientConfig || {
            // Usar HTTP obrigatoriamente
            transportMode: 'http',
            // Desabilitar WebSockets completamente
            websocket: {
              autoConnect: false,
              maxRetries: 0,
              enabled: false
            },
            // Aumentar timeout para conexão HTTP
            timeouts: {
              httpRequest: 60000 // 60 segundos
            },
            // Usar apenas HTTP
            httpPoll: {
              enabled: true,
              pollInterval: 2000 // 2 segundos
            },
            // Desabilitar detecção automática de endpoint
            autoDetectEndpoint: false,
            // Reduzir qualidade de vídeo se necessário
            priorityQuality: ['bandwidth', 'fps', 'resolution'],
            // Informações de debug
            logLevel: 'error',
            userInfo: {
              name: meetingData.userName || 'Usuário TerapiaConect',
              picture: 'https://ui-avatars.com/api/?name=Usuario&background=random&color=fff'
            }
          }
        });

        console.log('Cliente Dyte inicializado com sucesso');
        setIsLoading(false);
        // Resetar contador de tentativas em caso de sucesso
        setReconnectAttempts(0);
      } catch (error) {
        console.error('Erro ao configurar reunião Dyte:', error);
        console.error('Detalhes do erro:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Tentar reconectar se não excedeu o limite de tentativas
        if (reconnectAttempts < maxReconnectAttempts && 
            (error.message?.includes('socket is not connected') || 
             error.message?.includes('Websocket Network Error'))) {
          
          setReconnectAttempts(prev => prev + 1);
          console.log(`Tentativa de reconexão ${reconnectAttempts + 1} de ${maxReconnectAttempts}...`);
          
          // Aguardar 2 segundos antes de tentar novamente
          setTimeout(() => {
            setupMeeting();
          }, 2000);
          
          return;
        }
        
        setError(error.message || 'Erro ao iniciar videoconferência');
        setIsLoading(false);
        if (onError) onError(error);
      }
    };

    setupMeeting();

    return () => {
      // Limpar recursos quando o componente for desmontado
      if (meeting) {
        console.log('Limpando recursos da reunião');
        meeting.leaveRoom();
      }
    };
  }, [sessionId, initMeeting, onError, reconnectAttempts]);

  if (isLoading) {
    return (
      <div className="dyte-loading">
        <div className="loading-spinner"></div>
        <p>Inicializando videoconferência{reconnectAttempts > 0 ? ` (Tentativa ${reconnectAttempts}/${maxReconnectAttempts})` : ''}...</p>
        {debugInfo && (
          <div className="debug-info">
            <p><small>MeetingID: {debugInfo.meetingId}</small></p>
            <p><small>RoomName: {debugInfo.roomName}</small></p>
            <p><small>Token Length: {debugInfo.tokenLength}</small></p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="dyte-error">
        <p>Erro: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="retry-button"
        >
          Tentar novamente
        </button>
        {debugInfo && (
          <div className="debug-info">
            <p><small>MeetingID: {debugInfo.meetingId}</small></p>
            <p><small>RoomName: {debugInfo.roomName}</small></p>
            <p><small>Token Length: {debugInfo.tokenLength}</small></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dyte-meeting-container" ref={meetingEl}>
      {meeting && (
        <>
          <DyteProvider value={meeting}>
            <DyteMeeting
              meeting={meeting}
              showSetupScreen
              uiConfig={{
                controlBar: true,
                header: true,
                participantCount: true,
                layout: {
                  grid: {
                    fit: 'contain',
                  },
                },
                colors: {
                  primary: '#3498db',
                  secondary: '#2980b9',
                  textPrimary: '#ffffff',
                  videoBackground: '#1a2531',
                },
                dimensions: {
                  controlBar: {
                    height: '80px',
                  },
                },
              }}
            />
          </DyteProvider>
          
          <AITools
            onAnalyze={handleAnalyze}
            onSuggest={handleSuggest}
            onReport={handleReport}
            isProcessing={isProcessing}
          />
        </>
      )}
    </div>
  );
};

export default DyteVideoMeeting; 