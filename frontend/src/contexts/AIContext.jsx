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
      
      // Processar materiais referenciados se existirem
      if (result.data && result.data.referencedMaterials && result.data.referencedMaterials.length > 0) {
        console.log('[AIContext] Sugestões incluem materiais de referência:', result.data.referencedMaterials.length);
      } else {
        console.log('[AIContext] Sugestões não incluem materiais de referência');
      }
      
      // Garantir que existem sugestões mesmo sem conteúdo da API
      if (!result.suggestions && !result.error) {
        result.suggestions = [
          'Faça perguntas que explorem sentimentos e pensamentos.',
          'Preste atenção à linguagem não-verbal.',
          'Valide os sentimentos expressos pelo paciente.'
        ];
      }
      
      // Adicionar tipo para identificação no painel de resultados se não estiver presente
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
          'Mantenha uma postura acolhedora e empática.',
          'Utilize técnicas de escuta ativa.',
          'Faça resumos periódicos para verificar compreensão.'
        ],
        content: 'Sugestões padrão (ocorreu um erro ao processar a solicitação).'
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
      
      if (!text || text.trim().length < 10) {
        console.warn('[AIContext] Texto insuficiente para gerar relatório');
        toast.warning('Texto insuficiente para gerar relatório. Aguarde mais conversa.');
        
        const mockResult = {
          type: 'report',
          report: 'É necessário mais conteúdo de conversa para gerar um relatório útil.',
          content: 'Continue a sessão para capturar mais informações para o relatório.'
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
          report: 'Não foi possível gerar o relatório devido a um erro técnico.',
          content: 'O serviço de IA está temporariamente indisponível.'
        };
      }
      
      // Garantir que o resultado possui um formato válido
      if (!result || !result.type) {
        result = {
          ...result,
          type: 'report'
        };
      }
      
      // Garantir que há conteúdo de relatório e extrair o campo 'report' se estiver aninhado
      if (result.success && result.report) {
        // O relatório veio diretamente no campo report (formato ideal)
        result.content = 'Relatório baseado na transcrição da sessão atual';
      } else if (result.data && result.data.report) {
        // O relatório está aninhado em data.report
        result.report = result.data.report;
        result.content = 'Relatório baseado na transcrição da sessão atual';
      } else if (result.success && !result.report) {
        // Sucesso mas o relatório não está em um campo padrão
        if (result.data) {
          // Tentar encontrar o relatório em alguma propriedade de data
          const possibleReportFields = ['content', 'text', 'analysis', 'result', 'reportText'];
          for (const field of possibleReportFields) {
            if (result.data[field]) {
              result.report = result.data[field];
              break;
            }
          }
        }
        // Se ainda não encontrou, verificar campos raiz
        if (!result.report) {
          const possibleReportFields = ['content', 'text', 'analysis', 'result', 'reportText'];
          for (const field of possibleReportFields) {
            if (result[field]) {
              result.report = result[field];
              break;
            }
          }
        }
        // Se ainda não tiver um relatório
        if (!result.report) {
          result.report = 'Não foi possível extrair um relatório detalhado da resposta.';
          result.content = 'Houve um problema na formatação do relatório.';
        }
      } else if (!result.report && !result.content && !result.error) {
        // Não há campos válidos para o relatório
        result.report = 'Não foi possível gerar um relatório detalhado para esta sessão.';
        result.content = 'A transcrição não contém informações suficientes.';
      }
      
      // Adicionar tipo para identificação no painel de resultados
      const resultWithType = { ...result, type: 'report' };
      setLastResult(resultWithType);
      toast.success('Relatório gerado com sucesso!');
      
      if (resultWithType.report || resultWithType.content) {
        // Mostrar o relatório na tela
        window.dispatchEvent(new CustomEvent('report-generated', { 
          detail: { result: resultWithType } 
        }));
      }
      
      return resultWithType;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(`Erro ao gerar relatório: ${error.message}`);
      
      // Criar um resultado de erro com relatório de fallback
      const errorResult = {
        type: 'report',
        error: 'Erro ao gerar relatório',
        message: error.message,
        report: 'Ocorreu um erro ao processar o relatório da sessão.',
        content: 'Tente novamente em alguns instantes ou continue a sessão para capturar mais informações.'
      };
      
      setLastResult(errorResult);
      return errorResult;
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