import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
// Removendo a importação do firebase que não existe
// import { db } from '../firebase';

// Cores para os representantes
const REPRESENTATIVE_COLORS = [
  '#4285F4', '#EA4335', '#FBBC05', '#34A853',
  '#FF6D01', '#46BDC6', '#9C27B0', '#795548',
  '#FFFFFF', '#000000'
];

// Tipos de representantes
const REPRESENTATIVE_TYPES = {
  MALE_ELDER: {
    id: 'male_elder',
    name: 'Homem Idoso',
    modelPath: '/representantes/06 - Representante Idoso Masculino.glb'
  },
  FEMALE_ELDER: {
    id: 'female_elder',
    name: 'Mulher Idosa',
    modelPath: '/representantes/05 - Representante Idoso Feminino.glb'
  },
  MALE_ADULT: {
    id: 'male_adult',
    name: 'Homem Adulto',
    modelPath: '/representantes/01 - Representante Adulto Masculino.glb'
  },
  FEMALE_ADULT: {
    id: 'female_adult',
    name: 'Mulher Adulta',
    modelPath: '/representantes/02 - Representante Adulto Feminino.glb'
  },
  MALE_CHILD: {
    id: 'male_child',
    name: 'Menino',
    modelPath: '/representantes/04 - Representante Criança Masculino.glb'
  },
  FEMALE_CHILD: {
    id: 'female_child',
    name: 'Menina',
    modelPath: '/representantes/03 - Representante Criança Feminino.glb'
  },
  SUBJETIVO_LONGO: {
    id: 'subjetivo_longo',
    name: 'Subjetivo Longo',
    modelPath: '/representantes/Subjetivo Longo.glb'
  },
  SUBJETIVO_CURTO: {
    id: 'subjetivo_curto',
    name: 'Subjetivo Curto',
    modelPath: '/representantes/Subjetivo curto.glb'
  }
};

// Criar o contexto
export const ConstellationContext = createContext();

// Chave global para armazenamento
const getGlobalStorageKey = (sessionId) => `global_constellation_${sessionId}`;

// Cache para evitar múltiplas inicializações de contextos para a mesma sessão
const ACTIVE_SESSIONS = new Map();

// Identificador único para este cliente
const CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Cache para representantes compartilhados
let globalRepresentativesCache = null;
let lastUpdateTimestamp = 0;

// Sistema de bloqueio por token para controlar quem pode sincronizar
const SYNC_LOCK_KEY = 'constellation_sync_lock';
let syncLocked = false;
let lockTimeout = null;
const LOCK_TIMEOUT_DURATION = 10000; // 10 segundos de bloqueio máximo
const PROCESSED_EVENTS_KEY = 'constellation_processed_events';
const MAX_PROCESSED_EVENTS = 50;

// Função para verificar se um evento já foi processado para evitar loops
const isEventProcessed = (eventId) => {
  try {
    const processed = localStorage.getItem(PROCESSED_EVENTS_KEY);
    if (!processed) return false;
    
    const processedEvents = JSON.parse(processed);
    return processedEvents.includes(eventId);
  } catch (error) {
    console.error('Erro ao verificar eventos processados:', error);
    return false;
  }
};

// Função para marcar um evento como processado
const markEventAsProcessed = (eventId) => {
  try {
    const processed = localStorage.getItem(PROCESSED_EVENTS_KEY);
    let processedEvents = processed ? JSON.parse(processed) : [];
    
    // Adicionar novo evento
    processedEvents.push(eventId);
    
    // Manter apenas os últimos MAX_PROCESSED_EVENTS
    if (processedEvents.length > MAX_PROCESSED_EVENTS) {
      processedEvents = processedEvents.slice(processedEvents.length - MAX_PROCESSED_EVENTS);
    }
    
    localStorage.setItem(PROCESSED_EVENTS_KEY, JSON.stringify(processedEvents));
  } catch (error) {
    console.error('Erro ao marcar evento como processado:', error);
  }
};

// Função para obter o bloqueio de sincronização
const acquireSyncLock = () => {
  try {
    const currentLock = localStorage.getItem(SYNC_LOCK_KEY);
    
    // Se não há bloqueio ou o bloqueio é muito antigo (mais de 10 segundos)
    if (!currentLock || (Date.now() - JSON.parse(currentLock).timestamp > LOCK_TIMEOUT_DURATION)) {
      // Adquirir bloqueio
      const lockData = {
        clientId: CLIENT_ID,
        timestamp: Date.now()
      };
      localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify(lockData));
      syncLocked = true;
      
      // Configurar temporizador para liberar o bloqueio
      clearTimeout(lockTimeout);
      lockTimeout = setTimeout(releaseSyncLock, LOCK_TIMEOUT_DURATION);
      
      return true;
    }
    
    // Verificar se este cliente já possui o bloqueio
    if (currentLock && JSON.parse(currentLock).clientId === CLIENT_ID) {
      // Renovar o bloqueio
      const lockData = {
        clientId: CLIENT_ID,
        timestamp: Date.now()
      };
      localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify(lockData));
      
      // Renovar o timeout
      clearTimeout(lockTimeout);
      lockTimeout = setTimeout(releaseSyncLock, LOCK_TIMEOUT_DURATION);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao tentar obter bloqueio de sincronização:', error);
    return false;
  }
};

// Função para liberar o bloqueio de sincronização
const releaseSyncLock = () => {
  try {
    const currentLock = localStorage.getItem(SYNC_LOCK_KEY);
    
    // Só liberar se este cliente possui o bloqueio
    if (currentLock && JSON.parse(currentLock).clientId === CLIENT_ID) {
      localStorage.removeItem(SYNC_LOCK_KEY);
      syncLocked = false;
      clearTimeout(lockTimeout);
      console.log('Bloqueio de sincronização liberado');
    }
  } catch (error) {
    console.error('Erro ao liberar bloqueio de sincronização:', error);
  }
};

// Função para comparar representantes e detectar mudanças significativas
const compareRepresentativeChanges = (newReps, oldReps) => {
  // Se tamanhos diferentes, houve mudança
  if (newReps.length !== oldReps.length) {
    console.log('Detectada mudança no número de representantes');
    return true;
  }

  // Mapear representantes por ID para facilitar comparação
  const oldRepsMap = {};
  oldReps.forEach(rep => {
    oldRepsMap[rep.id] = rep;
  });

  // Verificar se há alguma mudança significativa (nova id, posição ou rotação diferente)
  for (const newRep of newReps) {
    const oldRep = oldRepsMap[newRep.id];
    
    // Se não encontrou rep com mesmo ID, é uma mudança
    if (!oldRep) {
      console.log(`Novo representante detectado: ${newRep.id}`);
      return true;
    }
    
    // Verificar mudanças de posição significativas (mais de 0.05 unidade - aumentado para reduzir sincronização)
    const positionChanged = !oldRep.position || 
      Math.abs(newRep.position[0] - oldRep.position[0]) > 0.05 ||
      Math.abs(newRep.position[1] - oldRep.position[1]) > 0.05 ||
      Math.abs(newRep.position[2] - oldRep.position[2]) > 0.05;
    
    // Verificar mudanças de rotação significativas (mais de 0.1 radianos - aproximadamente 6 graus)
    const rotationChanged = !oldRep.rotation || Math.abs(newRep.rotation - oldRep.rotation) > 0.1;
    
    // Verificar se o nome ou a cor mudaram
    const nameChanged = newRep.name !== oldRep.name;
    const colorChanged = newRep.color !== oldRep.color;
    const typeChanged = newRep.type !== oldRep.type;
    
    if (positionChanged || rotationChanged || nameChanged || colorChanged || typeChanged) {
      console.log(`Detectada mudança em ${newRep.id}:`, {
        posição: positionChanged,
        rotação: rotationChanged,
        nome: nameChanged,
        cor: colorChanged,
        tipo: typeChanged
      });
      return true;
    }
  }
  
  // Não encontrou mudanças significativas
  return false;
};

