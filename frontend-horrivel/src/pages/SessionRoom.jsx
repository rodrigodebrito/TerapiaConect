import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSessionById, markSessionCompleted } from '../services/sessionService';
import SimplifiedVideo from '../components/SimplifiedVideo';
import { AIProvider } from '../contexts/AIContext';
import AIToolsContainer from '../components/AIToolsContainer';
import ConstellationField from '../components/ConstellationField/index.jsx';
import ConstellationField3D from '../components/ConstellationField3D/index.jsx';
import { setupConstellationSync } from '../constellation-sync';
import '../styles/SessionRoom.css';
import { ErrorBoundary } from 'react-error-boundary';
import { Helmet } from 'react-helmet-async';

// Função para formatar datas
const formattedDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString;
  }
};

// Referência global para controlar sessões e sincronizações
const globalSyncStates = {
  initializedSessions: new Set(),
  activeFields: new Map()
};

// Sistema de debug para monitorar ciclo de vida de componentes
const setupDebugMonitoring = () => {
  console.log('🔍 Inicializando sistema de monitoramento de ciclo de vida');
  
  // Registrar momentos de montagem/desmontagem
  window.componentLifecycles = window.componentLifecycles || {};
  
  // Registrar montagem de componente
  window.registerMount = (componentId) => {
    const timestamp = Date.now();
    window.componentLifecycles[componentId] = {
      mounted: timestamp,
      mountCount: (window.componentLifecycles[componentId]?.mountCount || 0) + 1
    };
    console.log(`🟢 Componente ${componentId} montado [#${window.componentLifecycles[componentId].mountCount}] em ${new Date(timestamp).toISOString()}`);
  };
  
  // Registrar desmontagem de componente
  window.registerUnmount = (componentId) => {
    const timestamp = Date.now();
    if (window.componentLifecycles[componentId]) {
      window.componentLifecycles[componentId].unmounted = timestamp;
      window.componentLifecycles[componentId].lastLifetime = 
        timestamp - window.componentLifecycles[componentId].mounted;
      
      console.log(`🔴 Componente ${componentId} desmontado após ${window.componentLifecycles[componentId].lastLifetime}ms`);
    } else {
      console.log(`🔴 Componente ${componentId} desmontado (sem registro de montagem)`);
    }
  };
  
  // Função para verificar estabilidade dos componentes
  window.checkStability = () => {
    console.log('📊 Verificando estabilidade dos componentes:');
    Object.entries(window.componentLifecycles).forEach(([id, data]) => {
      console.log(`${id}: ${data.mountCount} montagens, última duração: ${data.lastLifetime || 'ainda ativo'}ms`);
    });
  };
  
  // Configurar verificação periódica
  window.stabilityInterval = setInterval(window.checkStability, 10000);
  
  // Adicionar ao objeto window para debugging via console
  window.debugComponents = {
    getLifecycles: () => window.componentLifecycles,
    clearMonitoring: () => {
      clearInterval(window.stabilityInterval);
      window.componentLifecycles = {};
      console.log('🧹 Monitoramento de componentes limpo');
    }
  };
  
  return () => {
    // Função de limpeza
    clearInterval(window.stabilityInterval);
    window.componentLifecycles = {};
  };
};

