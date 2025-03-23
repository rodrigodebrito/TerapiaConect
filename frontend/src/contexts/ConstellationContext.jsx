import React, { createContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Cores para os representantes
const REPRESENTATIVE_COLORS = [
  '#4285F4', '#EA4335', '#FBBC05', '#34A853',
  '#FF6D01', '#46BDC6', '#9C27B0', '#795548'
];

// Tipos de representantes
const REPRESENTATIVE_TYPES = {
  MALE_ELDER: {
    id: 'male_elder',
    name: 'Idoso Masculino',
    modelPath: '/Representante/idoso - azul.glb'
  },
  FEMALE_ELDER: {
    id: 'female_elder',
    name: 'Idoso Feminino',
    modelPath: '/Representante/idoso - azul.glb' // Será substituído quando disponível
  },
  MALE_ADULT: {
    id: 'male_adult',
    name: 'Adulto Masculino',
    modelPath: '/Representante/idoso - azul.glb' // Será substituído quando disponível
  },
  FEMALE_ADULT: {
    id: 'female_adult',
    name: 'Adulto Feminino',
    modelPath: '/Representante/Representante Adulto Feminino.glb'
  },
  MALE_CHILD: {
    id: 'male_child',
    name: 'Criança Masculino',
    modelPath: '/Representante/idoso - azul.glb' // Será substituído quando disponível
  },
  FEMALE_CHILD: {
    id: 'female_child',
    name: 'Criança Feminino',
    modelPath: '/Representante/idoso - azul.glb' // Será substituído quando disponível
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
  
  // Salvar a configuração atual
  const saveConfiguration = () => {
    console.log('Configuração salva:', representatives);
    // Implementar lógica para salvar no backend
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

  return (
    <ConstellationContext.Provider value={{
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
      setRepresentatives,
      setSelectedRepresentative,
      setRepresentativeName,
      setSelectedType,
      setSelectedColor,
      setHasControl,
      setIsDraggingAny,
      setShowDragHint,
      setEditingId,
      setEditName,
      setEditColor,
      setShowNames,
      getColorForIndex,
      addRepresentative,
      handleRepresentativeSelect,
      handleContextMenu,
      setRepresentativePosition,
      setDraggingState,
      transferControl,
      saveConfiguration,
      startEditing,
      saveEditing,
      cancelEditing,
      removeRepresentative,
      REPRESENTATIVE_COLORS,
      REPRESENTATIVE_TYPES
    }}>
      {children}
    </ConstellationContext.Provider>
  );
};

export default ConstellationProvider; 