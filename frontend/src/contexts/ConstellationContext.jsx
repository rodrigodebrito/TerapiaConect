import React, { createContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

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

export const ConstellationContext = createContext();

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
  
  // Referência ao socket para comunicação em tempo real
  const socketRef = useRef(null);
  
  // Inicializar a conexão socket quando o componente montar
  useEffect(() => {
    // Comentado até implementar backend
    /*
    if (sessionId) {
      socketRef.current = io('http://localhost:3000', {
        query: { sessionId }
      });
      
      socketRef.current.on('connect', () => {
        console.log('Conectado ao servidor');
      });
      
      socketRef.current.on('representativesMoved', (updatedRepresentatives) => {
        setRepresentatives(updatedRepresentatives);
      });
      
      socketRef.current.on('controlTransferred', (newController) => {
        setHasControl(newController === socketRef.current.id);
      });
      
      return () => {
        socketRef.current.disconnect();
      };
    }
    */
  }, [sessionId]);
  
  // Gerar uma cor baseada no índice
  const getColorForIndex = (index) => {
    return REPRESENTATIVE_COLORS[index % REPRESENTATIVE_COLORS.length];
  };
  
  // Adicionar um novo representante
  const addRepresentative = () => {
    if (representativeName.trim() === '') return;
    
    // Área menor para posicionamento (dentro do prato circular)
    const radius = 3;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const posX = Math.cos(angle) * distance;
    const posZ = Math.sin(angle) * distance;
    
    const newRepresentative = {
      id: `rep-${Date.now()}`,
      name: representativeName,
      position: [posX, 0, posZ],
      color: selectedColor,
      type: selectedType,
      isControlled: false
    };
    
    setRepresentatives(prev => [...prev, newRepresentative]);
    setRepresentativeName('');
    
    // Emit via socket
    // if (socketRef.current) {
    //   socketRef.current.emit('representativeAdded', newRepresentative);
    // }
  };
  
  // Selecionar um representante para mover
  const handleRepresentativeSelect = (representative) => {
    if (!hasControl) return;
    
    if (representative === selectedRepresentative) {
      setSelectedRepresentative(null);
    } else {
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
    
    const updatedRepresentatives = representatives.map(rep => 
      rep.id === id ? { ...rep, position } : rep
    );
    
    setRepresentatives(updatedRepresentatives);
    
    // Emit via socket
    // if (socketRef.current) {
    //   socketRef.current.emit('representativesMoved', updatedRepresentatives);
    // }
  };
  
  // Atualizar o estado de arrastar
  const setDraggingState = (isDragging) => {
    setIsDraggingAny(isDragging);
  };
  
  // Transferir o controle
  const transferControl = () => {
    setHasControl(false);
    
    // Emit via socket
    // if (socketRef.current) {
    //   socketRef.current.emit('transferControl', 'client');
    // }
  };
  
  // Tomar controle de volta (apenas para o terapeuta/host)
  const takeControl = () => {
    if (isHost) {
      setHasControl(true);
      console.log('Terapeuta retomou o controle do campo');
      
      // Emit via socket
      // if (socketRef.current) {
      //   socketRef.current.emit('takeControl', 'therapist');
      // }
    }
  };
  
  // Salvar a configuração atual
  const saveConfiguration = () => {
    console.log('Configuração salva:', representatives);
    
    // Criar um objeto com os dados da constelação
    const constellationData = {
      sessionId,
      timestamp: new Date().toISOString(),
      representatives: representatives.map(rep => ({
        id: rep.id,
        name: rep.name,
        position: rep.position,
        color: rep.color,
        type: rep.type
      }))
    };
    
    // Implementar lógica para salvar no backend
    // if (socketRef.current) {
    //   socketRef.current.emit('saveConstellation', constellationData);
    // }
    
    // Retornar os dados para uso externo
    return constellationData;
  };
  
  // Iniciar a edição de um representante
  const startEditing = (rep) => {
    setEditingId(rep.id);
    setEditName(rep.name);
    setEditColor(rep.color);
  };
  
  // Salvar a edição de um representante
  const saveEditing = () => {
    if (!editingId) return;
    
    console.log(`Salvando edição para representante ${editingId}:`, { nome: editName, cor: editColor });
    
    const updatedRepresentatives = representatives.map(rep => 
      rep.id === editingId ? { ...rep, name: editName, color: editColor } : rep
    );
    
    setRepresentatives(updatedRepresentatives);
    setEditingId(null);
    
    // Emit via socket
    // if (socketRef.current) {
    //   socketRef.current.emit('representativesMoved', updatedRepresentatives);
    // }
  };
  
  // Cancelar a edição
  const cancelEditing = () => {
    setEditingId(null);
  };
  
  // Remover um representante
  const removeRepresentative = (id) => {
    const updatedRepresentatives = representatives.filter(rep => rep.id !== id);
    
    setRepresentatives(updatedRepresentatives);
    
    if (selectedRepresentative?.id === id) {
      setSelectedRepresentative(null);
    }
    
    // Emit via socket
    // if (socketRef.current) {
    //   socketRef.current.emit('representativeRemoved', id);
    // }
  };

  // Criar o contexto com os valores
  const value = {
    representatives,
    selectedRepresentative,
    representativeName,
    selectedType,
    selectedColor,
    hasControl,
    showDragHint,
    editingId,
    editName,
    editColor,
    isDraggingAny,
    showNames,
    
    // Setters
    setRepresentativeName,
    setSelectedType,
    setSelectedColor,
    setShowNames,
    setEditName,
    setEditColor,
    
    // Ações
    addRepresentative,
    handleRepresentativeClick: handleRepresentativeSelect,
    setRepresentativePosition,
    setDraggingState,
    transferControl,
    takeControl,
    saveConfiguration,
    startEditing,
    saveEditing,
    cancelEditing,
    removeRepresentative,
    
    // Constantes 
    REPRESENTATIVE_COLORS,
    REPRESENTATIVE_TYPES
  };

  return (
    <ConstellationContext.Provider value={value}>
      {children}
    </ConstellationContext.Provider>
  );
};

export default ConstellationProvider; 