const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPipMode, setIsPipMode] = useState(false);
  const [fullScreenElement, setFullScreenElement] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRoomMounted, setIsRoomMounted] = useState(false);
  const [showAITools, setShowAITools] = useState(true);
  const [showConstellation, setShowConstellation] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 300, height: 200 });
  const [isResizing, setIsResizing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState('');
  
  const aiContainerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const constellationContainerRef = useRef(null);
  const dailyCallRef = useRef(null);
  
  // Referência para o FallbackMeeting - evitar remontagens
  const fallbackMeetingRef = useRef(null);
  
  // Referências para elementos importantes
  const videoModeRef = useRef({
    isPip: false,
    lastChange: 0,
    skipNextChange: false,
    changedByVideo: false,
    lastFloatingValue: false,
    lastDomUpdate: 0
  });
  
  // Dentro do componente, adicionar estado para armazenar a referência de sync
  const [sync, setSync] = useState(null);
  
  // Criar referência para setupDailyMessageHandlers
  const setupDailyMessageHandlersRef = useRef(null);

  // Refs para elementos e componentes importantes
  const deviceMenuRef = useRef(null);
  const dailyCheckAttemptsRef = useRef(0);
  
  // Refs para controle de vídeo e sincronização de ações
  const suppressToastRef = useRef(false);

  // Criar um ref para controlar ativações automáticas
  const didInitialize = useRef(false);

  // Verificar se o container de AI está vazio após a montagem
  useEffect(() => {
    const checkIfAIContainerEmpty = () => {
      if (aiContainerRef.current) {
        const hasContent = aiContainerRef.current.querySelector('.persistent-ai-tools');
        if (!hasContent || (hasContent && !hasContent.childNodes.length)) {
          setShowAITools(false);
        } else {
          setShowAITools(true);
        }
      }
    };
    
    // Verificar inicialmente
    checkIfAIContainerEmpty();
    
    // Configurar um MutationObserver para monitorar mudanças no container
    const observer = new MutationObserver(checkIfAIContainerEmpty);
    
    if (aiContainerRef.current) {
      observer.observe(aiContainerRef.current, { 
        childList: true, 
        subtree: true 
      });
    }
    
    // Verificar novamente após alguns segundos para garantir
    const timer = setTimeout(checkIfAIContainerEmpty, 3000);
    
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [isRoomMounted]);

  // Carregar dados da sessão
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const data = await getSessionById(sessionId);
        setSession(data);
        
        console.log('Dados da sessão carregados:', data);
        
        // Verificar o papel do usuário atual
        const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
        if (authToken) {
          try {
            // Decodificar o token JWT para obter o ID do usuário
            const decodedToken = JSON.parse(atob(authToken.split('.')[1]));
            const currentUserId = decodedToken.id || decodedToken.userId;
            
            console.log('ID do usuário atual:', currentUserId);
            console.log('ID do terapeuta da sessão:', data.therapistId);
            
            // Configurar o nome do usuário conforme o papel
            if (data.therapist && data.therapist.userId && data.therapist.userId === currentUserId) {
              console.log('Usuário é o terapeuta que está oferecendo o serviço');
              setUserRole('therapist-provider');
              setUserName(data.therapist.name || 'Terapeuta');
            } else if (data.client && data.client.userId && data.client.userId === currentUserId) {
              console.log('Usuário é o cliente da sessão');
              setUserRole('client');
              setUserName(data.client.name || 'Cliente');
            } else {
              console.log('Usuário não identificado precisamente, usando informações do token');
              // Tentar obter nome do usuário do token se disponível
              setUserName(decodedToken.name || 'Usuário');
              // Outros casos como antes...
            }
          } catch (error) {
            console.error('Erro ao decodificar token:', error);
            // Em caso de erro, definir como terapeuta para não bloquear funcionalidades
            console.log('Erro ao verificar papel - assumindo terapeuta por segurança');
            setUserRole('therapist-provider');
          }
        } else {
          console.log('Nenhum token de autenticação encontrado');
        }
        
        document.title = `${data.title || 'Sessão'} - TerapiaConect`;
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar sessão:', err);
        // Em vez de apenas mostrar erro, criar uma sessão temporária para permitir a videochamada
        setSession({
          id: sessionId,
          title: 'Sessão Terapêutica',
          therapist: { name: 'Terapeuta' },
          isTemporary: true
        });
        setError('Usando modo temporário de videochamada');
        toast.warning('Usando modo temporário de videochamada');
        
        // Em caso de erro, permitir acesso às ferramentas por padrão
        console.log('Erro ao carregar sessão - assumindo terapeuta por padrão');
        setUserRole('therapist-provider');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      console.log(`Sessão inicializada com ID: ${sessionId}`);
      
      // Expor ID da sessão em variável global para facilitar acesso em outros componentes
      window.currentSessionData = {
        id: sessionId,
        timestamp: Date.now()
      };
      
      // Armazenar também no sessionStorage
      sessionStorage.setItem('currentSessionId', sessionId);
      
      fetchSessionData();
    }
    
    // Limpar ao desmontar
    return () => {
      if (dailyCallRef.current) {
        try {
          dailyCallRef.current.destroy();
        } catch (error) {
          console.error('Erro ao destruir dailyCall:', error);
        }
      }
      
      // Limpar referência global
      if (window.currentSessionData && window.currentSessionData.id === sessionId) {
        delete window.currentSessionData;
      }
      
      // Remover do sessionStorage se estiver saindo desta sessão
      if (sessionStorage.getItem('currentSessionId') === sessionId) {
        sessionStorage.removeItem('currentSessionId');
      }
    };
  }, [sessionId]);

  // Criar referência para a função sendUpdate no nível principal do componente
  const sendUpdateRef = useRef(null);

  // Função para lidar com mensagens recebidas sobre o estado do campo
  const handleShowConstellation = useCallback((e) => {
    // Se não tiver detalhes, verificar se o campo já está visível e ignorar
    if (!e || !e.detail) {
      if (showConstellation) {
        console.log('Campo já está visível, ignorando evento sem detalhes');
        return;
      }
    }
    
    console.log('📥 Recebeu evento show-constellation:', e);

    // Verificar se é evento válido
    const eventDetail = e.detail || {};
    console.log('Processando evento de ativação do campo', eventDetail);
      
    // IMPORTANTE: Verificar se este evento já foi processado para evitar loops
    const eventId = `activation_${eventDetail.timestamp || Date.now()}`;
    const processedEvents = window._processedEvents || [];
    if (processedEvents.includes(eventId)) {
      console.log('Ignorando evento já processado:', eventId);
      return;
    }
    
    // Registrar este evento como processado
    window._processedEvents = [...processedEvents, eventId].slice(-20);
    
    // Criar container se necessário
    try {
      console.log('FORÇA BRUTA: Ativando campo de constelação');
      
      // Garantir que temos o container no DOM
      let containerEl = document.querySelector('.constellation-container');
      if (!containerEl) {
        console.log('FORÇADO: Container do campo não existe, criando...');
        
        // Verificar se temos o container principal
        const sessionRoomEl = document.querySelector('.session-room');
        if (!sessionRoomEl) {
          console.error('Container principal da constelação não encontrado, impossível criar campo');
          return;
        }
        
        // Criar container
        containerEl = document.createElement('div');
        containerEl.className = 'constellation-container';
        containerEl.style.display = 'block';
        containerEl.style.visibility = 'visible';
        containerEl.style.opacity = '1';
        containerEl.style.zIndex = '100';
        sessionRoomEl.appendChild(containerEl);
      }
      
      // Atualizar estado React sem disparar eventos adicionais
      if (!showConstellation) {
        console.log('Atualizando estado para mostrar constelação');
        setShowConstellation(true);
      }
    } catch (err) {
      console.error('Erro ao criar container de constelação:', err);
    }
    
    // Disparar evento para notificar mudança prévia - SEM disparar eventos principais
    window.dispatchEvent(new CustomEvent('pre-constellation-change', {
      detail: {
        sessionId,
        show: true
      }
    }));
  }, [sessionId, showConstellation, setShowConstellation]);

  // Setup constellation synchronization
  useEffect(() => {
    // Verificar se a inicialização já foi feita (para evitar inicialização múltipla)
    const syncInitKey = `sync-initialized-${sessionId}`;
    if (sessionStorage.getItem(syncInitKey) === 'true') {
      console.log('Sistema de sincronização já inicializado para esta sessão');
      return;
    }
    
    console.log('Configurando sistema de sincronização para o campo de constelação');
    
    // Instalar logger global para eventos relacionados à constelação
    const originalAddEventListener = window.addEventListener;
    const originalDispatchEvent = window.dispatchEvent;
    
    // Interceptar addEventListener para logar
    window.addEventListener = function(type, listener, options) {
      // Verificar se é um evento relacionado à constelação
      if (type.includes('constellation')) {
        console.log(`[EventLogger] Registrando listener para evento: ${type}`);
      }
      
      // Chamar a função original
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Interceptar dispatchEvent para logar
    window.dispatchEvent = function(event) {
      // Verificar se é um evento relacionado à constelação
      if (event.type && event.type.includes('constellation')) {
        console.log(`[EventLogger] Disparando evento: ${event.type}`, 
          event.detail ? {
            sessionId: event.detail.sessionId,
            timestamp: event.detail.timestamp,
            show: event.detail.show
          } : '(sem detalhes)');
      }
      
      // Chamar a função original
      return originalDispatchEvent.call(this, event);
    };
    
    // Marcar como inicializado
    sessionStorage.setItem(syncInitKey, 'true');
    
    // Limpar qualquer estado persistente anterior para evitar problemas
    sessionStorage.removeItem('constellation-active');
    
    // Forçar o estado para desativado inicialmente
    setShowConstellation(false);
    
    // Remover classe do DOM se existir (para garantir estado inicial limpo)
    const sessionRoomElement = document.querySelector('.session-room');
    if (sessionRoomElement) {
      sessionRoomElement.classList.remove('with-constellation');
    }
    
    // NOVO: Inicializar sistema de sincronização
    const handleSyncStateChange = (newState, data) => {
      console.log('Recebido evento de sincronização:', { newState, hasData: !!data });
      
      if (typeof newState === 'boolean') {
        // Se o estado mudou para ativo, isso indica uma ativação remota
        if (newState === true && !showConstellation) {
          // Simular um evento de ativação
          const showEvent = new CustomEvent('constellation-show', {
            detail: {
              sessionId,
              show: true,
              remote: true,
              timestamp: Date.now(),
              source: 'sync-system'
            }
          });
          window.dispatchEvent(showEvent);
        }
      }
    };
    
    const syncInstance = setupConstellationSync(sessionId, handleSyncStateChange);
    setSync(syncInstance);
    console.log('Sistema de sincronização inicializado com sucesso');
    
    // Configurar listeners para os eventos de ativação
    window.addEventListener('constellation-show', handleShowConstellation);
    
    // Configurar listener para eventos da API de mensagens da Dailyco
    const handleDailyAppMessage = (event) => {
      try {
        if (!event || !event.data) return;
        
        console.log('Mensagem recebida da API Daily.co:', event.data);
        
        // Verificar se é do tipo que nos interessa
        if (event.data.type === 'constellation-show' || 
            event.data.type === 'constellation-toggle') {
          
          // Validar se é para esta sessão
          if (event.data.sessionId !== sessionId) {
            console.log('Mensagem para outra sessão, ignorando');
            return;
          }
          
          console.log('Recebida mensagem de ativação via Daily.co:', event.data);
          
          // Verificar se devemos ativar o campo
          if (event.data.show === true) {
            // Simular um evento de ativação
            const showEvent = new CustomEvent('constellation-show', {
              detail: {
                sessionId,
                show: true,
                remote: true,
                timestamp: Date.now(),
                source: 'daily-api',
                suppressNotification: false
              }
            });
            window.dispatchEvent(showEvent);
          }
        }
      } catch (error) {
        console.error('Erro ao processar mensagem Daily.co:', error);
      }
    };
    
    // Registrar para receber mensagens do Daily.co quando o objeto estiver disponível
    const checkForDailyAndRegister = () => {
      const dailyObj = dailyCallRef.current || window.dailyCall;
      
      console.log('Verificando disponibilidade do Daily.co:', {
        refExists: !!dailyCallRef.current,
        windowExists: !!window.dailyCall,
        dailyObj: !!dailyObj
      });
      
      // Se temos o objeto Daily de qualquer fonte
      if (dailyObj && typeof dailyObj.on === 'function') {
        console.log('Daily.co disponível, registrando para mensagens');
        
        // Armazenar nas variáveis globais se não existir
        if (!dailyCallRef.current) {
          dailyCallRef.current = dailyObj;
        }
        if (!window.dailyCall) {
          window.dailyCall = dailyObj;
        }
        
        try {
          // Inicializar sincronização com o Daily.co disponível
          if (typeof setupDailyMessageHandlersRef.current === 'function') {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setupDailyMessageHandlersRef.current(dailyObj, clientId);
            console.log('Registrado para receber mensagens Daily.co');
          } else {
            console.error('Função setupDailyMessageHandlers não está disponível ainda');
            // Tentar novamente em 500ms
            setTimeout(checkForDailyAndRegister, 500);
          }
        } catch (error) {
          console.error('Erro ao registrar para mensagens Daily.co:', error);
        }
      } else {
        // Verificar tentativas
        const tentativas = dailyCheckAttemptsRef.current = (dailyCheckAttemptsRef.current || 0) + 1;
        
        console.log(`Daily.co ainda não disponível, tentativa ${tentativas}...`);
        
        // Após 10 tentativas (em vez de 5), parar de tentar e mostrar mensagem
        if (tentativas >= 10) {
          console.warn('Muitas tentativas de conexão, usando sistema alternativo de mensagens');
          
          // Mostrar mensagem sobre o problema
          toast.warning('Problemas na conexão com o Daily.co. Algumas funcionalidades podem não estar disponíveis.', {
            position: "bottom-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          });
          
          // Não continuar tentando após a mensagem - remover o loop infinito
          return;
          
        } else {
          // Para as primeiras tentativas, usar intervalo crescente
          const delay = Math.min(2000 * tentativas, 10000); // Máximo de 10 segundos
          setTimeout(checkForDailyAndRegister, delay);
        }
      }
    };
    
    // Iniciar verificação
    checkForDailyAndRegister();
    
    // Limpeza ao desmontar
    return () => {
      // Restaurar as funções originais
      window.addEventListener = originalAddEventListener;
      window.dispatchEvent = originalDispatchEvent;
      
      // Desregistrar listeners
      window.removeEventListener('constellation-show', handleShowConstellation);
      
      // Limpar o sistema de sincronização
      if (sync && typeof sync.cleanup === 'function') {
        sync.cleanup();
      }
      
      // Remover marcação de inicialização
      sessionStorage.removeItem(syncInitKey);
      
      // Limpar o estado de ativação
      sessionStorage.removeItem('constellation-active');
      
      console.log('Sistema de sincronização para o campo de constelação foi desmontado');
    };
  }, [sessionId, handleShowConstellation, showConstellation]);

  // Monitorar mudanças no estado de tela cheia
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isDocFullScreen = document.fullscreenElement !== null || 
                              document.webkitFullscreenElement !== null ||
                              document.msFullscreenElement !== null;
      
      setIsFullScreen(isDocFullScreen);
      setFullScreenElement(document.fullscreenElement);
      
      // Mostrar controles por alguns segundos ao entrar/sair da tela cheia
      setShowControls(true);
      setTimeout(() => {
        if (!isPipMode) {
          setShowControls(false);
        }
      }, 3000);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, [isPipMode]);

  // Função simplificada para iniciar o arrasto do vídeo
  const handleMouseDown = (e) => {
    // Interromper a propagação do evento para evitar que o clique afete outros elementos
    e.stopPropagation();
    e.preventDefault();
    
    // Se o clique foi no botão para fechar ou em outro controle, não iniciar arrasto
    if (e.target.closest('.exit-constellation-btn') || e.target.closest('.video-resizer')) {
      return;
    }
    
    // Posição inicial do mouse
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Posição inicial do elemento
    const startLeft = videoPosition.x;
    const startTop = videoPosition.y;
    
    // Sinalizar que estamos arrastando
    setIsDragging(true);
    
    // Função para mover o elemento
    function handleMove(moveEvent) {
      // Calcular o deslocamento
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Atualizar a posição
      setVideoPosition({
        x: startLeft + deltaX,
        y: startTop + deltaY
      });
    }
    
    // Função para encerrar o arrasto
    function handleUp() {
      // Remover os event listeners
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      
      // Sinalizar que não estamos mais arrastando
      setIsDragging(false);
    }
    
    // Adicionar event listeners para mover e soltar
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Função simplificada para redimensionar o vídeo
  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Posição inicial do mouse
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Dimensões iniciais
    const startWidth = videoDimensions.width;
    const startHeight = videoDimensions.height;
    
    // Sinalizar que estamos redimensionando
    setIsResizing(true);
    
    // Função para redimensionar
    function handleMove(moveEvent) {
      // Calcular o deslocamento
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Atualizar as dimensões
      setVideoDimensions({
        width: Math.max(200, startWidth + deltaX),
        height: Math.max(150, startHeight + deltaY)
      });
    }
    
    // Função para encerrar o redimensionamento
    function handleUp() {
      // Remover os event listeners
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      
      // Sinalizar que não estamos mais redimensionando
      setIsResizing(false);
    }
    
    // Adicionar event listeners para mover e soltar
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Função para alternar o campo de constelação
  const handleConstellationToggle = async () => {
    try {
      console.log('Alterando visibilidade do campo de constelação...');
      
      // Inverter estado atual
      const newState = !showConstellation;
      setShowConstellation(newState);
      
      // Enviar mensagem informativa
      const message = {
        type: 'constellation-toggle',
        timestamp: Date.now(),
        clientId: `client_${Date.now()}`,
        sessionId: sessionId,
        showConstellation: newState,
        origin: 'button-click'
      };
      
      // Broadcast para outras abas/janelas via localStorage
      localStorage.setItem('constellation-event', JSON.stringify(message));
      
      // Tentar enviar via Daily.co também (tolerante a falhas)
      try {
        if (window.dailyCall && typeof window.dailyCall.sendAppMessage === 'function') {
          console.log('Enviando mensagem via Daily.co API...');
          window.dailyCall.sendAppMessage(message);
        } else {
          console.log('API Daily.co não disponível, usando apenas localStorage para comunicação');
        }
      } catch (dailyError) {
        console.log('Erro ao usar API Daily.co, continuando com localStorage:', dailyError);
      }
      
      // Atualizar localmente sem esperar pelo Daily
      console.log(`Campo de constelação ${newState ? 'ativado' : 'desativado'} com sucesso.`);
      
      // Adicionar classe visual ao body para efeitos CSS globais
      if (newState) {
        document.body.classList.add('constellation-active');
      } else {
        document.body.classList.remove('constellation-active');
      }
      
      // Disparar evento personalizado para outros componentes
      window.dispatchEvent(new CustomEvent('constellation-state-change', {
        detail: { active: newState, sessionId }
      }));
      
      // Atualizar estado de visibilidade global
      setConstellationState(newState);
      
    } catch (error) {
      console.error('Erro ao alternar campo de constelação:', error);
      toast.error('Não foi possível ativar o campo de constelação. Tente novamente.');
    }
  };

  // Alternar o modo PIP
  const handlePipModeChange = useCallback((enabled) => {
    console.log(`Modo PIP ${enabled ? 'ativado' : 'desativado'} pela videoconferência`);
    
    // Marcar que esta alteração foi iniciada pelo componente de vídeo
    videoModeRef.current.changedByVideo = true;
    videoModeRef.current.isPip = enabled;
    
    // Se o campo de constelação estiver ativo, manter ativo
    // Apenas atualizamos o modo de exibição do vídeo sem alterar o estado
    if (showConstellation && !enabled) {
      console.log('Mantendo campo de constelação ativo, apenas ajustando vídeo');
      
      // Atualizar modos de exibição diretamente no DOM sem re-renderizar
      const sessionRoomElement = document.querySelector('.session-room');
      if (sessionRoomElement) {
        if (enabled) {
          sessionRoomElement.classList.add('video-pip-mode');
        } else {
          sessionRoomElement.classList.remove('video-pip-mode');
        }
      }
    } else if (!showConstellation && enabled) {
      // Comportamento normal quando o campo não está ativo e estamos ativando o PIP
      // Atualizar o estado (isso renderiza o componente)
      setShowConstellation(true);
    } else if (showConstellation && enabled) {
      // Já está no modo que queremos, não fazer nada
      console.log('Já estamos no modo PIP, ignorando evento');
    } else if (!showConstellation && !enabled) {
      // Já está no modo que queremos, não fazer nada
      console.log('Já estamos no modo normal, ignorando evento');
    }
    
    // Resetar o flag após um pequeno delay
    setTimeout(() => {
      videoModeRef.current.changedByVideo = false;
    }, 200);
  }, [showConstellation]);

  // Definir a função setupDailyMessageHandlers
  const setupDailyMessageHandlers = useCallback((dailyCallObj, clientId) => {
    if (!dailyCallObj) {
      console.error('Objeto Daily.co inválido passado para setupDailyMessageHandlers');
      return;
    }

    try {
      console.log('Configurando listeners para mensagens...');
      
      // Remover qualquer listener existente para evitar duplicação
      try {
        dailyCallObj.off('app-message');
        console.log('Removidos listeners anteriores');
      } catch (cleanupErr) {
        console.warn('Erro ao limpar listeners anteriores:', cleanupErr);
      }
      
      // Configurar novo listener para todas as mensagens do Daily.co
      dailyCallObj.on('app-message', (evt) => {
        const message = evt.data;
        
        // Log detalhado da mensagem recebida
        console.log('📬 Mensagem recebida via Daily.co:', {
          type: message?.type,
          sessionId: message?.sessionId,
          mySessionId: sessionId,
          timestamp: new Date().toISOString()
        });
        
        // Processar mensagens relacionadas à constelação
        if (message && (
            message.type === 'constellation-show' || 
            message.type === 'constellation-toggle' ||
            message.type === 'activate-constellation'
        )) {
          console.log('Mensagem de ativação de constelação recebida:', message);
          
          // Evitar processamento de mensagens antigas
          const msgTime = message.timestamp || Date.now();
          const now = Date.now();
          if (now - msgTime > 10000) {
            console.log('Ignorando mensagem muito antiga (> 10s)');
            return;
          }
          
          // Verificar se a mensagem se aplica a esta sessão
          if (message.sessionId && message.sessionId !== sessionId) {
            console.log('Mensagem para outra sessão, ignorando');
            return;
          }
          
          // Se o campo de constelação deve ser ativado
          if (message.show === true || message.type === 'activate-constellation') {
            console.log('Mensagem indica ativação do campo - disparando evento interno');
            
            // Criar evento interno para ativar o campo
            window.dispatchEvent(new CustomEvent('constellation-show', {
              detail: {
                sessionId,
                show: true,
                remote: true,
                timestamp: Date.now(),
                source: 'daily-message',
                suppressNotification: false,
                originMessage: message
              }
            }));
            
            // Também ativar diretamente o campo via componente
            window.dispatchEvent(new CustomEvent('activate-constellation', {
              detail: {
                sessionId,
                timestamp: Date.now(),
                source: 'daily-message',
                suppressNotification: false
              }
            }));
            
            // Notificar o usuário via toast
            if (!message.suppressNotification) {
              toast.info('Campo de Constelação ativado por outro participante', {
                position: "top-right",
                autoClose: 3000
              });
            }
          } else if (message && message.type === 'constellation-update') {
            // Processar atualizações de posição/rotação dos representantes
            console.log('Recebida atualização de posição/estado para o campo:', message);
            
            // Disparar evento para componentes que precisam processar esta atualização
            window.dispatchEvent(new CustomEvent('constellation-field-update', {
              detail: {
                ...message,
                timestamp: Date.now(),
                source: 'daily-message'
              }
            }));
          } else if (message && message.type === 'client-joined') {
            // Novo cliente entrou na sala
            console.log('Novo cliente entrou na sala:', message.clientId);
            
            // Se este cliente já tem o campo ativo, notificar o novo participante
            if (showConstellation) {
              console.log('Notificando novo participante que o campo já está ativo...');
              
              setTimeout(() => {
                try {
                  dailyCallObj.sendAppMessage({
                    type: 'constellation-show',
                    show: true,
                    sessionId,
                    timestamp: Date.now(),
                    clientId,
                    forceUpdate: true,
                    source: 'existing-client'
                  }, '*');
                  
                  console.log('Notificação enviada para o novo participante');
                } catch (error) {
                  console.error('Erro ao notificar novo participante:', error);
                }
              }, 2000); // Atraso para garantir que o cliente esteja pronto
            }
          }
        }
      });
      
      console.log('✅ Listener para mensagens Daily.co configurado com sucesso');
      
      // Enviar mensagem inicial para notificar presença após um breve delay
      // para garantir que a conexão está estável
      setTimeout(() => {
        try {
          console.log('Enviando mensagem inicial de presença...');
          
          dailyCallObj.sendAppMessage({
            type: 'client-joined',
            sessionId,
            timestamp: Date.now(),
            clientId
          }, '*');
          
          console.log('Mensagem de presença enviada com sucesso');
          
          // Se o campo já estiver ativo, enviar estado para sincronizar
          if (showConstellation) {
            console.log('Campo já ativo neste cliente, notificando outros participantes...');
            
            dailyCallObj.sendAppMessage({
              type: 'constellation-show',
              show: true,
              sessionId,
              timestamp: Date.now(),
              clientId,
              forceUpdate: true
            }, '*');
            
            console.log('Mensagem de sincronização enviada com sucesso');
          }
        } catch (error) {
          console.error('Erro ao enviar mensagem inicial:', error);
        }
      }, 1500);
    } catch (err) {
      console.error('❌ Erro ao configurar listener para app-messages:', err);
    }
  }, [sessionId, showConstellation]);

  // Armazenar a função no ref para evitar problemas de dependência circular
  useEffect(() => {
    setupDailyMessageHandlersRef.current = setupDailyMessageHandlers;
  }, [setupDailyMessageHandlers]);

  // Modificar a função handleDailyReference para aguardar o estado correto da conexão antes de iniciar sincronização
  const handleDailyReference = useCallback((dailyCallObj) => {
    try {
      // Registro e validação
      console.log('🔍 Daily.co objeto atribuído para syncRef');
      dailyCallRef.current = dailyCallObj;
      
      // Verificar se o objeto é válido
      if (!dailyCallObj) {
        console.warn('⚠️ Objeto Daily.co inválido ou nulo');
        return;
      }

      // Corrigir esta parte - meetingState é uma propriedade, não um método
      // Definir estado de sincronização com base no estado da reunião
      const isConnected = dailyCallObj.meetingState && 
                          typeof dailyCallObj.meetingState === 'string' && 
                          dailyCallObj.meetingState === 'joined-meeting';
                          
      console.log(`🔄 Estado de conexão Daily.co: ${isConnected ? 'conectado' : 'desconectado'}`);
      
      // Atualizar estado
      setIsConnected(isConnected);
      
      // Lógica adicional para eventos
      if (typeof dailyCallObj.on === 'function') {
        // Registrar listeners de eventos
        dailyCallObj.on('app-message', (event) => {
          console.log('Mensagem recebida:', event);
          if (event && event.data) {
            handleDailyAppMessage(event);
          }
        })
        .on('participant-joined', (event) => {
          console.log('👥 Participante entrou:', event);
          // Aqui precisamos definir uma função handleMeetingJoined
          console.log('Novo participante na reunião');
        })
        .on('participant-left', (event) => {
          console.log('👤 Participante saiu:', event);
        });
      } else {
        console.warn('⚠️ Método .on() não disponível no objeto Daily.co');
        
        // Tentar usar o objeto simulado
        if (typeof window.addEventListener === 'function') {
          window.addEventListener('daily-app-message', (event) => {
            if (event && event.detail) {
              handleDailyAppMessage(event);
            }
          });
        }
      }
      
      // Enviar mensagem inicial após um breve delay para garantir conexão estável
      setTimeout(() => {
        try {
          if (dailyCallObj && typeof dailyCallObj.sendAppMessage === 'function') {
            dailyCallObj.sendAppMessage({
              type: 'client-joined',
              clientId: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sessionId: sessionId,
              timestamp: Date.now()
            });
            console.log('✅ Mensagem inicial de presença enviada');
          }
        } catch (e) {
          console.error('❌ Erro ao enviar mensagem inicial:', e);
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao configurar referência Daily.co:', error);
    }
  }, [sessionId]);

  // Adicionar uma função handleDailyAppMessage se não existir
  const handleDailyAppMessage = useCallback((event) => {
    try {
      const message = event.data || (event.detail ? event.detail.data : null);
      if (!message) {
        console.warn('Mensagem recebida sem dados');
        return;
      }
      
      console.log('📬 Mensagem recebida:', message);
      
      // Processar mensagens relacionadas à constelação
      if (message.type === 'constellation-show' || 
          message.type === 'constellation-toggle' ||
          message.type === 'activate-constellation') {
          
        // Verificar se a mensagem se aplica a esta sessão
        if (message.sessionId && message.sessionId !== sessionId) {
          console.log('Mensagem para outra sessão, ignorando');
          return;
        }
        
        // Se o campo de constelação deve ser ativado
        if (message.show === true || message.type === 'activate-constellation') {
          // Ativar o campo de constelação
          setShowConstellation(true);
          
          // Notificar o usuário via toast se temos a função
          if (typeof toast !== 'undefined' && !message.suppressNotification) {
            toast.info('Campo de Constelação ativado por outro participante', {
              position: "top-right",
              autoClose: 3000
            });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
    }
  }, [sessionId]);

  // Montar o componente apenas uma vez
  useEffect(() => {
    if (session && !isRoomMounted) {
      // Delay para garantir estabilidade antes de montar o componente
      const timer = setTimeout(() => {
        setIsRoomMounted(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [session, isRoomMounted]);

  // Toggle fullscreen for constellation field
  const toggleFullScreen = () => {
    if (!constellationContainerRef.current) return;
    
    if (!isFullScreen) {
      if (constellationContainerRef.current.requestFullscreen) {
        constellationContainerRef.current.requestFullscreen();
      } else if (constellationContainerRef.current.webkitRequestFullscreen) {
        constellationContainerRef.current.webkitRequestFullscreen();
      } else if (constellationContainerRef.current.msRequestFullscreen) {
        constellationContainerRef.current.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  // Adicionar efeito para garantir visibilidade do campo e do vídeo quando ativo
  useEffect(() => {
    if (showConstellation) {
      // Função para garantir visibilidade
      const ensureVisibility = () => {
        // Garantir que o campo de constelação seja visível
        const constellationContainer = document.querySelector('.constellation-container');
        if (constellationContainer) {
          constellationContainer.style.display = 'block';
          constellationContainer.style.visibility = 'visible';
          constellationContainer.style.opacity = '1';
          constellationContainer.style.zIndex = '1';
        }
        
        // Garantir que o vídeo em PIP esteja visível
        const videoContainer = document.querySelector('.video-container-pip');
        if (videoContainer) {
          videoContainer.style.display = 'block';
          videoContainer.style.visibility = 'visible';
          videoContainer.style.zIndex = '9999';
          videoContainer.style.position = 'fixed';
          videoContainer.style.right = '20px';
          videoContainer.style.top = '20px';
          videoContainer.style.width = '300px';
          videoContainer.style.height = '200px';
        }
        
        // Garantir que o container principal tenha a classe correta
        const sessionRoom = document.querySelector('.session-room');
        if (sessionRoom && !sessionRoom.classList.contains('with-constellation')) {
          sessionRoom.classList.add('with-constellation');
        }
      };
      
      // Chamar imediatamente
      ensureVisibility();
      
      // E também depois de um curto delay para garantir após renderização
      const timer1 = setTimeout(ensureVisibility, 500);
      const timer2 = setTimeout(ensureVisibility, 1000);
      
      // Configurar um intervalo para verificar periodicamente
      const interval = setInterval(ensureVisibility, 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearInterval(interval);
      };
    }
  }, [showConstellation]);

  // Sair da sessão
  const exitSession = async () => {
    try {
      // Atualizar status da sessão para concluída
      if (session && session.status === 'em_andamento') {
        await markSessionCompleted(sessionId);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao sair da sessão:', error);
      toast.error('Erro ao finalizar a sessão');
      navigate('/dashboard');
    }
  };

  // Verificar se a sessão é virtual/emergência e adaptar a experiência
  const isVirtualSession = session?.isVirtual || session?.isEmergency || false;
  
  useEffect(() => {
    if (isVirtualSession) {
      // Log para depuração
      console.log('Sessão virtual detectada:', session);
      
      // Podemos configurar comportamentos específicos para sessão virtual
      toast.info('Você está em uma sala de sessão temporária. Algumas funcionalidades podem ser limitadas.');
      
      // Podemos simular carregamento mais rápido
      if (loading) {
        setLoading(false);
      }
    }
  }, [isVirtualSession, session, loading]);
  
  // Componente de sessão virtual para quando não temos dados reais
  const VirtualSessionFallback = () => {
    return (
      <div className="virtual-session-container">
        <div className="virtual-video-container">
          <div className="virtual-video-placeholder">
            <div className="virtual-video-message">
              <h3>Sala de Sessão Temporária</h3>
              <p>Esta é uma sala de sessão temporária onde você pode se conectar com o terapeuta.</p>
              <p>Em caso de problemas técnicos, entre em contato por outros meios.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Adicionar listener para o evento que ocorre antes de ativar o campo
  useEffect(() => {
    const handlePreConstellationChange = () => {
      console.log('Evento pre-constellation-change detectado, evitando mudança de modo de vídeo');
      // Marcar para não mudar o modo de vídeo quando o estado de showConstellation mudar
      videoModeRef.current.skipNextChange = true;
    };
    
    document.addEventListener('pre-constellation-change', handlePreConstellationChange);
    
    return () => {
      document.removeEventListener('pre-constellation-change', handlePreConstellationChange);
    };
  }, []);

  // Atualizar o componente SafeVideoComponentContainer para usar o SimplifiedVideo
  const SafeVideoComponentContainer = ({ sessionId, onDailyReference }) => {
    const containerRef = useRef(null);
    const [errorCount, setErrorCount] = useState(0);
    const [mountKey, setMountKey] = useState(`video_${Date.now()}`);
    
    // Reiniciar o componente após erros
    const handleVideoError = useCallback((error) => {
      console.error('❌ Erro no componente de vídeo:', error);
      setErrorCount(prev => prev + 1);
      
      // Se tivermos muitos erros consecutivos, aguarde mais tempo
      const delayMs = Math.min(1000 * errorCount, 5000);
      
      // Reiniciar o componente com uma nova key para garantir remontagem completa
      setTimeout(() => {
        setMountKey(`video_${Date.now()}_retry${errorCount}`);
      }, delayMs);
    }, [errorCount]);
    
    // Obter nome do usuário para o componente de vídeo
    const getUserName = () => {
      // Usar dados da sessão se disponíveis
      if (session?.therapist?.name) return session.therapist.name;
      if (session?.client?.name) return session.client.name;
      
      // Valores de fallback
      return 'Usuário';
    };
    
    return (
      <div 
        ref={containerRef}
        className="video-container-wrapper"
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%',
          minHeight: '200px'
        }}
      >
        <ErrorBoundary 
          FallbackComponent={({ error }) => (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <h3>Problema na videoconferência</h3>
              <p>{error?.message || 'Ocorreu um erro durante a inicialização do vídeo'}</p>
              <button
                onClick={() => setMountKey(`video_${Date.now()}_manual`)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Tentar Novamente
              </button>
            </div>
          )}
          onError={handleVideoError}
        >
          <SimplifiedVideo
            key={mountKey}
            roomName={`room-${sessionId}`}
            userName={getUserName()}
            onDailyReference={onDailyReference}
          />
        </ErrorBoundary>
      </div>
    );
  };

  // Atualizar onde o componente é renderizado, geralmente no return do SessionRoom
  // Substitua o uso atual do FallbackMeeting
  <SafeVideoComponentContainer 
    sessionId={sessionId}
    onDailyReference={handleDailyReference}
  />

  // Chamada no useEffect principal do componente
  useEffect(() => {
    // Configurar sistema de debug para monitoramento de componentes
    const cleanupDebug = setupDebugMonitoring();
    
    // Limpar ao desmontar
    return () => {
      cleanupDebug();
    };
  }, []);

  // Lidar com erro de câmera em uso
  const handleCameraInUseError = useCallback(() => {
    console.log('Tentando liberar câmera que pode estar em uso...');
    
    // Verificar se temos streams de mídia ativos
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Tentar obter e imediatamente liberar um stream
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          console.log('Obtido stream temporário para liberar recursos');
          
          // Parar todas as tracks para liberar a câmera
          stream.getTracks().forEach(track => {
            track.stop();
            console.log(`Track ${track.kind} liberada`);
          });
          
          // Aguardar um momento para que os recursos sejam liberados
          setTimeout(() => {
            console.log('Recursos liberados, tentando reconectar...');
            // Se tivermos um callback para reconectar, chamá-lo aqui
            if (fallbackMeetingRef.current && typeof fallbackMeetingRef.current.reconnectCall === 'function') {
              fallbackMeetingRef.current.reconnectCall();
            }
          }, 1000);
        })
        .catch(err => {
          console.error('Erro ao tentar liberar câmera:', err);
          toast.error('Não foi possível acessar a câmera. Outra aplicação pode estar usando-a.');
        });
    }
  }, []);

  // Monitorar mensagens do Console para detectar erro de Câmera em Uso
  useEffect(() => {
    // Capturar mensagens de erro do console
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      // Chamar implementação original primeiro
      originalConsoleError.apply(console, args);
      
      // Verificar se é um erro de câmera em uso
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Device in use') || 
          errorMessage.includes('NotReadableError') || 
          errorMessage.includes('Cam In Use')) {
        handleCameraInUseError();
      }
    };
    
    // Também monitorar as mensagens de informação para detecção de compartilhamento de câmera
    const originalConsoleInfo = console.info;
    console.info = (...args) => {
      // Chamar implementação original primeiro
      originalConsoleInfo.apply(console, args);
      
      // Verificar mensagens de compartilhamento de mídia
      const infoMessage = args.join(' ');
      if (infoMessage.includes('getUserMedia') || 
          infoMessage.includes('Pedido de mídia') ||
          infoMessage.includes('Media request')) {
        console.log('Detectada solicitação de mídia - possível conflito com outras sessões');
      }
    };
    
    // Cleanup: restaurar função original
    return () => {
      console.error = originalConsoleError;
      console.info = originalConsoleInfo;
    };
  }, [handleCameraInUseError]);

  // Adicionar efeito para verificar outras instâncias na página
  useEffect(() => {
    const checkForMultipleSessions = () => {
      // Verificar elementos de vídeo na página
      const videoElements = document.querySelectorAll('video');
      console.log(`Detectados ${videoElements.length} elementos de vídeo na página`);
      
      if (videoElements.length > 1) {
        console.warn('Múltiplos elementos de vídeo detectados - possível conflito de câmera');
      }
      
      // Verificar iframes que podem conter chamadas Daily.co
      const dailyIframes = document.querySelectorAll('iframe[src*="daily.co"]');
      console.log(`Detectados ${dailyIframes.length} iframes Daily.co na página`);
      
      if (dailyIframes.length > 1) {
        console.warn('Múltiplos iframes Daily.co detectados - possível conflito de recursos');
        
        // Se tivermos múltiplos iframes, compartilhar o objeto Daily.co entre eles
        // para evitar que múltiplas instâncias tentem acessar a mesma câmera
        try {
          if (window.dailyCall && !window._sharedDailyInstance) {
            console.log('Compartilhando instância Daily.co para evitar conflitos');
            window._sharedDailyInstance = window.dailyCall;
          }
        } catch (e) {
          console.error('Erro ao tentar compartilhar instância Daily.co:', e);
        }
      }
    };
    
    // Executar verificação inicial
    checkForMultipleSessions();
    
    // Configurar intervalo para verificar periodicamente
    const checkInterval = setInterval(checkForMultipleSessions, 10000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  // Adicionar efeito para garantir que o campo não ativa automaticamente
  useEffect(() => {
    // Limpar qualquer estado persistido em localStorage/sessionStorage
    localStorage.removeItem(`constellation-active-${sessionId}`);
    sessionStorage.removeItem(`constellation-active-${sessionId}`);
    
    // Definir como inicializado para evitar configurações automáticas
    didInitialize.current = true;
    
    console.log('Campo de constelação explicitamente inicializado como DESATIVADO');
    
    // Forçar o estado para desativado (caso tenha sido alterado)
    setShowConstellation(false);
    
    // Remover classe visual do DOM se existir
    const sessionRoomElement = document.querySelector('.session-room');
    if (sessionRoomElement) {
      sessionRoomElement.classList.remove('with-constellation');
    }
  }, [sessionId]);

  if (loading) {
    return <div className="loading-container">Carregando sessão...</div>;
  }

  // Renderização final do componente
  return (
    <AIProvider>
      <div className="session-room">
        <Helmet>
          <title>{session?.title || 'Sessão TerapiaConect'}</title>
        </Helmet>
        
        <header className="session-header">
          <h1>TerapiaConect</h1>
          <h2>{session?.title || 'Sessão'}</h2>
          <button className="end-button" onClick={exitSession}>Encerrar Sessão</button>
        </header>
        
        <div className="main-content">
          {/* Container de vídeo */}
          <div className="video-container" style={{ height: '400px', width: '100%' }}>
            {sessionId && (
              <SimplifiedVideo 
                roomName={sessionId}
                userName={userName || 'Usuário'}
                onDailyReference={handleDailyReference}
              />
            )}
          </div>
          
          {/* Container de ferramentas */}
          <div className="tools-container" style={{ marginTop: '20px' }}>
            <AIToolsContainer 
              sessionId={sessionId}
              isHost={userRole === 'therapist'}
            />
          </div>
          
          {/* Botão para constelação */}
          <div className="constellation-controls" style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              className="toggle-constellation"
              onClick={handleConstellationToggle}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showConstellation ? 'Desativar Campo de Constelação' : 'Ativar Campo de Constelação'}
            </button>
          </div>
          
          {/* Campo de Constelação */}
          {showConstellation && (
            <div className="constellation-field" style={{ marginTop: '20px', height: '500px' }}>
              <ConstellationField3D
                sessionId={sessionId}
                isHost={userRole === 'therapist'}
                isActive={showConstellation}
              />
            </div>
          )}
        </div>
      </div>
    </AIProvider>
  );
};

export default SessionRoom;