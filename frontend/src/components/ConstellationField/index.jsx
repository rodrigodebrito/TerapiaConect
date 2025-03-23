import React, { useRef, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import './ConstellationField.css';
import ConstellationProvider, { ConstellationContext } from '../../contexts/ConstellationContext';

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
    modelPath: '/src/representantes/06 - Representante Idoso Masculino.glb'
  },
  FEMALE_ELDER: {
    id: 'female_elder',
    name: 'Idoso Feminino',
    modelPath: '/src/representantes/05 - Representante Idoso Feminino.glb'
  },
  MALE_ADULT: {
    id: 'male_adult',
    name: 'Adulto Masculino',
    modelPath: '/src/representantes/01 - Representante Adulto Masculino.glb'
  },
  FEMALE_ADULT: {
    id: 'female_adult',
    name: 'Adulto Feminino',
    modelPath: '/src/representantes/02 - Representante Adulto Feminino.glb'
  },
  MALE_CHILD: {
    id: 'male_child',
    name: 'Criança Masculino',
    modelPath: '/src/representantes/04 - Representante Criança Masculino.glb'
  },
  FEMALE_CHILD: {
    id: 'female_child',
    name: 'Criança Feminino',
    modelPath: '/src/representantes/03 - Representante Criança Feminino.glb'
  },
  SUBJETIVO_LONGO: {
    id: 'subjetivo_longo',
    name: 'Subjetivo Longo',
    modelPath: '/src/representantes/Subjetivo Longo.glb'
  },
  SUBJETIVO_CURTO: {
    id: 'subjetivo_curto',
    name: 'Subjetivo Curto',
    modelPath: '/src/representantes/Subjetivo curto.glb'
  }
};

// Carregar todos os modelos antecipadamente
// Preload dos modelos para garantir disponibilidade
useGLTF.preload(REPRESENTATIVE_TYPES.MALE_ELDER.modelPath);
useGLTF.preload(REPRESENTATIVE_TYPES.FEMALE_ELDER.modelPath);
useGLTF.preload(REPRESENTATIVE_TYPES.MALE_ADULT.modelPath);
useGLTF.preload(REPRESENTATIVE_TYPES.FEMALE_ADULT.modelPath);
useGLTF.preload(REPRESENTATIVE_TYPES.MALE_CHILD.modelPath);
useGLTF.preload(REPRESENTATIVE_TYPES.FEMALE_CHILD.modelPath);
useGLTF.preload(REPRESENTATIVE_TYPES.SUBJETIVO_LONGO.modelPath);
useGLTF.preload(REPRESENTATIVE_TYPES.SUBJETIVO_CURTO.modelPath);

// Componente para o campo de constelação
const ConstellationField = ({ isHost = true, sessionId = null }) => {
  return (
    <ConstellationProvider isHost={isHost} sessionId={sessionId}>
      <ConstellationView />
    </ConstellationProvider>
  );
};

