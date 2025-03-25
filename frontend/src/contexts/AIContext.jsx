import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSession } from './SessionContext';
import aiService from '../services/ai.service';
import websocketService from '../services/websocketService';

const AIContext = createContext({});

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const { session, status } = useSession();
  const [transcripts, setTranscripts] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
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
      setTranscripts(prev => [...prev, data]);
    }
  };

  // Handler para insights de IA
  const handleAiInsight = (data) => {
    if (data && data.insight) {
      setAnalysis(data.insight);
      setLoading(false);
    }
  };

  // Função para adicionar uma transcrição
  const addTranscription = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiService.addTranscription(data);
      setTranscripts(prev => [...prev, response]);
      return response;
    } catch (error) {
      console.error('Erro ao adicionar transcrição:', error);
      setError('Não foi possível adicionar a transcrição');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para buscar transcrições
  const fetchTranscripts = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiService.getSessionTranscripts(sessionId);
      setTranscripts(response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transcrições:', error);
      setError('Não foi possível carregar as transcrições');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para analisar a sessão
  const analyzeSession = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiService.analyzeSession(sessionId);
      setAnalysis(response.analysis);
      return response.analysis;
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      setError('Não foi possível analisar a sessão');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para gerar sugestões
  const generateSuggestions = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiService.generateSuggestions(sessionId);
      setSuggestions(response.suggestions);
      return response.suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      setError('Não foi possível gerar sugestões');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para gerar relatório
  const generateReport = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiService.generateReport(sessionId);
      return response.report;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setError('Não foi possível gerar o relatório');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Função para iniciar a captura de áudio
  const startListening = async () => {
    if (!session?.id) return;
    
    try {
      setLoading(true);
      
      // Iniciar transcrição no servidor
      await aiService.startTranscription(session.id)
        .catch(() => {
          // Simulação - quando o backend estiver pronto, remover essa parte
          simulateTranscription();
        });
    } catch (err) {
      console.error('Erro ao iniciar transcrição:', err);
      setError('Falha ao iniciar o sistema de transcrição');
      setLoading(false);
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
      
      setTranscripts(prev => [...prev, mockSpeech]);
      
      // A cada 5 transcrições, gerar um insight
      if (transcripts.length > 0 && transcripts.length % 5 === 0) {
        analyzeSession(session.id);
      }
    }, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  };

  // Parar a captura de áudio
  const stopListening = async () => {
    if (!session?.id || loading) return;
    
    try {
      await aiService.stopTranscription(session.id)
        .catch(() => {
          // Simulação
          console.log('Transcrição parada (simulação)');
        });
      
      setLoading(false);
    } catch (err) {
      console.error('Erro ao parar transcrição:', err);
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
    transcripts,
    analysis,
    suggestions,
    loading,
    error,
    addTranscription,
    fetchTranscripts,
    analyzeSession,
    generateSuggestions,
    generateReport,
    clearError
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

AIProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AIContext; 