export const ConstellationProvider = ({ children, isHost = true, sessionId = null }) => {
  // Estado para os representantes
  const [representatives, setRepresentatives] = useState([]);
  const [selectedRepresentative, setSelectedRepresentative] = useState(null);
  const [representativeName, setRepresentativeName] = useState('');
  const [selectedType, setSelectedType] = useState(REPRESENTATIVE_TYPES.FEMALE_ADULT.id);
  const [selectedColor, setSelectedColor] = useState(REPRESENTATIVE_COLORS[0]);
  const [hasControl, setHasControl] = useState(isHost);
  const [isDraggingAny, setIsDraggingState] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showNames, setShowNames] = useState(true);
  const [userRole, setUserRole] = useState(isHost ? 'host' : 'guest');
  
  // Estado para modelos 3D pré-carregados
  const [loadedModels, setLoadedModels] = useState({});
  
  // Estado para sincronização de câmera
  const [cameraPosition, setCameraPosition] = useState([0, 8, 12]);
  const [cameraTarget, setCameraTarget] = useState([0, 0, 0]);
  const [cameraZoom, setCameraZoom] = useState(1);
  
  // Referência para controle do intervalo de sincronização
  const syncIntervalRef = useRef(null);
  const savingRef = useRef(false);
  const loadingRef = useRef(false);
  
  // Controle para sincronização
  const lastSyncTimeRef = useRef(0);
  const SYNC_DEBOUNCE = 500; // Tempo em ms para debounce da sincronização
  
  // Função para gerar ID único para representantes
  const generateId = () => `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Definindo forceSyncRepresentatives ANTES de ser usado em outros useCallbacks ou useEffects
  // Sincronizar representantes forçadamente
  const forceSyncRepresentatives = useCallback(() => {
    console.log('[DEBUG SYNC] Iniciando sincronização forçada de representantes');
    
    // Criar ID único para este evento de sincronização
    const syncId = `force_sync_${Date.now()}_${CLIENT_ID}`;
    
    // Criar dados para sincronização
    const syncData = {
      representatives,
      cameraPosition,
      cameraTarget,
      cameraZoom,
      lastUpdate: Date.now(),
      updatedBy: CLIENT_ID,
      eventId: syncId,
      forceUpdate: true,
      action: 'force-sync-all'
    };
    
    // Marcar como processado para evitar loops
    markEventAsProcessed(syncId);
    
    // Salvar no localStorage
    const storageKey = getGlobalStorageKey(sessionId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(syncData));
      console.log('[DEBUG SYNC] Dados sincronizados salvos no localStorage');
    } catch (error) {
      console.error('[DEBUG SYNC] Erro ao salvar dados no localStorage:', error);
    }
    
    // Disparar evento para todas as janelas
    try {
      const event = new CustomEvent('constellation-updated', {
        detail: { sessionId, data: syncData }
      });
      window.dispatchEvent(event);
      console.log('[DEBUG SYNC] Evento constellation-updated disparado');
    } catch (error) {
      console.error('[DEBUG SYNC] Erro ao disparar evento para janelas:', error);
    }
    
    // Disparar evento para API
    try {
      const syncEvent = new CustomEvent('constellation-sync-field', {
        detail: { sessionId, data: syncData }
      });
      window.dispatchEvent(syncEvent);
      console.log('[DEBUG SYNC] Evento constellation-sync-field disparado para API');
    } catch (error) {
      console.error('[DEBUG SYNC] Erro ao disparar evento para API:', error);
    }
    
    // Forçar reconciliação do estado local com localStorage
    setTimeout(() => {
      console.log('[DEBUG SYNC] Realizando verificação de sincronização secundária');
      
      // Ler do localStorage
      try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          
          // Verificar se os dados são mais recentes
          if (parsedData.lastUpdate > lastUpdateTimestamp) {
            // Forçar atualização do estado
            setRepresentatives(parsedData.representatives);
            console.log('[DEBUG SYNC] Estado local atualizado a partir do localStorage');
          }
        }
      } catch (error) {
        console.error('[DEBUG SYNC] Erro na verificação secundária:', error);
      }
    }, 1000);
    
    return true;
  }, [representatives, cameraPosition, cameraTarget, cameraZoom, sessionId]);
  
  // Função para adicionar representante
  const addRepresentative = useCallback(() => {
    if (!representativeName.trim()) return;
    
    console.log(`[DEBUG] addRepresentative: Iniciando adição de "${representativeName}"`);
    
    // Gerar posição aleatória dentro do círculo do campo
    const radius = 2.5; // Metade do diâmetro do campo (5)
    const angle = Math.random() * Math.PI * 2; // Ângulo aleatório
    const dist = Math.random() * radius * 0.8; // Distância aleatória do centro (80% do raio máximo)
    
    // Calcular posição x,z no círculo
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    
    // Criar novo representante com posição aleatória
    const newRepresentative = {
      id: generateId(),
      name: representativeName,
      type: selectedType,
      color: selectedColor,
      position: [x, 0, z],
      rotation: Math.random() * Math.PI * 2, // Rotação aleatória
      createdAt: Date.now(),
      createdBy: CLIENT_ID
    };
    
    console.log(`[DEBUG] addRepresentative: Novo representante criado:`, newRepresentative);
    
    // Usar uma abordagem mais robusta para garantir a atualização do estado
    setRepresentatives(prev => {
      const updated = [...prev, newRepresentative];
      console.log(`[DEBUG] addRepresentative: Estado atualizado, agora temos ${updated.length} representantes`);
      
      // Criar ID único para este evento de sincronização específico
      const syncId = `add_rep_${Date.now()}_${CLIENT_ID}`;
      
      // Criar dados para sincronização imediata
      const syncData = {
        representatives: updated,
        cameraPosition,
        cameraTarget,
        cameraZoom,
        lastUpdate: Date.now(),
        updatedBy: CLIENT_ID,
        eventId: syncId,
        forceUpdate: true, // Forçar atualização sempre
        action: 'add-representative'
      };
      
      // Marcar este evento como processado para evitar loops
      markEventAsProcessed(syncId);
      
      // Atualizar cache global
      globalRepresentativesCache = updated;
      lastUpdateTimestamp = syncData.lastUpdate;
      
      // SINCRONIZAÇÃO IMEDIATA
      // 1. Salvar no localStorage
      const storageKey = getGlobalStorageKey(sessionId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(syncData));
        console.log(`[DEBUG] addRepresentative: Dados salvos no localStorage com ${updated.length} representantes`);
      } catch (e) {
        console.error('Erro ao salvar dados no localStorage:', e);
      }
      
      // 2. Disparar evento para outras janelas
      try {
        const event = new CustomEvent('constellation-updated', {
          detail: { sessionId, data: syncData }
        });
        window.dispatchEvent(event);
        console.log(`[DEBUG] addRepresentative: Evento constellation-updated disparado`);
      } catch (e) {
        console.error('Erro ao disparar evento de atualização:', e);
      }
      
      // 3. Disparar evento para API de videoconferência
      try {
        const syncEvent = new CustomEvent('constellation-sync-field', {
          detail: { sessionId, data: syncData }
        });
        window.dispatchEvent(syncEvent);
        console.log(`[DEBUG] addRepresentative: Evento constellation-sync-field disparado`);
      } catch (e) {
        console.error('Erro ao disparar evento de sincronização:', e);
      }
      
      console.log('[DEBUG] addRepresentative: Representante adicionado e sincronizado com todas as instâncias');
      
      // Forçar nova sincronização após um pequeno delay para garantir que todas as instâncias receberam
      setTimeout(() => {
        // Usar os dados atualizados diretamente em vez de acessar o estado
        if (updated.length > 0) {
          console.log(`[DEBUG] addRepresentative: Fazendo sincronização secundária com ${updated.length} representantes`);
          
          // Criar ID único para esta segunda sincronização
          const secondSyncId = `add_rep_confirm_${Date.now()}_${CLIENT_ID}`;
          
          // Criar dados para segunda sincronização
          const confirmSyncData = {
            representatives: updated,  // Usar updated em vez de representatives
            cameraPosition,
            cameraTarget,
            cameraZoom,
            lastUpdate: Date.now(),
            updatedBy: CLIENT_ID,
            eventId: secondSyncId,
            forceUpdate: true, // Forçar atualização sempre
            action: 'add-representative-confirm'
          };
          
          // Marcar este evento como processado
          markEventAsProcessed(secondSyncId);
          
          // Salvar no localStorage
          const storageKey = getGlobalStorageKey(sessionId);
          localStorage.setItem(storageKey, JSON.stringify(confirmSyncData));
          
          // Disparar evento para outras janelas
          const confirmEvent = new CustomEvent('constellation-updated', {
            detail: { sessionId, data: confirmSyncData }
          });
          window.dispatchEvent(confirmEvent);
          
          // Disparar evento para API
          const confirmSyncEvent = new CustomEvent('constellation-sync-field', {
            detail: { sessionId, data: confirmSyncData }
          });
          window.dispatchEvent(confirmSyncEvent);
          
          console.log('[DEBUG] addRepresentative: Sincronização secundária concluída');
        }
      }, 1000);
      
      return updated;
    });
    
    // Limpar nome
    setRepresentativeName('');
  }, [representativeName, selectedType, selectedColor, cameraPosition, cameraTarget, cameraZoom, sessionId]);
  
  // Função para remover representante
  const removeRepresentative = useCallback((id) => {
    setRepresentatives(prev => {
      const updated = prev.filter(rep => rep.id !== id);
      
      // Forçar sincronização imediata com todas as instâncias
      setTimeout(() => {
        // Atualizar cache global
        globalRepresentativesCache = updated;
        const syncTimestamp = Date.now();
        lastUpdateTimestamp = syncTimestamp;
        
        // Criar dado para sincronização
        const syncData = {
          representatives: updated,
          cameraPosition,
          cameraTarget,
          cameraZoom,
          lastUpdate: syncTimestamp,
          updatedBy: CLIENT_ID,
          forceUpdate: true
        };
        
        // Salvar no localStorage
        const storageKey = getGlobalStorageKey(sessionId);
        localStorage.setItem(storageKey, JSON.stringify(syncData));
        
        // Disparar evento para outras janelas
        const event = new CustomEvent('constellation-updated', {
          detail: { sessionId, data: syncData }
        });
        window.dispatchEvent(event);
        
        // Disparar evento para API
        const syncEvent = new CustomEvent('constellation-sync-field', {
          detail: { sessionId, data: syncData }
        });
        window.dispatchEvent(syncEvent);
        
        console.log('Representante removido e sincronizado com todas as instâncias');
      }, 100);
      
      return updated;
    });
    
    if (selectedRepresentative && selectedRepresentative.id === id) {
      setSelectedRepresentative(null);
    }
  }, [selectedRepresentative, cameraPosition, cameraTarget, cameraZoom, sessionId]);
  
  // Função para selecionar representante
  const handleRepresentativeSelect = useCallback((representative) => {
      setSelectedRepresentative(representative);
    setShowDragHint(!!representative);
  }, []);
  
  // Função para editar representante
  const startEditing = useCallback((representative) => {
    setEditingId(representative.id);
    setEditName(representative.name);
    setEditColor(representative.color);
  }, []);
  
  // Salvar edição
  const saveEditing = useCallback(() => {
    if (!editingId) return;
    
    setRepresentatives(prev => {
      const updated = prev.map(rep => 
        rep.id === editingId 
          ? { ...rep, name: editName, color: editColor, lastUpdated: Date.now() }
          : rep
      );
      
      // NÃO usar forceSyncAllInstances aqui para evitar dependência circular
      // Implementar a sincronização diretamente
      setTimeout(() => {
        // Gerar ID único para este evento
        const syncId = `edit_sync_${Date.now()}_${CLIENT_ID}`;
        
        // Criar dados para sincronização
        const syncData = {
          representatives: updated,
          cameraPosition,
          cameraTarget,
          cameraZoom,
          lastUpdate: Date.now(),
          updatedBy: CLIENT_ID,
          eventId: syncId,
          forceUpdate: true
        };
        
        // Marcar este evento como processado para evitar loops
        markEventAsProcessed(syncId);
        
        // Atualizar cache global
        globalRepresentativesCache = updated;
        lastUpdateTimestamp = syncData.lastUpdate;
        
        // Salvar no localStorage
        const storageKey = getGlobalStorageKey(sessionId);
        localStorage.setItem(storageKey, JSON.stringify(syncData));
        
        // Disparar evento para outras janelas
        const event = new CustomEvent('constellation-updated', {
          detail: { sessionId, data: syncData }
        });
        window.dispatchEvent(event);
        
        // Disparar evento para API de videoconferência
        const syncEvent = new CustomEvent('constellation-sync-field', {
          detail: { sessionId, data: syncData }
        });
        window.dispatchEvent(syncEvent);
        
        console.log("Edição sincronizada com todas as instâncias");
      }, 100);
      
      return updated;
    });
    
    // Atualizar representante selecionado se estiver sendo editado
    if (selectedRepresentative && selectedRepresentative.id === editingId) {
      setSelectedRepresentative(prev => ({ ...prev, name: editName, color: editColor }));
    }
    
    setEditingId(null);
  }, [editingId, editName, editColor, selectedRepresentative, sessionId, cameraPosition, cameraTarget, cameraZoom]);
  
  // Cancelar edição
  const cancelEditing = useCallback(() => {
    setEditingId(null);
  }, []);
  
  // Atualizar posição
  const setRepresentativePosition = useCallback((id, position, eventId) => {
    if (!id) return;
    
    // Se temos um ID de evento, verificar se já foi processado
    if (eventId && isEventProcessed(eventId)) {
      console.log(`[DEBUG POSITION] Evento de posição ${eventId} já processado, ignorando`);
      return;
    }
    
    // Verificar se a posição tem valor [0,0,0] e não é um evento de correção específica
    // Isto previne bugs comuns de reset de posição
    const isOriginPosition = position[0] === 0 && position[2] === 0;
    const isPositionFix = eventId && (
      eventId.includes('fix_origin') || 
      eventId.includes('fix_jump') || 
      eventId.includes('maintain_drag')
    );
    
    if (isOriginPosition && !isPositionFix) {
      const rep = representatives.find(r => r.id === id);
      if (rep && (Math.abs(rep.position[0]) > 0.05 || Math.abs(rep.position[2]) > 0.05)) {
        console.error(`[DEBUG POSITION] Tentativa bloqueada de resetar posição de ${rep.name || id} para [0,0,0]`);
        return;
      }
    }
    
    // Criar ID único para este evento de sincronização se não foi fornecido
    const syncId = eventId || `pos_${Date.now()}_${id}_${CLIENT_ID}`;
    
    // Marcar como processado para evitar loops
    if (!eventId) {
      markEventAsProcessed(syncId);
    }
    
    // Atualizar a posição no estado
    setRepresentatives(prev => {
      // Verificar se representante existe
      const repExists = prev.some(r => r.id === id);
      if (!repExists) {
        console.warn(`[DEBUG POSITION] Tentativa de atualizar posição de representante inexistente: ${id}`);
        return prev;
      }
      
      // Log para depuração
      const oldRep = prev.find(r => r.id === id);
      if (oldRep) {
        console.log(`[DEBUG POSITION] Atualizando posição de ${oldRep.name || id}: [${oldRep.position}] -> [${position}]`);
      }
      
      const updatedReps = prev.map(rep => 
        rep.id === id 
          ? { ...rep, position, lastUpdated: Date.now(), lastUpdatedBy: CLIENT_ID }
          : rep
      );
      
      // Atualizar cache global imediatamente durante arrasto
      globalRepresentativesCache = updatedReps;
      lastUpdateTimestamp = Date.now();
      
      // Criar objeto de sincronização
      const syncData = {
        representatives: updatedReps,
        cameraPosition,
        cameraTarget,
        cameraZoom,
        lastUpdate: lastUpdateTimestamp,
        updatedBy: CLIENT_ID,
        eventId: syncId,
        forceUpdate: !isDraggingAny // Forçar atualização se não estiver arrastando
      };
      
      // Atualizar o localStorage mesmo durante o arrasto
      const storageKey = getGlobalStorageKey(sessionId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(syncData));
      } catch (error) {
        console.error('[DEBUG POSITION] Erro ao salvar no localStorage:', error);
      }
      
      // Se não estiver arrastando ou for um evento de correção, enviar evento para outras instâncias
      if (!isDraggingAny || isPositionFix) {
        console.log(`[DEBUG POSITION] Enviando evento de posição para outras instâncias: ${syncId}`);
        
        // Disparar evento customizado para outras janelas
        try {
          const event = new CustomEvent('constellation-updated', {
            detail: {
              sessionId,
              data: syncData
            }
          });
          window.dispatchEvent(event);
          
          // Disparar evento para API de videoconferência
          const syncEvent = new CustomEvent('constellation-sync-field', {
            detail: {
              sessionId,
              data: syncData
            }
          });
          window.dispatchEvent(syncEvent);
        } catch (error) {
          console.error('[DEBUG POSITION] Erro ao disparar eventos:', error);
        }
      }
      
      return updatedReps;
    });
  }, [sessionId, cameraPosition, cameraTarget, cameraZoom, representatives, isDraggingAny]);
  
  // Atualizar rotação
  const setRepresentativeRotation = useCallback((id, rotation) => {
    if (!id) return;
    
    setRepresentatives(prev => {
      const updatedReps = prev.map(rep => 
        rep.id === id 
          ? { ...rep, rotation, lastUpdated: Date.now(), lastUpdatedBy: CLIENT_ID }
          : rep
      );
      
      // Não salvar durante arrasto, apenas no final
      if (!isDraggingAny) {
        saveToGlobalStorage(updatedReps);
      }
      
      return updatedReps;
    });
  }, [isDraggingAny]);
  
  // Função para controlar estado de arrasto
  const setDraggingState = useCallback((isDragging) => {
    setIsDraggingState(isDragging);
    
    // Quando parar de arrastar, forçar uma sincronização imediata
    if (!isDragging) {
      console.log("[DEBUG POSITION] Finalizando arrasto, sincronizando posição final");
      
      // Criar ID único para este evento de sincronização final pós-arrasto
      const syncId = `drag_end_${Date.now()}_${CLIENT_ID}`;
      
      // Marcar este evento como processado para evitar loops
      markEventAsProcessed(syncId);
      
      // Criar dados para sincronização
      const syncData = {
        representatives,
        cameraPosition,
        cameraTarget,
        cameraZoom,
        lastUpdate: Date.now(),
        updatedBy: CLIENT_ID,
        eventId: syncId,
        forceUpdate: true // Sempre forçar atualização após arrasto
      };
      
      // Atualizar cache global
      globalRepresentativesCache = representatives;
      lastUpdateTimestamp = syncData.lastUpdate;
      
      // SINCRONIZAÇÃO IMEDIATA
      // 1. Salvar no localStorage
      const storageKey = getGlobalStorageKey(sessionId);
      localStorage.setItem(storageKey, JSON.stringify(syncData));
      
      // 2. Disparar evento para outras janelas
      const event = new CustomEvent('constellation-updated', {
        detail: { sessionId, data: syncData }
      });
      window.dispatchEvent(event);
      
      // 3. Disparar evento para API de videoconferência
      const syncEvent = new CustomEvent('constellation-sync-field', {
        detail: { sessionId, data: syncData }
      });
      window.dispatchEvent(syncEvent);
      
      console.log("[DEBUG POSITION] Posição após arrasto sincronizada com todas as instâncias");
      
      // Reforçar a sincronização após um pequeno delay para garantir
      setTimeout(() => {
        // Criar novo ID para esta sincronização adicional
        const confirmSyncId = `confirm_drag_${Date.now()}_${CLIENT_ID}`;
        
        // Marcar como processado
        markEventAsProcessed(confirmSyncId);
        
        // Criar novos dados com forceUpdate
        const confirmSyncData = {
          ...syncData,
          eventId: confirmSyncId,
          lastUpdate: Date.now(),
          forceUpdate: true
        };
        
        // Salvar no localStorage
        localStorage.setItem(storageKey, JSON.stringify(confirmSyncData));
        
        // Disparar evento para outras janelas
        const confirmEvent = new CustomEvent('constellation-updated', {
          detail: { sessionId, data: confirmSyncData }
        });
        window.dispatchEvent(confirmEvent);
        
        // Disparar evento para API de videoconferência
        const confirmSyncEvent = new CustomEvent('constellation-sync-field', {
          detail: { sessionId, data: confirmSyncData }
        });
        window.dispatchEvent(confirmSyncEvent);
        
        console.log("[DEBUG POSITION] Posição após arrasto confirmada com segunda sincronização");
      }, 500);
    }
  }, [representatives, sessionId, cameraPosition, cameraTarget, cameraZoom]);
  
  // Reset do campo
  const resetField = useCallback(() => {
    const emptyField = [];
    
    // Limpar o campo global
    globalRepresentativesCache = emptyField;
    
    // Forçar timestamp de atualização recente para ter prioridade
    const resetTimestamp = Date.now();
    lastUpdateTimestamp = resetTimestamp;
    
    // Atualizar o estado local
    setRepresentatives(emptyField);
    
    // Desmarcar qualquer representante selecionado
    setSelectedRepresentative(null);
    
    // Restaurar câmera à posição padrão
    setCameraPosition([0, 8, 12]);
    setCameraTarget([0, 0, 0]);
    setCameraZoom(1);
    
    // Salvar no storage com timestamp específico para ter prioridade
    try {
      const storageKey = getGlobalStorageKey(sessionId);
      const resetData = {
        representatives: emptyField,
        cameraPosition: [0, 8, 12],
        cameraTarget: [0, 0, 0],
        cameraZoom: 1,
        lastUpdate: resetTimestamp,
        updatedBy: CLIENT_ID,
        isReset: true  // Marcar como reset para processar com prioridade
      };
      
      // Salvar no localStorage
      localStorage.setItem(storageKey, JSON.stringify(resetData));
      
      // Disparar evento para notificar outras janelas
      const event = new CustomEvent('constellation-updated', { 
        detail: { sessionId, data: resetData }
      });
      window.dispatchEvent(event);
      
      // Disparar evento adicional para sincronização via API de videoconferência
      const syncEvent = new CustomEvent('constellation-sync-field', {
        detail: { 
          sessionId, 
          data: resetData
        }
      });
      window.dispatchEvent(syncEvent);
      
      console.log('Campo resetado globalmente');
    } catch (error) {
      console.error('Erro ao resetar campo global:', error);
    }
  }, [sessionId]);
  
  // Menu de contexto
  const handleContextMenu = useCallback((representative, event) => {
    // Placeholder para funcionalidade futura
    console.log('Menu de contexto para:', representative.name);
  }, []);
  
  // Controle
  const transferControl = useCallback(() => {
    setHasControl(false);
  }, []);
  
  // Salvar configuração
  const saveConfiguration = useCallback(() => {
    // Salvar estado atual
    saveToGlobalStorage(representatives);
  }, [representatives]);
  
  // Importar configuração
  const importConfiguration = useCallback((config) => {
    if (!config || !Array.isArray(config)) {
      console.error('Configuração inválida para importação');
      return false;
    }
    
    try {
      setRepresentatives(config);
      saveToGlobalStorage(config);
      return true;
    } catch (error) {
      console.error('Erro ao importar configuração:', error);
      return false;
    }
  }, []);
  
  // Exportar configuração
  const exportConfiguration = useCallback(() => {
    return representatives;
  }, [representatives]);
  
  // Função para sincronizar a câmera
  const syncCamera = useCallback((position, target, zoom) => {
    setCameraPosition(position);
    setCameraTarget(target);
    setCameraZoom(zoom);
    
    // Salvar state com as novas configurações de câmera
    saveToGlobalStorage(representatives, position, target, zoom);
  }, [representatives]);
  
  // Salvar para o storage global
  const saveToGlobalStorage = (reps, camPos = cameraPosition, camTarget = cameraTarget, camZoom = cameraZoom) => {
    // Se estamos atualmente salvando ou carregando, pular
    if (savingRef.current || loadingRef.current) return;
    
    // Verificar debounce para evitar muitas atualizações em sequência
    const now = Date.now();
    if (now - lastSyncTimeRef.current < SYNC_DEBOUNCE) {
      return;
    }
    
    // Atualizar timestamp da última sincronização
    lastSyncTimeRef.current = now;
    
    try {
      savingRef.current = true;
      
      // Gerar ID único para este evento de sincronização
      const syncId = `sync_${Date.now()}_${CLIENT_ID}`;
      
      const storageKey = getGlobalStorageKey(sessionId);
      const dataToSave = {
        representatives: reps,
        cameraPosition: camPos,
        cameraTarget: camTarget,
        cameraZoom: camZoom,
        lastUpdate: Date.now(),
        updatedBy: CLIENT_ID,
        eventId: syncId
      };
      
      // Marcar como processado para evitar loops
      markEventAsProcessed(syncId);
      
      // Atualizar o cache global
      globalRepresentativesCache = reps;
      lastUpdateTimestamp = dataToSave.lastUpdate;
      
      // Salvar no localStorage
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      
      // Disparar evento para notificar outras janelas
      const event = new CustomEvent('constellation-updated', { 
        detail: { sessionId, data: dataToSave }
      });
      window.dispatchEvent(event);
      
      // Disparar evento adicional para sincronização via API de videoconferência
      const syncEvent = new CustomEvent('constellation-sync-field', {
        detail: { 
          sessionId, 
          data: dataToSave
        }
      });
      window.dispatchEvent(syncEvent);
      
      console.log(`Campo salvo globalmente para sessão ${sessionId}`);
    } catch (error) {
      console.error('Erro ao salvar campo global:', error);
    } finally {
      savingRef.current = false;
    }
  };
  
  // Carregar do storage global
  const loadFromGlobalStorage = () => {
    if (savingRef.current || loadingRef.current) return;
    
    // Se este cliente tem o bloqueio de sincronização, não carregar do localStorage
    // pois significa que ele mesmo está no controle dos dados
    const currentLock = localStorage.getItem(SYNC_LOCK_KEY);
    if (currentLock && JSON.parse(currentLock).clientId === CLIENT_ID) {
      console.log('Este cliente possui o bloqueio, ignorando carregamento');
      return;
    }
    
    try {
      loadingRef.current = true;
      
      const storageKey = getGlobalStorageKey(sessionId);
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Verificar se é mais recente que o cache
        if (parsedData.lastUpdate > lastUpdateTimestamp) {
          console.log('Carregando dados mais recentes do campo global');
          
          // Se o dado não pertence a este cliente
          if (parsedData.updatedBy !== CLIENT_ID) {
            // Atualizar o cache
            globalRepresentativesCache = parsedData.representatives;
            lastUpdateTimestamp = parsedData.lastUpdate;
            
            // Atualizar apenas se não estiver arrastando
            if (!isDraggingAny) {
              // Atualizar representantes
              setRepresentatives(parsedData.representatives);
              
              // Atualizar câmera se os dados existirem
              if (parsedData.cameraPosition) setCameraPosition(parsedData.cameraPosition);
              if (parsedData.cameraTarget) setCameraTarget(parsedData.cameraTarget);
              if (parsedData.cameraZoom) setCameraZoom(parsedData.cameraZoom);
              
              // Se temos um representante selecionado, atualizar para refletir as mudanças
              if (selectedRepresentative) {
                const updatedSelected = parsedData.representatives.find(
                  rep => rep.id === selectedRepresentative.id
                );
                
                if (updatedSelected) {
                  setSelectedRepresentative(updatedSelected);
                } else {
                  // Se o representante selecionado não existe mais, desselecionar
                  setSelectedRepresentative(null);
                }
              }
            } else {
              console.log('Ignorando atualização pois o usuário está arrastando');
            }
          } else {
            console.log('Ignorando dados próprios já processados');
          }
        }
      } else if (globalRepresentativesCache) {
        // Se não há dados no localStorage mas temos cache, use o cache
        setRepresentatives(globalRepresentativesCache);
      }
    } catch (error) {
      console.error('Erro ao carregar campo global:', error);
    } finally {
      loadingRef.current = false;
    }
  };
  
  // Verificar se já existe uma instância ativa para esta sessão
  useEffect(() => {
    if (!sessionId) return;
    
    if (ACTIVE_SESSIONS.has(sessionId)) {
      console.warn(`Detectada múltipla instância do ConstellationContext para sessão ${sessionId}`);
      
      // Incrementar contador de instâncias
      const count = ACTIVE_SESSIONS.get(sessionId) + 1;
      ACTIVE_SESSIONS.set(sessionId, count);
      
      return () => {
        // Ao desmontar, decrementar contador
        const currentCount = ACTIVE_SESSIONS.get(sessionId);
        if (currentCount > 1) {
          ACTIVE_SESSIONS.set(sessionId, currentCount - 1);
        } else {
          ACTIVE_SESSIONS.delete(sessionId);
          console.log(`Removida última instância de contexto para sessão ${sessionId}`);
        }
      };
    } else {
      // Registrar nova sessão ativa
      ACTIVE_SESSIONS.set(sessionId, 1);
      console.log(`Registrando nova instância de contexto para sessão ${sessionId}`);
      
      return () => {
        // Ao desmontar, remover da lista de sessões ativas
        ACTIVE_SESSIONS.delete(sessionId);
        console.log(`Removida instância de contexto para sessão ${sessionId}`);
      };
    }
  }, [sessionId]);
  
  // Forçar sincronização inicial
  useEffect(() => {
    if (!sessionId) return;
    
    console.log('[DEBUG INIT] Configurando sincronização inicial');
    
    // Forçar sincronização após um delay para garantir que outros componentes estejam prontos
    const initialSyncTimeout = setTimeout(() => {
      console.log('[DEBUG INIT] Executando sincronização inicial');
      
      // Verificar se já temos dados no localStorage
      const storageKey = getGlobalStorageKey(sessionId);
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log(`[DEBUG INIT] Encontrados dados no localStorage com ${parsedData.representatives?.length || 0} representantes`);
          
          // Atualizar estado com dados armazenados
          if (parsedData.representatives && parsedData.representatives.length > 0) {
            setRepresentatives(parsedData.representatives);
            if (parsedData.cameraPosition) setCameraPosition(parsedData.cameraPosition);
            if (parsedData.cameraTarget) setCameraTarget(parsedData.cameraTarget);
            if (parsedData.cameraZoom) setCameraZoom(parsedData.cameraZoom);
            
            // Atualizar cache global
            globalRepresentativesCache = parsedData.representatives;
            lastUpdateTimestamp = parsedData.lastUpdate || Date.now();
          }
        } catch (error) {
          console.error('[DEBUG INIT] Erro ao processar dados do localStorage:', error);
        }
      }
      
      // Anunciar presença para outras instâncias
      const readyEvent = new CustomEvent('constellation-provider-ready', {
        detail: {
          sessionId,
          clientId: CLIENT_ID,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(readyEvent);
      
      // Depois de um pequeno delay, forçar sincronização com todas as instâncias
      // Implementando diretamente em vez de chamar forceSyncRepresentatives
      setTimeout(() => {
        // Criar ID único para este evento de sincronização
        const syncId = `init_sync_${Date.now()}_${CLIENT_ID}`;
        
        // Criar dados para sincronização
        const syncData = {
          representatives,
          cameraPosition,
          cameraTarget,
          cameraZoom,
          lastUpdate: Date.now(),
          updatedBy: CLIENT_ID,
          eventId: syncId,
          forceUpdate: true,
          action: 'initial-sync'
        };
        
        // Marcar como processado para evitar loops
        markEventAsProcessed(syncId);
        
        // Salvar no localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(syncData));
          console.log('[DEBUG INIT] Dados iniciais salvos no localStorage');
        } catch (error) {
          console.error('[DEBUG INIT] Erro ao salvar dados iniciais:', error);
        }
        
        // Disparar evento para todas as janelas
        try {
          const event = new CustomEvent('constellation-updated', {
            detail: { sessionId, data: syncData }
          });
          window.dispatchEvent(event);
          console.log('[DEBUG INIT] Evento constellation-updated disparado');
        } catch (error) {
          console.error('[DEBUG INIT] Erro ao disparar evento para janelas:', error);
        }
        
        // Disparar evento para API
        try {
          const syncEvent = new CustomEvent('constellation-sync-field', {
            detail: { sessionId, data: syncData }
          });
          window.dispatchEvent(syncEvent);
          console.log('[DEBUG INIT] Evento constellation-sync-field disparado para API');
        } catch (error) {
          console.error('[DEBUG INIT] Erro ao disparar evento para API:', error);
        }
      }, 1000);
    }, 500);
    
    return () => clearTimeout(initialSyncTimeout);
  }, [sessionId, representatives, cameraPosition, cameraTarget, cameraZoom]);
  
  // Função para tratar eventos de storage
  const handleStorageUpdate = useCallback((e) => {
    // Verificar se é para nosso storageKey
    const storageKey = getGlobalStorageKey(sessionId);
    if (e.key === storageKey) {
      console.log('Detectada mudança no localStorage para nossa sessão');
      loadFromGlobalStorage();
    }
  }, [sessionId, loadFromGlobalStorage]);
  
  // Efeito para configurar event listeners
  useEffect(() => {
    if (!sessionId) return;
    
    console.log(`[DEBUG] Configurando event listeners para ConstellationContext com sessionId=${sessionId}`);
    
    // Definir handlers localmente para evitar dependências circulares
    const handleCustomEvent = (e) => {
      // Verificar se é para esta sessão
      if (e.detail.sessionId === sessionId) {
        // Criar ID para este evento específico
        const eventId = e.detail.data.eventId || `custom_${e.detail.data.lastUpdate}_${e.detail.data.updatedBy}`;
        
        // Verificar se já processamos este evento antes
        if (isEventProcessed(eventId)) {
          console.log('[DEBUG EVENT] Evento já processado anteriormente, ignorando para evitar loop');
          return;
        }
        
        console.log(`[DEBUG EVENT] Recebido evento: ${eventId}`);
        
        // Marcar como processado para evitar loops
        markEventAsProcessed(eventId);
        
        // Verificar se é uma atualização forçada ou se há mudanças que justifiquem atualizar o estado
        const shouldUpdate = e.detail.data.forceUpdate || 
                            !globalRepresentativesCache ||
                            e.detail.data.lastUpdate > lastUpdateTimestamp || 
                            compareRepresentativeChanges(e.detail.data.representatives, representatives);
        
        if (shouldUpdate) {
          console.log('[DEBUG EVENT] Atualizando estado a partir do evento recebido');
          
          // Se não estiver arrastando, aplicar a atualização
          if (!isDraggingAny) {
            console.log('[DEBUG EVENT] Aplicando atualização de representantes');
            
            // Atualizar representantes
            setRepresentatives(e.detail.data.representatives);
            
            // Atualizar câmera se necessário
            if (e.detail.data.cameraPosition) setCameraPosition(e.detail.data.cameraPosition);
            if (e.detail.data.cameraTarget) setCameraTarget(e.detail.data.cameraTarget);
            if (e.detail.data.cameraZoom) setCameraZoom(e.detail.data.cameraZoom);
            
            // Atualizar o representante selecionado se necessário
            if (selectedRepresentative) {
              const updatedSelected = e.detail.data.representatives.find(
                rep => rep.id === selectedRepresentative.id
              );
              
              if (updatedSelected) {
                setSelectedRepresentative(updatedSelected);
              } else if (e.detail.data.action === 'remove-representative') {
                // Se o representante foi removido, desselecionar
                setSelectedRepresentative(null);
              }
            }
            
            // Atualizar cache global
            globalRepresentativesCache = e.detail.data.representatives;
            lastUpdateTimestamp = e.detail.data.lastUpdate;
          } else {
            console.log('[DEBUG EVENT] Ignorando atualização durante arrasto');
          }
        } else {
          console.log('[DEBUG EVENT] Nenhuma mudança significativa, ignorando evento');
        }
      }
    };
    
    const handleFieldUpdatedEvent = (e) => {
      // Verificar se é para esta sessão
      if (e.detail && e.detail.sessionId === sessionId && e.detail.data) {
        console.log('[DEBUG API] Recebida atualização externa do campo');
        
        // Criar ID para este evento específico
        const eventId = e.detail.data.eventId || `api_${e.detail.data.lastUpdate}_${e.detail.data.updatedBy || 'api'}`;
        
        // Verificar se já processamos este evento antes
        if (isEventProcessed(eventId)) {
          console.log('[DEBUG API] Evento da API já processado anteriormente, ignorando');
          return;
        }
        
        // Marcar como processado para evitar loops
        markEventAsProcessed(eventId);
        
        // Verificar se devemos atualizar o estado
        const shouldUpdate = e.detail.data.forceUpdate || 
                             !globalRepresentativesCache ||
                             e.detail.data.lastUpdate > lastUpdateTimestamp || 
                             compareRepresentativeChanges(e.detail.data.representatives, representatives);
        
        if (shouldUpdate) {
          console.log('[DEBUG API] Atualizando estado a partir do evento da API');
          
          // Se não estiver arrastando, aplicar a atualização
          if (!isDraggingAny) {
            console.log('[DEBUG API] Aplicando atualização de representantes da API');
            
            // Atualizar representantes
            setRepresentatives(e.detail.data.representatives);
            
            // Atualizar câmera se necessário
            if (e.detail.data.cameraPosition) setCameraPosition(e.detail.data.cameraPosition);
            if (e.detail.data.cameraTarget) setCameraTarget(e.detail.data.cameraTarget);
            if (e.detail.data.cameraZoom) setCameraZoom(e.detail.data.cameraZoom);
            
            // Atualizar o representante selecionado se necessário
            if (selectedRepresentative) {
              const updatedSelected = e.detail.data.representatives.find(
                rep => rep.id === selectedRepresentative.id
              );
              
              if (updatedSelected) {
                setSelectedRepresentative(updatedSelected);
              } else {
                // Se o representante não existe mais, desselecionar
                setSelectedRepresentative(null);
              }
            }
            
            // Atualizar cache global
            globalRepresentativesCache = e.detail.data.representatives;
            lastUpdateTimestamp = e.detail.data.lastUpdate;
            
            // Salvar no localStorage também
            const storageKey = getGlobalStorageKey(sessionId);
            try {
              localStorage.setItem(storageKey, JSON.stringify(e.detail.data));
            } catch (error) {
              console.error('[DEBUG API] Erro ao salvar dados da API no localStorage:', error);
            }
          } else {
            console.log('[DEBUG API] Ignorando atualização da API durante arrasto');
          }
        } else {
          console.log('[DEBUG API] Nenhuma mudança significativa da API, ignorando evento');
        }
      }
    };
    
    const handleDebugPing = (e) => {
      if (e.detail && e.detail.sessionId === sessionId) {
        console.log('Recebido ping de debug para forçar sincronização');
        
        // Forçar carregamento do localStorage
        loadFromGlobalStorage();
      }
    };
    
    const handleSyncRequest = () => {
      console.log('Recebida solicitação de sincronização');
      
      // Compartilhar dados atuais apenas quando explicitamente solicitado
      if (!isDraggingAny && representatives && representatives.length > 0) {
        saveToGlobalStorage(representatives);
      } else {
        console.log('[DEBUG] Sem representantes para compartilhar ou usuário está arrastando');
      }
    };
    
    const handleProviderReady = (e) => {
      if (e.detail && e.detail.sessionId === sessionId) {
        console.log(`Detectado outro provedor pronto: ${e.detail.clientId}`);
        
        // Se este é o provedor principal e temos representantes para compartilhar
        if (representatives && representatives.length > 0) {
          // Compartilhar estado atual
          saveToGlobalStorage(representatives);
        } else {
          console.log('[DEBUG] Sem representantes para compartilhar neste momento');
        }
      }
    };
    
    const handleAddTestEvent = (e) => {
      if (e.detail && e.detail.sessionId === sessionId) {
        console.log('Recebido evento para adicionar representante de teste');
        
        // Gerar nome aleatório
        const randomName = `Teste ${Math.floor(Math.random() * 1000)}`;
        
        // Definir nome temporário
        setRepresentativeName(randomName);
        
        // Adicionar após um breve delay
        setTimeout(() => {
          addRepresentative();
        }, 100);
      }
    };
    
    const handleDirectAddEvent = (e) => {
      if (e.detail && e.detail.sessionId === sessionId && e.detail.data) {
        console.log('Recebida solicitação direta para adicionar representante');
        
        // Extrair informações do representante
        const { name, type, color } = e.detail.data;
        
        if (!name || !type) {
          console.error('Dados insuficientes para adicionar representante');
          return;
        }
        
        // Salvar estado atual
        const originalName = representativeName;
        const originalType = selectedType;
        const originalColor = selectedColor;
        
        // Atualizar com os novos valores
        setRepresentativeName(name);
        setSelectedType(type);
        if (color) setSelectedColor(color);
        
        // Aguardar atualização de estado antes de adicionar
        setTimeout(() => {
          // Adicionar representante
          addRepresentative();
          
          // Restaurar valores originais
          setTimeout(() => {
            setRepresentativeName(originalName);
            setSelectedType(originalType);
            setSelectedColor(originalColor);
          }, 100);
        }, 100);
      }
    };
    
    // Handler para eventos constellation-sync-force
    const handleForceSync = (e) => {
      console.log('[DEBUG LISTENER] Evento constellation-sync-force recebido!', Date.now());
      
      if (e.detail && e.detail.sessionId === sessionId) {
        console.log(`[DEBUG LISTENER] Processando evento de sincronização forçada para sessão ${sessionId}`);
        
        // Verificar se o evento tem dados e representantes
        if (e.detail.data && e.detail.data.representatives) {
          console.log(`[DEBUG LISTENER] Evento contém ${e.detail.data.representatives?.length || 0} representantes`);
          
          // Se o evento tem um ID, verificar se já foi processado
          if (e.detail.data.eventId && isEventProcessed(e.detail.data.eventId)) {
            console.log(`[DEBUG LISTENER] Evento ${e.detail.data.eventId} já foi processado anteriormente, ignorando`);
            return;
          }
          
          // Marcar como processado se tiver ID
          if (e.detail.data.eventId) {
            console.log(`[DEBUG LISTENER] Marcando evento ${e.detail.data.eventId} como processado`);
            markEventAsProcessed(e.detail.data.eventId);
          }
          
          // Atualizar representantes
          console.log('[DEBUG LISTENER] Atualizando representantes no estado');
          setRepresentatives(e.detail.data.representatives);
          
          // Atualizar câmera se disponível
          if (e.detail.data.cameraPosition) setCameraPosition(e.detail.data.cameraPosition);
          if (e.detail.data.cameraTarget) setCameraTarget(e.detail.data.cameraTarget);
          if (e.detail.data.cameraZoom) setCameraZoom(e.detail.data.cameraZoom);
          
          // Atualizar cache global
          globalRepresentativesCache = e.detail.data.representatives;
          lastUpdateTimestamp = Date.now();
          
          console.log('[DEBUG LISTENER] Sincronização forçada aplicada com sucesso');
        } else {
          console.log('[DEBUG LISTENER] Evento sem dados de representantes válidos');
        }
      }
    };
    
    // Handler para evento constellation-force-sync
    const handleForceSyncRequest = (e) => {
      if (!e.detail || e.detail.sessionId !== sessionId) return;
      
      console.log('[DEBUG FORCE] Recebida solicitação de sincronização forçada');
      
      // Verificar se o evento já foi processado
      if (e.detail.eventId && isEventProcessed(e.detail.eventId)) {
        console.log('[DEBUG FORCE] Evento já processado, ignorando');
        return;
      }
      
      // Marcar como processado
      if (e.detail.eventId) {
        markEventAsProcessed(e.detail.eventId);
      }
      
      // Implementar sincronização diretamente em vez de chamar forceSyncRepresentatives
      // Criar ID único para este evento de sincronização
      const syncId = `force_sync_req_${Date.now()}_${CLIENT_ID}`;
      
      // Criar dados para sincronização
      const syncData = {
        representatives,
        cameraPosition,
        cameraTarget,
        cameraZoom,
        lastUpdate: Date.now(),
        updatedBy: CLIENT_ID,
        eventId: syncId,
        forceUpdate: true,
        action: 'force-sync-request'
      };
      
      // Marcar como processado para evitar loops
      markEventAsProcessed(syncId);
      
      // Salvar no localStorage
      const storageKey = getGlobalStorageKey(sessionId);
      localStorage.setItem(storageKey, JSON.stringify(syncData));
      
      // Disparar evento para outras janelas
      const event = new CustomEvent('constellation-updated', {
        detail: { sessionId, data: syncData }
      });
      window.dispatchEvent(event);
      
      // Disparar evento para API
      const syncEvent = new CustomEvent('constellation-sync-field', {
        detail: { sessionId, data: syncData }
      });
      window.dispatchEvent(syncEvent);
      
      console.log('[DEBUG FORCE] Sincronização forçada realizada via requisição');
    };
    
    // Handlers para eventos de storage e atualizações
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('constellation-updated', handleCustomEvent);
    window.addEventListener('constellation-field-updated', handleFieldUpdatedEvent);
    window.addEventListener('constellation-sync-ping', handleDebugPing);
    window.addEventListener('constellation-sync-request', handleSyncRequest);
    window.addEventListener('constellation-provider-ready', handleProviderReady);
    window.addEventListener('constellation-add-test', handleAddTestEvent);
    window.addEventListener('constellation-add-representative', handleDirectAddEvent);
    window.addEventListener('constellation-sync-force', handleForceSync);
    window.addEventListener('constellation-force-sync', handleForceSyncRequest);
    
    console.log('[DEBUG] Todos os event listeners configurados, incluindo constellation-sync-force e constellation-force-sync');
    
    // Disparar evento para notificar que este provedor está pronto
    const readyEvent = new CustomEvent('constellation-provider-ready', {
      detail: {
        sessionId,
        clientId: CLIENT_ID,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(readyEvent);
    console.log(`[DEBUG] Enviado evento de provider ready para sessão ${sessionId}`);
    
    // Limpar tudo ao desmontar
    return () => {
      console.log(`[DEBUG] Limpando event listeners do ConstellationContext`);
      
      // Remover listeners
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('constellation-updated', handleCustomEvent);
      window.removeEventListener('constellation-field-updated', handleFieldUpdatedEvent);
      window.removeEventListener('constellation-sync-ping', handleDebugPing);
      window.removeEventListener('constellation-sync-request', handleSyncRequest);
      window.removeEventListener('constellation-provider-ready', handleProviderReady);
      window.removeEventListener('constellation-add-test', handleAddTestEvent);
      window.removeEventListener('constellation-add-representative', handleDirectAddEvent);
      window.removeEventListener('constellation-sync-force', handleForceSync);
      window.removeEventListener('constellation-force-sync', handleForceSyncRequest);
      
      // Limpar intervalos
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      // Liberar bloqueios
      releaseSyncLock();
    };
  }, [
    sessionId,
    handleStorageUpdate,
    loadFromGlobalStorage,
    saveToGlobalStorage,
    isDraggingAny,
    representatives,
    representativeName,
    selectedType,
    selectedColor,
    addRepresentative,
    setRepresentativeName,
    setSelectedType,
    setSelectedColor,
    setRepresentatives,
    setCameraPosition,
    setCameraTarget,
    setCameraZoom,
    selectedRepresentative
  ]);
  
  // Prover o contexto
  return (
    <ConstellationContext.Provider
      value={{
        representatives,
        selectedRepresentative,
        handleRepresentativeSelect,
        editingId,
        editName,
        editColor,
        representativeName,
        selectedType,
        selectedColor,
        hasControl,
        showDragHint,
        isDraggingAny,
        showNames,
        userRole,
        loadedModels,
        setLoadedModels,
        cameraPosition,
        cameraTarget,
        cameraZoom,
        setSelectedRepresentative,
        setRepresentativeName,
        setSelectedType,
        setSelectedColor,
        addRepresentative,
        removeRepresentative,
        startEditing,
        saveEditing,
        cancelEditing,
        setRepresentativePosition,
        setRepresentativeRotation,
        setDraggingState,
        resetField,
        syncCamera,
        transferControl,
        saveConfiguration,
        importConfiguration,
        exportConfiguration,
        setShowNames,
        REPRESENTATIVE_COLORS,
        REPRESENTATIVE_TYPES,
        sessionId,
        CLIENT_ID,
        isHost,
        showDragHint,
        handleContextMenu,
        forceSyncRepresentatives
      }}
    >
      {children}
    </ConstellationContext.Provider>
  );
};

export default ConstellationProvider; 