// Componente de visualização que usa o ConstellationContext
const ConstellationView = () => {
  const { 
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
    setRepresentativeName,
    setSelectedType,
    setSelectedColor,
    addRepresentative,
    startEditing,
    saveEditing,
    cancelEditing,
    removeRepresentative,
    transferControl,
    saveConfiguration,
    setShowNames,
    REPRESENTATIVE_COLORS,
    REPRESENTATIVE_TYPES
  } = useContext(ConstellationContext);

  return (
    <div className="constellation-field-container">
      <div className="constellation-controls">
        {/* Painel lateral para opções */}
        <div className="control-panel">
          <h3 className="panel-title">Representantes</h3>
          
          {/* Adicionar um novo representante */}
          <div className="add-representative">
            <input
              type="text"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              placeholder="Nome do representante"
              className="name-input"
            />
            
            <div className="type-selection">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="type-dropdown"
              >
                {Object.values(REPRESENTATIVE_TYPES).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="color-selection">
              {REPRESENTATIVE_COLORS.map((color, index) => (
                <div 
                  key={index}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            
            <button 
              onClick={addRepresentative}
              className="add-btn"
              disabled={!hasControl || representativeName.trim() === ''}
            >
              + Adicionar
            </button>
          </div>
          
          {/* Lista de representantes */}
          <div className="representatives-list">
            {representatives.map((rep) => (
              <div key={rep.id} className="representative-item">
                {editingId === rep.id ? (
                  // Modo de edição
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="edit-name-input"
                      autoFocus
                    />
                    
                    <div className="edit-color-selection">
                      {REPRESENTATIVE_COLORS.map((color, index) => (
                        <div 
                          key={index}
                          className={`color-option mini ${editColor === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                    
                    <div className="edit-actions">
                      <button 
                        className="save-edit-btn"
                        onClick={saveEditing}
                        title="Salvar alterações"
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-edit-btn"
                        onClick={cancelEditing}
                        title="Cancelar edição"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo de visualização
                  <>
                    <div 
                      className="color-indicator" 
                      style={{ backgroundColor: rep.color }}
                    />
                    <div className="name">
                      {rep.name}
                    </div>
                    <div className="type-indicator">
                      {Object.values(REPRESENTATIVE_TYPES).find(t => t.id === rep.type)?.name.split(' ')[0]}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => startEditing(rep)}
                        title="Editar representante"
                      >
                        ✎
                      </button>
                      <button 
                        className="remove-btn"
                        onClick={() => removeRepresentative(rep.id)}
                        title="Remover representante"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {/* Botões de controle */}
          <div className="control-buttons">
            <button 
              onClick={transferControl}
              className="control-button"
              disabled={!hasControl}
            >
              {hasControl ? 'Passar Controle' : 'Recuperar Controle'}
            </button>
            
            <button 
              onClick={saveConfiguration}
              className="control-button"
            >
              Salvar Configuração
            </button>
            
            <button 
              onClick={() => setShowNames(!showNames)}
              className="control-button view-toggle"
            >
              {showNames ? 'Ocultar Nomes' : 'Mostrar Nomes'}
            </button>
          </div>
        </div>
        
        {hasControl && (
          <div className="control-status">
            <div className="status-indicator"></div>
            <span>Você tem o controle</span>
          </div>
        )}
        
        {!hasControl && (
          <div className="control-status observer">
            <div className="status-indicator"></div>
            <span>Você está como observador</span>
          </div>
        )}
      </div>
      
      <div className="canvas-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', padding: 0, margin: 0 }}>
        <Canvas 
          shadows 
          camera={{ position: [0, 8, 10], fov: 45 }}
          style={{ background: 'transparent', margin: 0, padding: 0, width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <ambientLight intensity={1} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow={false}
          />
          <spotLight
            position={[-5, 10, 5]}
            intensity={0.8}
            angle={0.5}
            penumbra={0.5}
            castShadow={false}
          />
          <Field 
            viewMode={hasControl ? "edit" : "readonly"}
          />
          <OrbitControls 
            enabled={!selectedRepresentative}
          />
        </Canvas>
        
        {/* Dica de arrastar quando selecionar um representante */}
        {showDragHint && (
          <div className="drag-hint">
            <p>Arraste para mover ou segure SHIFT para rotacionar o representante</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para os círculos decorativos e direções da rosa dos ventos
const CompassRose = () => {
  return (
    <group>
      {/* Círculos decorativos */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5, 5.05, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 4.05, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.05, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.05, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 1.05, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      
      {/* Linhas direcionais primárias (N, S, L, O) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Norte */}
        <mesh position={[0, 3, 0.01]}>
          <boxGeometry args={[0.05, 3, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
        {/* Indicador Norte */}
        <mesh position={[0, 5.5, 0.01]}>
          <boxGeometry args={[0.6, 0.15, 0.01]} />
          <meshBasicMaterial color="#4285F4" transparent opacity={0.8} />
        </mesh>
        
        {/* Sul */}
        <mesh position={[0, -3, 0.01]}>
          <boxGeometry args={[0.05, 3, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
        
        {/* Leste */}
        <mesh position={[3, 0, 0.01]}>
          <boxGeometry args={[3, 0.05, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
        
        {/* Oeste */}
        <mesh position={[-3, 0, 0.01]}>
          <boxGeometry args={[3, 0.05, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      </group>
      
      {/* Linhas diagonais secundárias (NE, NO, SE, SO) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Nordeste */}
        <mesh position={[2.12, 2.12, 0.01]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 3.6, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
        
        {/* Noroeste */}
        <mesh position={[-2.12, 2.12, 0.01]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.05, 3.6, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
        
        {/* Sudeste */}
        <mesh position={[2.12, -2.12, 0.01]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.05, 3.6, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
        
        {/* Sudoeste */}
        <mesh position={[-2.12, -2.12, 0.01]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 3.6, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
};

const Field = ({ viewMode }) => {
  // Carregar a textura para o plano
  const circleTexture = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    return textureLoader.load('/white-circle.png');
  }, []);

  // Acessar os estados e funções do componente pai
  const { representatives, selectedRepresentative, handleRepresentativeSelect, handleContextMenu } = useContext(ConstellationContext);

  return (
    <group>
      {/* Plano circular branco */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          handleRepresentativeSelect(null);
        }}
      >
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial 
          map={circleTexture}
          color="#f0f0f0" 
          roughness={0.2}
          metalness={0.3}
          side={THREE.DoubleSide}
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Componente decorativo */}
      <CompassRose />

      {/* Renderizar os representantes */}
      {representatives.map((rep) => (
        <Representative
          key={rep.id}
          representative={rep}
          selected={selectedRepresentative?.id === rep.id}
          onSelect={handleRepresentativeSelect}
          onContextMenu={handleContextMenu}
          viewMode={viewMode}
        />
      ))}
    </group>
  );
};

// Componente para um representante individual (modelo 3D)
const Representative = ({ representative, selected, onSelect, onContextMenu, viewMode }) => {
  const { id, name, position, color, type } = representative;
  const [localPosition, setLocalPosition] = useState([position[0], 0, position[2]]);
  const [rotation, setRotation] = useState(0);
  const modelRef = useRef();
  const { camera } = useThree();
  const tempRay = useMemo(() => new THREE.Raycaster(), []);
  
  // Obter funções e estados do contexto
  const { setRepresentativePosition, setDraggingState, showNames } = useContext(ConstellationContext);
  
  // Carregar o modelo 3D apropriado para o tipo de representante com preload
  const modelPath = useMemo(() => {
    return REPRESENTATIVE_TYPES[Object.keys(REPRESENTATIVE_TYPES).find(key => 
      REPRESENTATIVE_TYPES[key].id === type
    )]?.modelPath || REPRESENTATIVE_TYPES.MALE_ELDER.modelPath;
  }, [type]);
  
  // Usar diretamente useGLTF com clone para garantir que cada instância seja independente
  const { scene: originalModel } = useGLTF(modelPath);
  
  // Clonar o modelo para evitar compartilhamento de instâncias
  const model = useMemo(() => {
    if (originalModel) {
      return originalModel.clone(true);
    }
    return null;
  }, [originalModel]);
  
  // Definir a escala baseada no tipo do representante
  const modelScale = useMemo(() => {
    if (type === 'male_child' || type === 'female_child') {
      return 0.8; // Tamanho reduzido para crianças
    } else if (type === 'subjetivo_longo') {
      return 1.2; // Tamanho maior para subjetivo longo
    } else if (type === 'subjetivo_curto') {
      return 0.6; // Tamanho bem menor para subjetivo curto
    }
    return 1.0; // Tamanho normal para adultos e idosos
  }, [type]);
  
  // Limpar quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (model) {
        // Limpar memória do modelo e materiais
        model.traverse((node) => {
          if (node.isMesh) {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach(material => material.dispose());
              } else {
                node.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [model]);
  
  // Aplicar a cor selecionada ao modelo
  useEffect(() => {
    if (model) {
      model.traverse((node) => {
        if (node.isMesh && node.material) {
          // Clonar o material para não afetar outras instâncias do mesmo modelo
          node.material = node.material.clone();
          
          // Aplicar a cor selecionada
          node.material.color.set(color);
          
          // Adicionar efeito de emissão quando selecionado
          if (selected) {
            node.material.emissive = new THREE.Color(color);
            node.material.emissiveIntensity = 0.3;
          } else {
            node.material.emissive = new THREE.Color('#000000');
            node.material.emissiveIntensity = 0;
          }
        }
      });
    }
  }, [model, color, selected]);
  
  // Informações de arrastar
  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosition: new THREE.Vector3(),
    startPoint: new THREE.Vector3(),
    startRotation: 0,
    isRotating: false
  });
  
  // Manter a posição do modela atualizada com a posição externa
  useEffect(() => {
    if (!dragInfo.current.isDragging) {
      // Mantém a altura Y fixa enquanto atualiza X e Z
      setLocalPosition([position[0], 0, position[2]]);
    }
  }, [position]);
  
  // Ajustar escala do modelo
  useEffect(() => {
    if (modelRef.current) {
      // Aplicar escala padrão para todos os modelos
      const scale = modelScale;
      
      // Ajuste específico para o modelo Adulto Feminino para garantir consistência
      if (type === REPRESENTATIVE_TYPES.FEMALE_ADULT.id) {
        modelRef.current.scale.set(scale, scale, scale);
      } else {
        // Escala padrão para os outros modelos
        modelRef.current.scale.set(scale, scale, scale);
      }
      
      modelRef.current.rotation.y = rotation;
    }
  }, [rotation, type, modelScale]);
  
  // Atualizar rotação no frame
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = rotation;
    }
  });
  
  // Função para converter coordenadas de tela para coordenadas no plano horizontal
  const screenToPlaneCoordinates = useCallback((screenX, screenY) => {
    // Converter coordenadas da tela para normalized device coordinates (-1 a +1)
    const x = (screenX / window.innerWidth) * 2 - 1;
    const y = -(screenY / window.innerHeight) * 2 + 1;
    
    // Configurar o raycaster a partir da câmera
    tempRay.setFromCamera({ x, y }, camera);
    
    // Verificar interseção com o plano horizontal
    const planeHeight = 0; // Altura do plano onde o representante se move
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeHeight);
    
    // Calcular o ponto de interseção
    const target = new THREE.Vector3();
    if (tempRay.ray.intersectPlane(plane, target)) {
      // Retornamos as coordenadas globais, independente da rotação da câmera
      return target;
    }
    
    return null;
  }, [camera, tempRay]);
  
  // Manipulador de eventos para clique do mouse
  const handleMouseDown = useCallback((e) => {
    if (viewMode === 'readonly') return;
    
    // Parar propagação para evitar que eventos de clique afetem outros objetos
    e.stopPropagation();
    
    // Selecionar este representante
    onSelect(representative);
    
    // Calcular o ponto de início no plano
    const startPoint = screenToPlaneCoordinates(e.clientX, e.clientY);
    
    // Indicar que o arrasto começou
    dragInfo.current.isDragging = true;
    dragInfo.current.startX = e.clientX;
    dragInfo.current.startY = e.clientY;
    dragInfo.current.startPosition.set(localPosition[0], localPosition[1], localPosition[2]);
    dragInfo.current.startPoint = startPoint.clone();
    dragInfo.current.startRotation = rotation;
    dragInfo.current.isRotating = false;
    
    // Adicionar eventos globais para capturar movimento e liberação do mouse
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mudar cursor para indicar que o objeto está sendo arrastado
    document.body.style.cursor = 'grabbing';
    
    // Informar ao contexto que começamos a arrastar
    setDraggingState(true);
  }, [localPosition, rotation, viewMode, representative, onSelect, screenToPlaneCoordinates, setDraggingState]);
  
  // Manipulador para liberar o mouse
  const handleMouseUp = useCallback(() => {
    if (dragInfo.current.isDragging) {
      // Indicar que o arrasto terminou
      dragInfo.current.isDragging = false;
      dragInfo.current.isRotating = false;
      
      // Remover os eventos globais
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      // Restaurar o cursor padrão
      document.body.style.cursor = 'auto';
      
      // Informar ao contexto que paramos de arrastar
      setDraggingState(false);
    }
  }, [setDraggingState]);
  
  // Manipuladores para teclas (para ativar rotação)
  const handleKeyDown = useCallback((e) => {
    if (e.shiftKey && dragInfo.current.isDragging) {
      dragInfo.current.isRotating = true;
      document.body.style.cursor = 'ew-resize';
    }
  }, []);
  
  const handleKeyUp = useCallback((e) => {
    if (!e.shiftKey && dragInfo.current.isDragging) {
      dragInfo.current.isRotating = false;
      document.body.style.cursor = 'grabbing';
    }
  }, []);
  
  // Manipulador para movimento do mouse
  const handleMouseMove = useCallback((e) => {
    if (!dragInfo.current.isDragging) return;
    
    // Verificar se está no modo de rotação (shift pressionado)
    if (e.shiftKey || dragInfo.current.isRotating) {
      dragInfo.current.isRotating = true;
      // Calcular rotação (movimento horizontal do mouse)
      const deltaX = (e.clientX - dragInfo.current.startX) * 0.02;
      
      // Aplicar rotação
      const newRotation = dragInfo.current.startRotation + deltaX;
      setRotation(newRotation);
    } else {
      // Para movimento normal, usar raycasting para mapear movimento do mouse para o plano
      const currentPoint = screenToPlaneCoordinates(e.clientX, e.clientY);
      
      if (currentPoint) {
        // Calcular o deslocamento no plano do mundo
        const movementX = currentPoint.x - dragInfo.current.startPoint.x;
        const movementZ = currentPoint.z - dragInfo.current.startPoint.z;
        
        // Calcular nova posição baseada no deslocamento
        const newX = dragInfo.current.startPosition.x + movementX;
        const newZ = dragInfo.current.startPosition.z + movementZ;
        
        // Limitar à área do prato (círculo com raio 5.5)
        const plateRadius = 5.5;
        const distance = Math.sqrt(newX * newX + newZ * newZ);
        
        let limitedX = newX;
        let limitedZ = newZ;
        
        // Se a posição estiver fora do prato, ajustar para a borda
        if (distance > plateRadius) {
          const angle = Math.atan2(newZ, newX);
          limitedX = Math.cos(angle) * plateRadius;
          limitedZ = Math.sin(angle) * plateRadius;
        }
        
        // Atualizar posição (mantendo Y constante)
        const newPosition = [limitedX, 0, limitedZ];
        
        setLocalPosition(newPosition);
        
        // Atualizar a posição no contexto global
        setRepresentativePosition && setRepresentativePosition(id, [limitedX, 0, limitedZ]);
      }
    }
  }, [rotation, screenToPlaneCoordinates, id, setRepresentativePosition]);

  // Mostrar o modelo com uma cor de destaque se selecionado
  return (
    <group
      ref={modelRef}
      position={localPosition}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(representative);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu && onContextMenu(representative, e);
      }}
      onPointerDown={handleMouseDown}
      scale={[modelScale, modelScale, modelScale]}
    >
      {model && <primitive object={model} position={[0, 1.0, 0]} />}
      
      {/* Rótulo com o nome do representante - só exibir se showNames for true */}
      {showNames && (
        <Html
          position={[0, 3.0, 0]}
          center
          distanceFactor={15}
          transform
          sprite
        >
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: selected ? '#3498db' : 'white',
            padding: '1px 3px',
            borderRadius: '2px',
            fontSize: '10px',
            fontWeight: selected ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            textAlign: 'center',
            maxWidth: '60px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: 0.9,
            lineHeight: '1.2'
          }}>
            {name}
          </div>
        </Html>
      )}
      
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.45, 32]} />
          <meshBasicMaterial color="#3498db" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};

export default ConstellationField; 