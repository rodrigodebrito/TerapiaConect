import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [dailyCallObject, setDailyCallObject] = useState(null);
  
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
        
        // Tenta acessar o objeto global do Daily
        const checkDailyObject = () => {
          if (window.DailyIframe) {
            console.log('Objeto Daily encontrado:', window.DailyIframe);
            setDailyCallObject(window.DailyIframe);
          }
        };
        checkDailyObject();
        
        // Verificar periodicamente o objeto Daily
        const intervalId = setInterval(checkDailyObject, 2000);
        
        setIsInitialized(true);
        console.log('Contexto de IA inicializado com sucesso!');
        
        return () => clearInterval(intervalId);
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
  const startListening = (mode = 'realtime') => {
    if (hybridAIService.startRecording(mode)) {
      setIsListening(true);
      const modeText = mode === 'whisper' ? 'Whisper' : 'Tempo Real';
      toast.info(`Transcrição iniciada (${modeText})`, { autoClose: 2000 });
      return true;
    }
    toast.error('Não foi possível iniciar a transcrição');
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
      
      if (!text || text.trim().length < 10) {
        console.warn('[AIContext] Texto insuficiente para análise');
        toast.warning('Texto insuficiente para análise. Aguarde mais conversa.');
        
        const mockResult = {
          type: 'analysis',
          analysis: 'É necessário mais conteúdo de conversa para realizar uma análise útil.',
          content: 'Continue a conversa para receber análises baseadas na interação.'
        };
        
        setLastResult(mockResult);
        setIsProcessing(false);
        return mockResult;
      }
      
      let result;
      try {
        result = await hybridAIService.analyzeText(text);
        console.log('[AIContext] Resultado da análise:', result);
      } catch (error) {
        console.error('[AIContext] Erro no serviço de análise:', error);
        result = {
          type: 'analysis',
          error: 'Falha no serviço de análise',
          message: error.message,
          analysis: 'Não foi possível analisar a sessão atual devido a um erro técnico.',
          content: 'O serviço de IA está temporariamente indisponível.'
        };
      }
      
      // Garantir que o resultado possui um formato válido
      if (!result || !result.type) {
        result = {
          ...result,
          type: 'analysis'
        };
      }
      
      // Processar materiais referenciados se existirem
      if (result.data && result.data.referencedMaterials && result.data.referencedMaterials.length > 0) {
        console.log('[AIContext] Análise inclui materiais de referência:', result.data.referencedMaterials.length);
      } else {
        console.log('[AIContext] Análise não inclui materiais de referência');
      }
      
      // Garantir que há conteúdo de análise
      if (!result.analysis && !result.content && !result.error) {
        result.analysis = 'Não foram identificados padrões significativos na conversa atual.';
        result.content = 'Continue a sessão para permitir uma análise mais aprofundada.';
      }
      
      // Adicionar tipo para identificação no painel de resultados
      const resultWithType = { ...result, type: 'analysis' };
      setLastResult(resultWithType);
      toast.success('Análise concluída!');
      return resultWithType;
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      toast.error(`Erro ao analisar sessão: ${error.message}`);
      
      // Criar um resultado de erro com análise de fallback
      const errorResult = {
        type: 'analysis',
        error: 'Erro ao analisar sessão',
        message: error.message,
        analysis: 'Não foi possível completar a análise devido a um erro no processamento.',
        content: 'Tente novamente ou continue a sessão para gerar mais conteúdo para análise.'
      };
      
      setLastResult(errorResult);
      return errorResult;
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
      
      if (!text || text.trim().length < 10) {
        console.warn('[AIContext] Texto insuficiente para sugestões');
        toast.warning('Texto insuficiente para gerar sugestões. Aguarde mais conversa.');
        
        const mockResult = {
          type: 'suggestions',
          suggestions: ['É necessário mais conteúdo de conversa para gerar sugestões úteis.'],
          content: 'Continue a conversa para receber sugestões baseadas na interação.'
        };
        
        setLastResult(mockResult);
        setIsProcessing(false);
        return mockResult;
      }
      
      let result;
      try {
        result = await hybridAIService.generateSuggestions(text);
        console.log('[AIContext] Resultado das sugestões:', result);
      } catch (error) {
        console.error('[AIContext] Erro no serviço de sugestões:', error);
        result = {
          type: 'suggestions',
          error: 'Falha no serviço de sugestões',
          message: error.message,
          suggestions: [
            'Considere fazer perguntas abertas ao paciente.',
            'Mantenha um tom empático e acolhedor.',
            'Observe padrões de comunicação e sentimentos expressos.'
          ],
          content: 'Sugestões genéricas (o serviço de IA está indisponível no momento).'
        };
      }
      
      // Garantir que o resultado possui um formato válido
      if (!result || !result.type) {
        result = {
          ...result,
          type: 'suggestions'
        };
      }
      
      // Garantir que existem sugestões mesmo sem conteúdo da API
      if (!result.suggestions && !result.error) {
        result.suggestions = [
          'Faça perguntas que explorem sentimentos e pensamentos.',
          'Preste atenção à linguagem não-verbal.',
          'Valide os sentimentos expressos pelo paciente.'
        ];
      }
      
      // Adicionar tipo para identificação no painel de resultados
      const resultWithType = { ...result, type: 'suggestions' };
      setLastResult(resultWithType);
      toast.success('Sugestões geradas!');
      return resultWithType;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      toast.error(`Erro ao gerar sugestões: ${error.message}`);
      
      // Criar um resultado de erro com sugestões de fallback
      const errorResult = {
        type: 'suggestions',
        error: 'Erro ao gerar sugestões',
        message: error.message,
        suggestions: [
          'Considere avaliar o contexto emocional do paciente.',
          'Estabeleça objetivos claros para a sessão.',
          'Faça perguntas que explorem soluções para os problemas apresentados.'
        ],
        content: 'Sugestões genéricas (ocorreu um erro ao processar sugestões personalizadas).'
      };
      
      setLastResult(errorResult);
      return errorResult;
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
      
      if (!text || text.trim().length < 20) {
        console.warn('[AIContext] Texto insuficiente para relatório');
        toast.warning('Texto insuficiente para gerar relatório. Aguarde mais conversa.');
        
        const mockResult = {
          type: 'report',
          report: 'É necessário mais conteúdo de conversa para gerar um relatório útil.',
          content: 'Continue a conversa para receber um relatório baseado na interação.'
        };
        
        setLastResult(mockResult);
        setIsProcessing(false);
        return mockResult;
      }
      
      let result;
      try {
        result = await hybridAIService.generateReport(text);
        console.log('[AIContext] Resultado do relatório:', result);
      } catch (error) {
        console.error('[AIContext] Erro no serviço de relatório:', error);
        result = {
          type: 'report',
          error: 'Falha no serviço de relatório',
          message: error.message,
          report: 'Não foi possível gerar um relatório completo devido a limitações técnicas.'
        };
      }
      
      // Garantir que o resultado possui um formato válido
      if (!result || !result.type) {
        result = {
          ...result,
          type: 'report'
        };
      }
      
      // Garantir que há conteúdo de relatório
      if (!result.report && !result.content && !result.error) {
        result.report = 'Conteúdo insuficiente para gerar um relatório detalhado.';
        result.content = 'Continue a sessão para obter um relatório mais abrangente.';
      }
      
      // Adicionar tipo para identificação no painel de resultados
      const resultWithType = { ...result, type: 'report' };
      setLastResult(resultWithType);
      toast.success('Relatório gerado!');
      return resultWithType;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(`Erro ao gerar relatório: ${error.message}`);
      
      // Criar um resultado de erro com relatório de fallback
      const errorResult = {
        type: 'report',
        error: 'Erro ao gerar relatório',
        message: error.message,
        report: 'Não foi possível gerar o relatório devido a um erro no processamento.',
        content: 'O serviço de geração de relatórios está temporariamente indisponível.'
      };
      
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Verificar se o reconhecimento de fala é compatível com o navegador
  const isCompatible = useCallback(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }, []);
  
  // Alternar processamento local
  const toggleLocalProcessing = useCallback(() => {
    setLocalProcessing(prev => !prev);
  }, []);
  
  // Alternar anonimização
  const toggleAnonymization = useCallback(() => {
    setAnonymization(prev => !prev);
  }, []);
  
  // Função simplificada para iniciar análise da transcrição atual
  const startAnalysis = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Verificar se há texto suficiente para análise
      if (!transcript || transcript.trim().length < 10) {
        toast.warning('Texto insuficiente para análise. Aguarde mais conversa.');
        setIsProcessing(false);
        return;
      }
      
      console.log('[AIContext] Iniciando análise da transcrição');
      
      // Usar o serviço de IA para analisar o texto
      const result = await hybridAIService.analyzeText(transcript);
      
      // Formato esperado do resultado de análise
      const analysisResult = {
        summary: result.analysis || 'Não foi possível gerar um resumo da sessão.',
        keyPoints: result.keyPoints || [],
        recommendations: result.recommendations || []
      };
      
      // Atualizar o estado com o resultado da análise
      setLastResult({
        type: 'analysis',
        ...analysisResult
      });
      
      toast.success('Análise concluída!');
      return analysisResult;
    } catch (error) {
      console.error('Erro ao analisar transcrição:', error);
      toast.error(`Erro na análise: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [transcript]);
  
  return (
    <AIContext.Provider
      value={{
        isInitialized,
        isProcessing,
        isListening,
        transcript,
        emotions,
        localProcessing,
        anonymization,
        lastResult,
        dailyCallObject,
        setTranscript,
        startListening,
        stopListening,
        analyze,
        suggest,
        report,
        isCompatible,
        toggleLocalProcessing,
        toggleAnonymization,
        startAnalysis,
        analysisResult: lastResult
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

AIProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAI = () => useContext(AIContext);

export default AIContext; 