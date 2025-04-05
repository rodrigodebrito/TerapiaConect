// Sistema de sincronização do Campo de Constelação
export function setupConstellationSync(sessionId, onStateChange) {
  console.log('Configurando sistema de sincronização do Campo de Constelação');
  
  // LIMPEZA INICIAL - remover todos os event listeners antigos
  const cleanupEvents = ['constellation-toggle', 'constellation-update', 'constellation-field-updated',
                        'constellation-sync-field', 'constellation-sync-force', 'constellation-request-sync',
                        'constellation-updated', 'constellation-show'];
  
  cleanupEvents.forEach(eventName => {
    // Disparar evento de limpeza
    try {
      const cleanupEvent = new CustomEvent(`${eventName}-cleanup`, {
        detail: {
          sessionId,
          timestamp: Date.now(),
          cleanup: true
        }
      });
      window.dispatchEvent(cleanupEvent);
      console.log(`Disparado evento de limpeza para ${eventName}`);
    } catch (error) {
      console.error(`Erro ao disparar evento de limpeza para ${eventName}:`, error);
    }
  });
  
  // Cache para evitar processamento duplicado de mensagens - usando Map corretamente
  const processedMessages = new Map();
  
  // Controle de debounce para evitar spam de mensagens
  let lastProcessedTime = 0;
  const DEBOUNCE_TIME = 100; // tempo em ms para debounce
  const MAX_MESSAGE_CACHE = 100; // tamanho máximo do cache
  
  // Identificador único para este cliente
  const SYNC_ID = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`Sistema de sincronização inicializado com ID: ${SYNC_ID}`);
  console.log(`ID do cliente: ${CLIENT_ID}`);
  
  // Lista de event listeners registrados para limpeza
  const registeredListeners = [];
  
  // Estado de ativação para evitar ativação múltipla
  let isActivationInProgress = false;
  let lastActivationTime = 0;
  
  // Função para registrar listeners com limpeza adequada
  function registerListener(eventName, handler) {
    window.addEventListener(eventName, handler);
    registeredListeners.push({ eventName, handler });
    
    console.log(`[Sync ${SYNC_ID}] Registrado listener para ${eventName}`);
    return () => {
      window.removeEventListener(eventName, handler);
      const index = registeredListeners.findIndex(l => l.eventName === eventName && l.handler === handler);
      if (index !== -1) {
        registeredListeners.splice(index, 1);
      }
    };
  }
  
  // Registrar evento de limpeza para limpar todos os listeners
  registerListener('constellation-cleanup', () => {
    console.log(`[Sync ${SYNC_ID}] Recebido evento de limpeza global`);
    cleanupAllListeners();
  });
  
  // Função para verificar e remover mensagens antigas do cache
  function cleanMessageCache() {
    if (processedMessages.size > MAX_MESSAGE_CACHE) {
      // Converter para array, ordenar por timestamp e remover os mais antigos
      const entries = Array.from(processedMessages.entries());
      entries.sort((a, b) => a[1] - b[1]);
      
      // Remover os 20% mais antigos
      const removeCount = Math.floor(MAX_MESSAGE_CACHE * 0.2);
      entries.slice(0, removeCount).forEach(([key]) => {
        processedMessages.delete(key);
      });
      
      console.log(`[Sync ${SYNC_ID}] Limpeza de cache: removidas ${removeCount} mensagens antigas`);
    }
  }
  
  // Função para verificar se uma mensagem já foi processada
  function isMessageProcessed(messageId) {
    // Verificar se a mensagem já foi processada
    return processedMessages.has(messageId);
  }
  
  // Função para marcar uma mensagem como processada
  function markMessageAsProcessed(messageId) {
    processedMessages.set(messageId, Date.now());
    cleanMessageCache();
  }
  
  // Manipulador para mensagens
  function handleMessage(event) {
    if (!event || !event.data) return;
    
    // Verificar tipo de mensagem
    const isToggleType = event.data.type === 'constellation-toggle';
    const isUpdateType = event.data.type === 'constellation-update';
    const isDataObject = typeof event.data.updateData === 'object' || typeof event.data.data === 'object';
    
    // Se não for um dos tipos aceitos, ignorar
    if (!isToggleType && !isUpdateType && !isDataObject) return;
    
    // Se não for para esta sessão, ignorar
    if (event.data.sessionId !== sessionId) return;
    
    // Dados da mensagem
    let messageData = event.data;
    
    // Para mensagens da Daily.co, os dados estão em data
    if (event.data.data && typeof event.data.data === 'object') {
      messageData = event.data.data;
    }
    
    // Verificar se há forceUpdate - processar SEMPRE
    const isForceUpdate = messageData.forceUpdate === true;
    
    // Se a mensagem veio deste cliente, ignorar para evitar eco a menos que force update
    if (messageData.clientId === CLIENT_ID && !isForceUpdate) {
      console.log('Ignorando mensagem do próprio cliente (eco)');
      return;
    }
    
    // Verificar se veio do nosso próprio sistema de sincronização
    if (messageData.syncId === SYNC_ID && !isForceUpdate) {
      console.log('Ignorando mensagem do próprio sistema de sincronização');
      return;
    }
    
    // Aplicar debounce baseado em tempo, exceto para forceUpdate
    if (!isForceUpdate) {
      const now = Date.now();
      if (now - lastProcessedTime < DEBOUNCE_TIME) {
        console.log('Ignorando mensagem (debounce de tempo)');
        return;
      }
    }
    
    // Verificar se já processamos esta mensagem específica usando timestamp ou eventId como identificador único
    const messageId = messageData.eventId || (messageData.timestamp ? `${messageData.timestamp}-${messageData.type || 'update'}` : null);
    
    if (messageId) {
      if (isMessageProcessed(messageId)) {
        // Mensagem já processada, ignorar EXCETO se for forceUpdate
        if (!isForceUpdate) {
          console.log('Ignorando mensagem duplicada:', messageId);
          return;
        } else {
          console.log('Processando mensagem duplicada devido a forceUpdate:', messageId);
        }
      }
      
      // Adicionar ao cache de mensagens processadas
      markMessageAsProcessed(messageId);
      lastProcessedTime = Date.now();
      
      // Limpar cache antigo (manter apenas as últimas X mensagens)
      if (processedMessages.size > MAX_MESSAGE_CACHE) {
        const oldestMessages = Array.from(processedMessages.entries()).slice(0, processedMessages.size - MAX_MESSAGE_CACHE);
        oldestMessages.forEach(([key]) => processedMessages.delete(key));
      }
    }
    
    console.log('Processando mensagem de sincronização:', messageData);
    
    // Encaminhar para o handler apropriado
    if (isToggleType) {
      // Notificar o handler fornecido
      onStateChange(messageData.showConstellation);
      
      // Também disparar um evento para o campo 3D
      const toggleEvent = new CustomEvent('constellation-toggle', {
        detail: {
          sessionId,
          show: messageData.showConstellation,
          timestamp: Date.now(),
          source: 'sync'
        }
      });
      window.dispatchEvent(toggleEvent);
      
      console.log('Disparado evento constellation-toggle para campo 3D');
    } else {
      // Extrair dados de atualização
      const updateData = messageData.updateData || messageData;
      
      // Processar atualização do campo, representantes e câmera
      if (typeof onStateChange === 'function') {
        onStateChange(true, updateData);
      }
      
      // Disparar evento para o campo 3D
      const fieldUpdateEvent = new CustomEvent('constellation-field-updated', {
        detail: {
          sessionId,
          data: updateData
        }
      });
      window.dispatchEvent(fieldUpdateEvent);
      
      console.log('Disparado evento constellation-field-updated para campo 3D');
    }
  }
  
  // Adicionar listener usando nossa função registradora
  registerListener('message', handleMessage);
  
  // Debounce para envio de mensagens
  let sendToggleTimeout = null;
  let sendUpdateTimeout = null;
  let lastSentToggleTime = 0;
  let lastSentUpdateTime = 0;
  const MIN_TOGGLE_INTERVAL = 300; // Limitar a 300ms entre mensagens
  const MIN_UPDATE_INTERVAL = 100;
  
  // Função para enviar atualizações de modo (toggle)
  function sendToggleUpdate(newState, dailyCallObj) {
    try {
      if (!dailyCallObj) {
        console.warn('Objeto Daily não disponível para enviar mensagem');
        return;
      }
      
      // Gerar ID exclusivo para essa mensagem
      const messageId = `toggle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Registrar esta mensagem para evitar processamento duplicado
      processedMessages.set(messageId, Date.now());
      
      // Construir mensagem
      const messageData = {
        type: 'constellation-toggle',
        sessionId: sessionId,
        showConstellation: newState,
        timestamp: Date.now(),
        syncId: SYNC_ID,
        clientId: CLIENT_ID,
        messageId: messageId
      };
      
      // Tentar enviar via daily.co
      dailyCallObj.sendAppMessage(messageData, '*');
      console.log(`Mensagem de toggle enviada via Daily: ${messageId}`);
    } catch (error) {
      console.error('Erro ao enviar atualização:', error);
    }
  }
  
  // Função para enviar atualizações do campo (representantes e câmera)
  function sendFieldUpdate(updateData, dailyCallObj) {
    try {
      if (!dailyCallObj) {
        console.warn('Objeto Daily não disponível para enviar dados do campo');
        return;
      }
      
      // Validar dados
      if (!updateData || typeof updateData !== 'object') {
        console.warn('Dados de atualização inválidos');
        return;
      }
      
      // Gerar ID exclusivo para essa mensagem
      const messageId = `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Registrar esta mensagem para evitar processamento duplicado
      processedMessages.set(messageId, Date.now());
      
      // Construir mensagem completa
      const messageData = {
        type: 'constellation-update',
        sessionId: sessionId,
        updateData: updateData,
        timestamp: Date.now(),
        syncId: SYNC_ID,
        clientId: CLIENT_ID,
        messageId: messageId
      };
      
      // Tentar enviar via daily.co
      dailyCallObj.sendAppMessage(messageData, '*');
      console.log(`Mensagem de atualização de campo enviada: ${messageId}`);
    } catch (error) {
      console.error('Erro ao enviar dados do campo:', error);
    }
  }
  
  // Função para forçar sincronização
  function forceSyncNow(currentState, fieldData, dailyCallObj) {
    try {
      console.log(`Forçando sincronização, estado: ${currentState}`);
      
      // Se não temos Daily.co, tentar com evento direto
      if (!dailyCallObj) {
        // Disparar um evento local para notificar
        window.dispatchEvent(new CustomEvent('constellation-sync-force', {
          detail: {
            sessionId,
            showConstellation: currentState,
            forceUpdate: true,
            timestamp: Date.now()
          }
        }));
        
        window.dispatchEvent(new CustomEvent('constellation-request-sync', {
          detail: {
            sessionId,
            timestamp: Date.now()
          }
        }));
        
        return;
      }
      
      // Se temos Daily.co, enviar mensagem normal com flag forceUpdate
      const messageId = `force_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      processedMessages.set(messageId, Date.now());
      
      const messageData = {
        type: 'constellation-toggle',
        sessionId: sessionId,
        showConstellation: currentState,
        timestamp: Date.now(),
        syncId: SYNC_ID,
        clientId: CLIENT_ID,
        messageId: messageId,
        forceUpdate: true
      };
      
      // Tentar enviar via daily.co
      dailyCallObj.sendAppMessage(messageData, '*');
      console.log(`Mensagem forceSync enviada: ${messageId}`);
      
      // Se temos dados do campo, enviar também
      if (fieldData && typeof fieldData === 'object') {
        sendFieldUpdate({
          ...fieldData,
          forceUpdate: true
        }, dailyCallObj);
      }
    } catch (error) {
      console.error('Erro ao forçar sincronização:', error);
    }
  }
  
  // Limpar todos os listeners
  function cleanupAllListeners() {
    console.log(`Limpando ${registeredListeners.length} event listeners`);
    
    // Remover todos os listeners registrados
    registeredListeners.forEach(({ eventName, handler }) => {
      window.removeEventListener(eventName, handler);
    });
    
    // Limpar array
    registeredListeners.length = 0;
  }
  
  return {
    sendToggleUpdate,
    sendFieldUpdate,
    forceSyncNow,
    cleanup: cleanupAllListeners,
    clientId: CLIENT_ID,
    syncId: SYNC_ID
  };
} 