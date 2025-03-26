import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import hybridAIService from '../services/hybridAI.service';
import { initializeTensorFlow, isTfInitialized } from '../services/tfHelper';

// Criar o contexto
const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [emotions, setEmotions] = useState({});
  const [localProcessing, setLocalProcessing] = useState(true);
  const [anonymization, setAnonymization] = useState(true);
  const [lastResult, setLastResult] = useState(null);
  
  // Inicializar o serviço
  useEffect(() => {
    const initialize = async () => {
      try {
        // Inicializar TensorFlow apenas uma vez
        console.log('Inicializando TensorFlow...');
        await initializeTensorFlow({ logLevel: 0 });
        console.log('TensorFlow inicializado com sucesso!');
        
        // Configurar ouvintes de eventos
        window.addEventListener('transcript-updated', handleTranscriptUpdate);
        window.addEventListener('emotion-detected', handleEmotionDetected);
        window.addEventListener('recording-started', () => setIsListening(true));
        window.addEventListener('recording-stopped', () => setIsListening(false));
        
        setIsInitialized(true);
        console.log('Contexto de IA inicializado com sucesso!');
      } catch (error) {
        console.error('Erro ao inicializar contexto de IA:', error);
        toast.error('Erro ao inicializar recursos de IA');
      }
    };
    
    initialize();
    
    // Limpar ouvintes de eventos ao desmontar
    return () => {
      window.removeEventListener('transcript-updated', handleTranscriptUpdate);
      window.removeEventListener('emotion-detected', handleEmotionDetected);
      window.removeEventListener('recording-started', () => setIsListening(true));
      window.removeEventListener('recording-stopped', () => setIsListening(false));
    };
  }, []);
  
  // Manipuladores de eventos
  const handleTranscriptUpdate = (event) => {
    setTranscript(event.detail.fullText);
  };
  
  const handleEmotionDetected = (event) => {
    setEmotions(event.detail.accumulated);
  };
  
  // Funções para iniciar/parar reconhecimento de voz
  const startListening = () => {
    if (hybridAIService.startRecording()) {
      setIsListening(true);
      toast.info('Reconhecimento de voz iniciado', { autoClose: 2000 });
      return true;
    }
    toast.error('Não foi possível iniciar o reconhecimento de voz');
    return false;
  };
  
  const stopListening = () => {
    if (hybridAIService.stopRecording()) {
      setIsListening(false);
      toast.info('Reconhecimento de voz finalizado', { autoClose: 2000 });
      return true;
    }
    toast.error('Não foi possível finalizar o reconhecimento de voz');
    return false;
  };
  
  // Função de análise
  const analyze = async (sessionId, text = transcript) => {
    try {
      setIsProcessing(true);
      toast.info('Analisando sessão...', { autoClose: 2000 });
      
      console.log(`[AIContext] Iniciando análise para sessão: ${sessionId}`);
      console.log(`[AIContext] Texto para análise: ${text.substring(0, 50)}...`);
      
      const result = await hybridAIService.analyzeText(text);
      console.log('[AIContext] Resultado da análise:', result);
      
      setLastResult(result);
      toast.success('Análise concluída!');
      return result;
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      toast.error(`Erro ao analisar sessão: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Função para gerar sugestões
  const suggest = async (sessionId, text = transcript) => {
    try {
      setIsProcessing(true);
      toast.info('Gerando sugestões...', { autoClose: 2000 });
      
      console.log(`[AIContext] Iniciando sugestões para sessão: ${sessionId}`);
      console.log(`[AIContext] Texto para sugestões: ${text.substring(0, 50)}...`);
      
      const result = await hybridAIService.generateSuggestions(text);
      console.log('[AIContext] Resultado das sugestões:', result);
      
      setLastResult(result);
      toast.success('Sugestões geradas!');
      return result;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      toast.error(`Erro ao gerar sugestões: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Função para gerar relatório
  const report = async (sessionId, text = transcript) => {
    try {
      setIsProcessing(true);
      toast.info('Gerando relatório...', { autoClose: 2000 });
      
      console.log(`[AIContext] Iniciando relatório para sessão: ${sessionId}`);
      console.log(`[AIContext] Texto para relatório: ${text.substring(0, 50)}...`);
      
      if (!text || text.trim().length < 10) {
        console.warn('[AIContext] Texto insuficiente para gerar relatório');
        toast.warning('Texto insuficiente para gerar relatório. Aguarde mais conversa.');
        setIsProcessing(false);
        return { error: 'Texto insuficiente' };
      }
      
      const result = await hybridAIService.generateReport(text);
      console.log('[AIContext] Resultado do relatório:', result);
      
      setLastResult(result);
      toast.success('Relatório gerado com sucesso!');
      
      if (result.content) {
        // Mostrar o relatório na tela
        window.dispatchEvent(new CustomEvent('report-generated', { 
          detail: { result } 
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(`Erro ao gerar relatório: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Funções para configuração
  const toggleLocalProcessing = () => {
    const newValue = !localProcessing;
    hybridAIService.setLocalProcessing(newValue);
    setLocalProcessing(newValue);
    toast.info(`Processamento local ${newValue ? 'ativado' : 'desativado'}`, { autoClose: 2000 });
  };
  
  const toggleAnonymization = () => {
    const newValue = !anonymization;
    hybridAIService.setAnonymization(newValue);
    setAnonymization(newValue);
    toast.info(`Anonimização ${newValue ? 'ativada' : 'desativada'}`, { autoClose: 2000 });
  };
  
  // Verificar compatibilidade
  const isCompatible = () => {
    return hybridAIService.isSpeechRecognitionSupported();
  };
  
  // Limpar transcrição
  const clearTranscript = () => {
    setTranscript('');
    setEmotions({});
  };
  
  // Contexto para compartilhar
  const contextValue = {
    isInitialized,
    isProcessing,
    isListening,
    transcript,
    emotions,
    localProcessing,
    anonymization,
    lastResult,
    startListening,
    stopListening,
    analyze,
    suggest,
    report,
    toggleLocalProcessing,
    toggleAnonymization,
    isCompatible,
    clearTranscript
  };
  
  // Exportar para o window para permitir acesso fora do React
  if (typeof window !== 'undefined') {
    window.__AI_CONTEXT = contextValue;
    // Disparar evento sempre que houver uma mudança no isProcessing ou emotions
    useEffect(() => {
      window.dispatchEvent(new CustomEvent('ai-context-updated', { 
        detail: { 
          isProcessing,
          emotions,
          transcript,
          lastResult
        } 
      }));
    }, [isProcessing, emotions, transcript, lastResult]);
  }
  
  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

AIProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Hook personalizado para usar o contexto
export const useAI = () => {
  const context = useContext(AIContext);
  
  if (!context) {
    throw new Error('useAI deve ser usado dentro de um AIProvider');
  }
  
  return context;
};

export default AIContext; 