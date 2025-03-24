import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSession } from './SessionContext';
import aiService from '../services/aiService';
import websocketService from '../services/websocketService';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI deve ser usado dentro de um AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const { session, status } = useSession();
  const [aiInsights, setAiInsights] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar o sistema de transcrição ao conectar
  useEffect(() => {
    if (status === 'connected' && session?.id) {
      startListening();
      
      // Registrar listener para transcrições
      websocketService.on('transcription_update', handleTranscriptionUpdate);
      websocketService.on('ai_insight', handleAiInsight);
    } else if (status === 'ended' || status === 'error') {
      stopListening();
    }

    return () => {
      stopListening();
      websocketService.off('transcription_update', handleTranscriptionUpdate);
      websocketService.off('ai_insight', handleAiInsight);
    };
  }, [status, session]);

  // Handler para atualizações de transcrição
  const handleTranscriptionUpdate = (data) => {
    if (data && data.text) {
      setTranscript(prev => [...prev, data]);
    }
  };

  // Handler para insights de IA
  const handleAiInsight = (data) => {
    if (data && data.insight) {
      setAiInsights(data.insight);
      setIsProcessing(false);
    }
  };

  // Função para iniciar a captura de áudio
  const startListening = async () => {
    if (!session?.id) return;
    
    try {
      setIsListening(true);
      
      // Iniciar transcrição no servidor
      await aiService.startTranscription(session.id)
        .catch(() => {
          // Simulação - quando o backend estiver pronto, remover essa parte
          simulateTranscription();
        });
    } catch (err) {
      console.error('Erro ao iniciar transcrição:', err);
      setError('Falha ao iniciar o sistema de transcrição');
      setIsListening(false);
    }
  };

  // Simulação para desenvolvimento
  const simulateTranscription = () => {
    const interval = setInterval(() => {
      const mockSpeech = {
        speaker: Math.random() > 0.5 ? 'THERAPIST' : 'CLIENT',
        text: getSampleText(),
        timestamp: new Date().toISOString()
      };
      
      setTranscript(prev => [...prev, mockSpeech]);
      
      // A cada 5 transcrições, gerar um insight
      if (transcript.length > 0 && transcript.length % 5 === 0) {
        generateInsight(transcript);
      }
    }, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  };

  // Parar a captura de áudio
  const stopListening = async () => {
    if (!session?.id || !isListening) return;
    
    try {
      await aiService.stopTranscription(session.id)
        .catch(() => {
          // Simulação
          console.log('Transcrição parada (simulação)');
        });
      
      setIsListening(false);
    } catch (err) {
      console.error('Erro ao parar transcrição:', err);
    }
  };

  // Gerar insights baseados na transcrição
  const generateInsight = async (transcriptData) => {
    if (!transcriptData || transcriptData.length < 2 || !session?.id) return;
    
    setIsProcessing(true);
    try {
      const result = await aiService.generateInsights(transcriptData, session.id)
        .catch(() => {
          // Simulação
          return { 
            insight: "Baseado na conversa, parece haver um padrão de comunicação que pode ser explorado mais profundamente. Considere perguntar sobre as emoções associadas aos eventos mencionados."
          };
        });
      
      setAiInsights(result.insight);
    } catch (err) {
      console.error('Erro ao gerar insights:', err);
      setError('Falha ao processar análise de IA');
    } finally {
      setIsProcessing(false);
    }
  };

  // Obter resumo da sessão
  const getSessionSummary = async () => {
    if (!session?.id) return null;
    
    try {
      return await aiService.getSessionSummary(session.id);
    } catch (err) {
      console.error('Erro ao obter resumo da sessão:', err);
      return null;
    }
  };

  // Processar notas da sessão com IA
  const processNotes = async (notes) => {
    if (!session?.id) return null;
    
    try {
      return await aiService.processSessionNotes(session.id, notes);
    } catch (err) {
      console.error('Erro ao processar notas da sessão:', err);
      return null;
    }
  };

  // Textos de exemplo para simulação
  const getSampleText = () => {
    const sampleTexts = [
      "Tenho sentido muita ansiedade ultimamente, principalmente ao pensar no trabalho.",
      "Poderia me contar mais sobre quando esse sentimento começou?",
      "Acho que começou após a promoção, sinto que não estou à altura.",
      "É interessante notar como sua percepção mudou nesse momento de transição.",
      "Sim, antes eu me sentia confiante, agora tenho dúvidas constantes.",
      "Vamos explorar essas dúvidas para entender melhor o que está acontecendo."
    ];
    
    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  };

  const value = {
    aiInsights,
    transcript,
    isProcessing,
    isListening,
    error,
    generateInsight,
    startListening,
    stopListening,
    getSessionSummary,
    processNotes
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

AIProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AIContext; 