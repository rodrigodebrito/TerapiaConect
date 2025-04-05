import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';

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
    name: 'Idoso Masculino',
    modelPath: '/representantes/06 - Representante Idoso Masculino.glb'
  },
  FEMALE_ELDER: {
    id: 'female_elder',
    name: 'Idoso Feminino',
    modelPath: '/representantes/05 - Representante Idoso Feminino.glb'
  },
  MALE_ADULT: {
    id: 'male_adult',
    name: 'Adulto Masculino',
    modelPath: '/representantes/01 - Representante Adulto Masculino.glb'
  },
  FEMALE_ADULT: {
    id: 'female_adult',
    name: 'Adulto Feminino',
    modelPath: '/representantes/02 - Representante Adulto Feminino.glb'
  },
  MALE_CHILD: {
    id: 'male_child',
    name: 'Criança Masculino',
    modelPath: '/representantes/04 - Representante Criança Masculino.glb'
  },
  FEMALE_CHILD: {
    id: 'female_child',
    name: 'Criança Feminino',
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

// Exportar o contexto separadamente
export const ConstellationContext = createContext(null);

export const ConstellationProvider = ({ children, isHost = true, sessionId = null }) => {
  const [representatives, setRepresentatives] = useState([]);
  const [selectedRepresentative, setSelectedRepresentative] = useState(null);
  const [representativeName, setRepresentativeName] = useState('');
  const [selectedType, setSelectedType] = useState(REPRESENTATIVE_TYPES.FEMALE_ADULT.id);
  const [selectedColor, setSelectedColor] = useState(REPRESENTATIVE_COLORS[0]);
  const [hasControl, setHasControl] = useState(isHost);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showNames, setShowNames] = useState(true);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 10, z: 10 });
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 0, z: 0 });
  const [plateRotation, setPlateRotation] = useState(0);
  const socketRef = useRef(null);
  // Adicionar flag para controlar a sincronização inicial - movida para fora do useEffect
  const isInitialSync = useRef(true);
  
  // Registrar o status de host em uma ref para evitar problemas de fechamento
  const isHostRef = useRef(isHost);
  
  // Atualizar a ref quando isHost mudar
  useEffect(() => {
    isHostRef.current = isHost;
    console.log("Status de host atualizado:", isHost);
    
    // Forçar o hasControl com base no isHost
    if (isHost) {
      setHasControl(true);
      console.log("Controle concedido automaticamente ao host");
    }
  }, [isHost]);
  
  // Função para emitir mudanças para outros participantes
  const emitChange = useCallback((data) => {
    const socketInstance = socketRef.current || window.constellationSocket || window.socket;
    
    if (socketInstance) {
      // Verificar o estado da conexão
      if (socketInstance.connected && sessionId) {
        // Adicionar mais detalhes para movimentos de prato e câmera
        if (data.type === 'plate') {
          console.log(`Emitindo alteração de rotação do prato para ${data.rotation.toFixed(2)}`);
        } else if (data.type === 'camera') {
          console.log(`Emitindo alteração de câmera: Pos(${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)})`);
        } else if (data.type === 'representative') {
          const rep = data.representative;
          if (rep) {
            // Verificar se position existe e qual formato tem (objeto ou array)
            if (rep.position) {
              if (rep.position.x !== undefined) {
                // Posição como objeto {x, y, z}
                console.log(`Emitindo alteração de representante ${rep.id} (${data.action}): ${rep.name} em Pos(${rep.position.x.toFixed(1)}, ${rep.position.y.toFixed(1)}, ${rep.position.z.toFixed(1)})`);
              } else if (Array.isArray(rep.position)) {
                // Posição como array [x, y, z]
                console.log(`Emitindo alteração de representante ${rep.id} (${data.action}): ${rep.name} em Pos(${rep.position[0].toFixed(1)}, ${rep.position[1].toFixed(1)}, ${rep.position[2].toFixed(1)})`);
              } else {
                // Formato desconhecido, apenas logar sem toFixed
                console.log(`Emitindo alteração de representante ${rep.id} (${data.action}): ${rep.name}`);
              }
            } else {
              // Sem position, apenas logar os detalhes básicos
              console.log(`Emitindo alteração de representante ${rep.id} (${data.action}): ${rep.name}`);
            }
          }
        } else {
          console.log('Emitindo alteração de tipo:', data.type, data.action || '');
        }
        
        // Adicionar sessionId e ID do emissor aos dados
        const eventData = {
          ...data,
          sessionId,
          forwardedBy: socketInstance.id,
          timestamp: Date.now()
        };
        
        // Emitir o evento
        try {
          socketInstance.emit('constellation-object', eventData);
        } catch (error) {
          console.error("Erro ao emitir dados via socket:", error);
        }
      } else {
        console.log('Socket não conectado. Estado:', socketInstance.connected ? 'conectado' : 'desconectado', 'Tentando reconectar...');
        
        // Tenta reconectar e então emitir
        if (!socketInstance.connected) {
          try {
            socketInstance.connect();
            
            // Tentativa de emissão após breve atraso para dar tempo de reconexão
            setTimeout(() => {
              if (socketInstance.connected) {
                const eventData = {
                  ...data,
                  sessionId,
                  timestamp: Date.now()
                };
                console.log('Reconectado, emitindo dados após atraso:', eventData.type);
                socketInstance.emit('constellation-object', eventData);
              } else {
                console.log('Não foi possível reconectar o socket');
              }
            }, 1000);
          } catch (error) {
            console.error("Erro ao tentar reconectar socket:", error);
          }
        }
      }
    } else {
      console.log('Socket não disponível (null ou undefined)');
      // Tenta obter o socket global novamente
      const attemptSocket = window.socket;
      if (attemptSocket) {
        console.log('Encontrado socket global, tentando usar');
        socketRef.current = attemptSocket;
        window.constellationSocket = attemptSocket;
        
        const eventData = {
          ...data,
          sessionId,
          timestamp: Date.now()
        };
      
        try {
          attemptSocket.emit('constellation-object', eventData);
        } catch (error) {
          console.error("Erro ao emitir dados via socket global:", error);
        }
      }
    }
  }, [sessionId]);
  
  // Escutar pelo socket existente no window object
  useEffect(() => {
    // Socket sendo criado pelo SessionRoom
    const checkForGlobalSocket = () => {
      if (window.constellationSocket) {
        console.log('ConstellationContext: Usando socket existente (constellationSocket)');
        return window.constellationSocket;
      }
      
      // Tentar criar uma referência ao socket global se existir
      if (window.socket) {
        console.log('ConstellationContext: Usando socket global existente (window.socket)');
        window.constellationSocket = window.socket;
        return window.socket;
      }
      
      console.log('ConstellationContext: Socket não encontrado no objeto window');
      return null;
    };
    
    const socketInstance = checkForGlobalSocket();
    socketRef.current = socketInstance;
    
    if (socketInstance && sessionId) {
      console.log('ConstellationContext: Socket configurado com ID:', socketInstance.id);
      console.log('ConstellationContext: Estado de conexão do socket:', socketInstance.connected ? 'conectado' : 'desconectado');
      console.log('ConstellationContext: Status do controle:', hasControl ? 'Ativo' : 'Inativo', 'Status de host:', isHostRef.current ? 'É host' : 'Não é host');
      
      // Configurar listeners para eventos relacionados ao campo de constelação
      const handleConstellationObject = (data) => {
        if (data && data.sessionId === sessionId) {
          console.log('Recebido objeto de constelação:', data.type);
          
          // Ignorar eventos que foram emitidos por nós mesmos
          const isSelfEvent = data.forwardedBy === socketInstance.id;
          if (isSelfEvent) {
            console.log(`Ignorando evento do tipo ${data.type} emitido por mim mesmo`);
            return;
          }
          
          if (data.type === 'representative' && data.action === 'add') {
            // Adicionar novo representante
            console.log('Adicionando novo representante:', data.representative);
            setRepresentatives(prev => [...prev, data.representative]);
          } 
          else if (data.type === 'representative' && data.action === 'update') {
            // Atualizar representante existente
            console.log('Atualizando representante existente:', data.representative);
            setRepresentatives(prev => 
              prev.map(rep => rep.id === data.representative.id ? data.representative : rep)
            );
          }
          else if (data.type === 'representative' && data.action === 'remove') {
            // Remover representante
            console.log('Removendo representante:', data.representativeId);
            setRepresentatives(prev => 
              prev.filter(rep => rep.id !== data.representativeId)
            );
          }
          else if (data.type === 'move' && data.action === 'position') {
            // Atualização específica da posição do representante
            console.log('Atualizando posição do representante:', data.representativeId);
            setRepresentatives(prev => prev.map(rep => {
              if (rep.id === data.representativeId) {
                return { ...rep, position: data.position };
              }
              return rep;
            }));
          }
          else if (data.type === 'camera') {
            // Atualizar posição da câmera
            console.log(`Recebendo atualização de câmera: Pos(${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)})`);
            
            // Verificar se o evento é uma atualização forçada ou se não estamos no controle
            if (data.forceUpdate || !hasControl) {
              console.log('Aplicando atualização de câmera');
            setCameraPosition(data.position);
              if (data.target) setCameraTarget(data.target);
            } else {
              console.log('Ignorando atualização de câmera (temos controle e não é forçada)');
            }
          }
          else if (data.type === 'plate') {
            // Atualizar rotação do prato
            console.log(`Recebendo atualização de rotação do prato: ${data.rotation.toFixed(2)}`);
            
            // Verificar se o evento é uma atualização forçada ou se não estamos no controle
            if (data.forceUpdate || !hasControl) {
              console.log(`Aplicando rotação do prato: ${data.rotation.toFixed(2)}`);
            setPlateRotation(data.rotation);
            } else {
              console.log('Ignorando atualização de rotação do prato (temos controle e não é forçada)');
            }
          }
          else if (data.type === 'control') {
            // Atualizar quem tem controle
            console.log('Recebendo atualização de controle:', data);
            
            // Se o evento for para transferir controle e nós somos o host
            if (data.action === 'transfer' && isHostRef.current) {
              console.log('Host recebeu solicitação de transferência, mantendo controle');
              return; // Host mantém controle
            }
            
            // Se o evento for para tomar controle e não somos o host, perder controle
            if (data.action === 'take' && !isHostRef.current) {
              console.log('Cliente perdendo controle pois host está tomando controle');
              setHasControl(false);
              return;
            }
            
            // Se o evento especificar explicitamente um controlador
            if (data.controller) {
              const isMe = data.controller === socketInstance.id;
              console.log(`Controle definido para: ${data.controller} (sou eu: ${isMe})`);
              setHasControl(isMe);
            }
          }
          else if (data.type === 'fullSync') {
            // Sincronização completa
            console.log('Sincronização completa recebida:', data);
            setRepresentatives(data.representatives || []);
            
            // Somente atualizar se não estiver no controle
            if (!hasControl || (data.forceSync && !isHostRef.current)) {
            setPlateRotation(data.plateRotation || 0);
            setCameraPosition(data.cameraPosition || { x: 0, y: 10, z: 10 });
            setCameraTarget(data.cameraTarget || { x: 0, y: 0, z: 0 });
            }
          }
        }
      };
      
      // Verificar se o listener já existe antes de adicionar
      socketInstance.off('constellation-object', handleConstellationObject);
      
      // Registrar listener para objetos do campo de constelação
      console.log('ConstellationContext: Registrando listener para evento constellation-object');
      socketInstance.on('constellation-object', handleConstellationObject);
      
      // Configurar listener para depuração
      socketInstance.on('connect', () => {
        console.log('ConstellationContext: Socket reconectado com ID:', socketInstance.id);
        
        // Host sempre reafirma seu controle ao reconectar
        if (isHostRef.current) {
          console.log('Host reafirmando controle após conexão');
          emitChange({
            type: 'control',
            action: 'take',
            controller: socketInstance.id,
            isHost: true
          });
        }
      });
      
      socketInstance.on('disconnect', () => {
        console.log('ConstellationContext: Socket desconectado');
      });
      
      // Fazer sincronização inicial apenas uma vez
      if (isInitialSync.current) {
      // Emitir um pedido para sincronização inicial se for cliente
        if (!isHostRef.current) {
          console.log('Solicitando sincronização completa como cliente...');
        const requestData = {
          type: 'requestSync',
          sessionId,
          clientId: socketInstance.id,
          timestamp: Date.now()
        };
        socketInstance.emit('constellation-object', requestData);
        } else {
          // Se for host, emitir um evento de fullSync para garantir que todos estejam sincronizados
          console.log('Emitindo sincronização inicial como host...');
          const syncData = {
            type: 'fullSync',
            sessionId,
            representatives,
            plateRotation,
            cameraPosition,
            cameraTarget,
            timestamp: Date.now(),
            forceSync: true
          };
          socketInstance.emit('constellation-object', syncData);
          
          // Host também afirma seu controle inicial
          const controlData = {
            type: 'control',
            action: 'take',
            controller: socketInstance.id,
            isHost: true,
            sessionId,
            timestamp: Date.now()
          };
          socketInstance.emit('constellation-object', controlData);
        }
        
        // Marcar que a sincronização inicial foi feita
        isInitialSync.current = false;
      }
      
      // Remover listener quando o componente desmontar
      return () => {
        socketInstance.off('constellation-object', handleConstellationObject);
        console.log('ConstellationContext: Listener removido ao desmontar');
      };
    } else {
      console.log('ConstellationContext: Socket não disponível ou sessionId não fornecido');
      
      // Tentar novamente após um breve atraso 
      const retryTimer = setTimeout(() => {
        const retrySocket = checkForGlobalSocket();
        if (retrySocket && sessionId && retrySocket !== socketRef.current) {
          console.log('ConstellationContext: Socket encontrado após atraso, reconfigurando...');
          socketRef.current = retrySocket;
          // Disparar uma atualização de estado para forçar a reexecução do useEffect
          setHasControl(prev => prev);
        }
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [sessionId, isHost, cameraPosition, cameraTarget, plateRotation, representatives, hasControl]);
  
  // Efeito para configurar ouvintes de socket
  useEffect(() => {
    console.log('ConstellationContext: Configurando listeners de socket');
    if (socketRef.current) {
      // Escutar eventos de constelação
      socketRef.current.on('constellation-object', (data) => {
        if (data && data.sessionId === sessionId) {
          console.log('Recebido objeto de constelação:', data.type);
          
          // Ignorar eventos que foram emitidos por nós mesmos
          const isSelfEvent = data.forwardedBy === socketRef.current.id;
          if (isSelfEvent) {
            console.log(`Ignorando evento do tipo ${data.type} emitido por mim mesmo`);
            return;
          }
          
          // Processar os diferentes tipos de eventos de constelação
          // (O código existente já trata isso no useEffect acima)
        }
      });
      
      // Escutar solicitações de sincronização
      socketRef.current.on('constellation-sync-request', (data) => {
        // Apenas responder se formos o host e tivermos controle
        if (isHostRef.current && hasControl && data.sessionId === sessionId) {
          console.log('Recebida solicitação de sincronização, enviando estado atual');
          
          // Enviar o estado completo atual
          emitChange({
            type: 'fullSync',
            representatives,
            plateRotation,
            cameraPosition,
            cameraTarget,
            forceSync: true
          });
        }
      });
      
      // Escutar rotações de representantes
      socketRef.current.on('representative_rotated', (data) => {
        console.log('Recebido evento representative_rotated:', data);
        
        // Ignorar eventos enviados por este mesmo cliente
        if (data.forwardedBy === socketRef.current.id) {
          console.log('Ignorando evento de rotação - enviado por este cliente');
          return;
        }
        
        // Extrair informações
        const { representativeId, rotation } = data;
        
        // Garantir que rotation seja um número
        const numericRotation = typeof rotation === 'object' ? rotation.y || 0 : Number(rotation);
        
        console.log(`Aplicando rotação ao representante ${representativeId}: ${numericRotation}`);
        
        // Aplicar a rotação no estado local
        setRepresentatives(prevReps => {
          const updatedReps = prevReps.map(rep => {
            if (rep.id === representativeId) {
              console.log(`Rotação antiga: ${rep.rotation}, Nova rotação: ${numericRotation}`);
              return { ...rep, rotation: numericRotation };
            }
            return rep;
          });
          
          // Verificar se a atualização funcionou
          const updatedRep = updatedReps.find(r => r.id === representativeId);
          if (updatedRep) {
            console.log(`Representante ${representativeId} atualizado com rotação: ${updatedRep.rotation}`);
          } else {
            console.warn(`Representante ${representativeId} não encontrado no estado local`);
          }
          
          return updatedReps;
        });
      });
      
      // Escutar atualizações completas de representantes
      socketRef.current.on('representatives_updated', (data) => {
        console.log('Recebido evento representatives_updated:', data);
        
        // Ignorar eventos enviados por este mesmo cliente
        if (data.forwardedBy === socketRef.current.id) {
          console.log('Ignorando evento de atualização completa - enviado por este cliente');
          return;
        }
        
        // Combinar com o estado atual (manter os representantes locais, mas atualizar os modificados)
        const receivedReps = data.representatives || [];
        
        // Atualizar estado
        setRepresentatives(prevReps => {
          // Criar um mapa dos representantes recebidos para busca rápida
          const receivedRepsMap = {};
          receivedReps.forEach(rep => {
            receivedRepsMap[rep.id] = rep;
          });
          
          // Atualizar os representantes locais
          return prevReps.map(rep => {
            // Se este representante estiver nos recebidos, usar as propriedades recebidas
            if (receivedRepsMap[rep.id]) {
              return { ...rep, ...receivedRepsMap[rep.id] };
            }
            // Se não estiver nos recebidos, manter como está
            return rep;
          });
        });
      });
    }

    // Limpar ouvintes quando o componente for desmontado
    return () => {
      if (socketRef.current) {
        socketRef.current.off('constellation-object');
        socketRef.current.off('constellation-sync-request');
        socketRef.current.off('representative_rotated');
        socketRef.current.off('representatives_updated');
      }
    };
  }, [sessionId, representatives, hasControl, emitChange, cameraPosition, cameraTarget, plateRotation]);
  
  // Gerar uma cor baseada no índice
  const getColorForIndex = (index) => {
    return REPRESENTATIVE_COLORS[index % REPRESENTATIVE_COLORS.length];
  };
  
  // Adicionar um novo representante
  const addRepresentative = (name, type = null, color) => {
    if (!hasControl) return;

    // Criar novo representante
    const id = `rep-${Date.now()}`;
    
    // Garantir que o nome seja uma string
    const repName = typeof name === 'string' ? name : representativeName;
    
    // Garantir que o tipo seja válido
    const finalType = type || selectedType || 'male_adult';
    console.log("addRepresentative: tipo selecionado =", selectedType, "tipo final =", finalType);
    
    // Área menor para posicionamento (dentro do prato circular)
    const radius = 3;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const posX = Math.cos(angle) * distance;
    const posZ = Math.sin(angle) * distance;
    
    const newRepresentative = {
      id,
      name: repName,
      type: finalType,
      color: color || selectedColor,
      position: { x: posX, y: 0, z: posZ },
      rotation: { x: 0, y: 0, z: 0 },
      isControlled: false
    };
    
    console.log("Criando novo representante:", newRepresentative);
    
    setRepresentatives(prev => [...prev, newRepresentative]);
    
    // Limpar campo se for adição via interface
    if (!name) {
    setRepresentativeName('');
    }
    
    // Garantir sincronização via socket usando emitChange em vez de socket direto
    emitChange({
      type: 'representative',
      action: 'add',
      representative: newRepresentative
    });
    
    return id;
  };
  
  // Selecionar um representante para mover
  const handleRepresentativeSelect = (representative) => {
    console.log("handleRepresentativeSelect chamado com:", representative ? representative.name : "null");
    
    if (!hasControl) {
      console.log("Sem controle, ignorando seleção");
      return;
    }
    
    if (representative === selectedRepresentative) {
      console.log("Desselecionando representante");
      setSelectedRepresentative(null);
    } else {
      console.log("Selecionando representante:", representative?.name);
      setSelectedRepresentative(representative);
    }

    // Mostrar dica de arrastar quando selecionar um representante
    if (representative) {
      setShowDragHint(true);
      const timer = setTimeout(() => {
        setShowDragHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  };

  // Manipulador para menu de contexto
  const handleContextMenu = (representative, event) => {
    event.preventDefault();
    // Implementar menu de contexto aqui se necessário
    console.log("Menu de contexto para:", representative.name);
  };
  
  // Atualizar a posição de um representante
  const setRepresentativePosition = (id, position) => {
    if (!hasControl) return;
    
    console.log(`Atualizando posição do representante ${id} para:`, position);
    
    // Assegurar que a posição esteja no formato correto (objeto com x, y, z)
    let normalizedPosition = position;
    if (Array.isArray(position)) {
      normalizedPosition = {
        x: position[0] || 0,
        y: position[1] || 0,
        z: position[2] || 0
      };
    }
    
    // Atualizar o estado local primeiro
    const updatedRepresentatives = representatives.map(rep =>
      rep.id === id ? { ...rep, position: normalizedPosition } : rep
    );
    
    setRepresentatives(updatedRepresentatives);
    
    // Emitir evento específico de movimento para melhor desempenho
    emitChange({
      type: 'move',
      action: 'position',
      representativeId: id,
      position: normalizedPosition
    });
    
    // Enviar evento completo do representante a cada 500ms para garantir sincronização
    // mas sem sobrecarregar a rede com atualizações constantes
    const updatedRep = updatedRepresentatives.find(rep => rep.id === id);
    if (updatedRep) {
      const now = Date.now();
      if (!updatedRep._lastFullSync || now - updatedRep._lastFullSync > 500) {
        updatedRep._lastFullSync = now;
        
        // Throttle para não sobrecarregar
    setTimeout(() => {
      emitChange({
        type: 'representative',
        action: 'update',
            representative: { ...updatedRep, _lastFullSync: undefined }
      });
    }, 50);
      }
    }
  };
  
  // Atualizar a rotação do prato
  const setPlateRotationAndSync = (rotation) => {
    // Verificar se realmente houve mudança significativa
    if (Math.abs(rotation - plateRotation) > 0.01) {
      console.log(`Atualizando rotação do prato: ${rotation.toFixed(2)} (anterior: ${plateRotation.toFixed(2)})`);
      
      // Atualizar o estado local primeiro
    setPlateRotation(rotation);
      
      // Se não tiver controle, não emitir
      if (!hasControl) {
        console.log('Sem controle, não emitindo rotação do prato');
        return;
      }
    
    // Emitir via socket
    emitChange({
      type: 'plate',
        rotation,
        forceUpdate: true
    });
    }
  };
  
  // Atualizar a posição da câmera
  const setCameraPositionAndSync = (position, target) => {
    // Verificar se a mudança é significativa para reduzir tráfego
    const prevPos = cameraPosition;
    const distance = Math.sqrt(
      Math.pow(position.x - prevPos.x, 2) + 
      Math.pow(position.y - prevPos.y, 2) + 
      Math.pow(position.z - prevPos.z, 2)
    );
    
    if (distance > 0.1) { // Reduzido de 0.2 para 0.1 para maior sensibilidade
      // Atualizar estados locais
    setCameraPosition(position);
    setCameraTarget(target || cameraTarget);
      
      // Se não tiver controle, não emitir
      if (!hasControl) {
        console.log('Sem controle, não emitindo posição da câmera');
        return;
      }
    
    // Emitir via socket
    emitChange({
      type: 'camera',
      position,
        target: target || cameraTarget,
        forceUpdate: true
    });
    }
  };
  
  // Atualizar o estado de arrastar
  const setDraggingState = (isDragging) => {
    setIsDraggingAny(isDragging);
  };
  
  // Transferir o controle
  const transferControl = () => {
    setHasControl(false);
    
    // Emit via socket
    emitChange({
      type: 'control',
      action: 'transfer',
      controller: 'client'
    });
  };
  
  // Salvar a configuração atual
  const saveConfiguration = () => {
    console.log('Configuração salva:', representatives);
    // Implementar lógica para salvar no backend
    
    // Também podemos sincronizar o estado atual com todos
    emitChange({
      type: 'fullSync',
      representatives,
      plateRotation,
      cameraPosition,
      cameraTarget
    });
  };
  
  // Iniciar edição de um representante
  const startEditing = (rep) => {
    setEditingId(rep.id);
    setEditName(rep.name);
    setEditColor(rep.color);
  };
  
  // Salvar edição de um representante
  const saveEditing = () => {
    if (!editingId || !hasControl) return;
    
    const updatedRepresentatives = representatives.map(rep => {
      if (rep.id === editingId) {
        const updatedRep = {
          ...rep,
          name: editName,
          color: editColor
        };
        
        // Emitir via socket
        emitChange({
          type: 'representative',
          action: 'update',
          representative: updatedRep
        });
        
        return updatedRep;
      }
      return rep;
    });
    
    setRepresentatives(updatedRepresentatives);
    setEditingId(null);
  };
  
  // Cancelar edição
  const cancelEditing = () => {
    setEditingId(null);
  };
  
  // Remover um representante
  const removeRepresentative = (id) => {
    if (!hasControl) return;
    
    console.log(`Removendo representante ${id}`);
    
    const updatedRepresentatives = representatives.filter(rep => rep.id !== id);
    
    setRepresentatives(updatedRepresentatives);
    
    // Garantir sincronização via socket
    if (socketRef.current && socketRef.current.connected) {
      console.log('Enviando remoção de representante via socket:', id);
      socketRef.current.emit('representative_removed', {
        sessionId,
        representativeId: id,
        forwardedBy: socketRef.current.id
      });
    }
  };
  
  // Modificar função de rotação para garantir sincronização
  const setRepresentativeRotation = (id, rotation) => {
    if (!hasControl) return;

    // Garantir que rotation seja um número
    const numericRotation = typeof rotation === 'object' ? rotation.y || 0 : Number(rotation);

    console.log(`Atualizando rotação do representante ${id} de:`, 
      representatives.find(r => r.id === id)?.rotation, 
      `para:`, numericRotation);
    
    const updatedRepresentatives = representatives.map(rep =>
      rep.id === id ? { ...rep, rotation: numericRotation } : rep
    );
    
    setRepresentatives(updatedRepresentatives);
    
    // Garantir que os eventos sejam enviados para o servidor
    if (socketRef.current && socketRef.current.connected) {
      console.log('Enviando atualização de rotação via socket para ID:', id, 'Valor:', numericRotation);
      
      // Enviar evento de rotação específico
      socketRef.current.emit('representative_rotated', {
        sessionId,
        representativeId: id,
        rotation: numericRotation,
        forwardedBy: socketRef.current.id
      });
      
      // Enviar todas as representações para garantir sincronização completa
      socketRef.current.emit('representatives_updated', {
        sessionId,
        representatives: updatedRepresentatives,
        forwardedBy: socketRef.current.id
      });
    } else {
      console.warn('Socket não disponível ou não conectado para enviar rotação');
    }
  };
  
  return (
    <ConstellationContext.Provider
      value={{
        representatives,
        selectedRepresentative,
        representativeName,
        selectedType,
        selectedColor,
        hasControl,
        isDraggingAny,
        showDragHint,
        editingId,
        editName,
        editColor,
        showNames,
        plateRotation,
        cameraPosition,
        cameraTarget,
        REPRESENTATIVE_COLORS,
        REPRESENTATIVE_TYPES,
        setRepresentativeName,
        setSelectedType,
        setSelectedColor,
        addRepresentative,
        handleRepresentativeSelect,
        handleContextMenu,
        setRepresentativePosition,
        setDraggingState,
        startEditing,
        saveEditing,
        cancelEditing,
        removeRepresentative,
        transferControl,
        saveConfiguration,
        setShowNames,
        setEditName,
        setEditColor,
        setPlateRotation: setPlateRotationAndSync,
        setCameraPosition: setCameraPositionAndSync,
        setRepresentativeRotation
      }}
    >
      {children}
    </ConstellationContext.Provider>
  );
}; 

// Adicionar uma exportação padrão do provider para facilitar a importação
export default ConstellationProvider; 