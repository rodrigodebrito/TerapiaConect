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
const ConstellationField = ({ isHost = true, sessionId = null, fieldTexture = "/white-circle.png", panelVisible = true, optimized = false, modalMode = false }) => {
  return (
    <ConstellationProvider isHost={isHost} sessionId={sessionId}>
      <ConstellationView 
        fieldTexture={fieldTexture} 
        panelVisible={panelVisible} 
        optimized={optimized} 
        modalMode={modalMode}
      />
    </ConstellationProvider>
  );
};

// Componente de visualização que usa o ConstellationContext
const ConstellationView = ({ fieldTexture, panelVisible, optimized, modalMode }) => {
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
    setEditName,
    setEditColor,
    REPRESENTATIVE_COLORS,
    REPRESENTATIVE_TYPES,
    handleRepresentativeClick,
    setRepresentativePosition,
    setDraggingState
  } = useContext(ConstellationContext);

  return (
    <div className={`constellation-field-container ${optimized ? 'optimized-mode' : ''} ${modalMode ? 'modal-mode' : ''}`}>
      <div className={`constellation-controls simplified ${!panelVisible ? 'hidden' : ''} ${modalMode ? 'modal-controls' : ''}`}>
        {/* Painel lateral para opções */}
        <div className={`control-panel custom-clicable ${modalMode ? 'modal-panel' : ''}`}>
          <h3 className="panel-title custom-clicable">Representantes</h3>
          
          {/* Adicionar um novo representante */}
          <div className="add-representative custom-clicable">
            <input
              type="text"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              placeholder="Nome do representante"
              className="name-input custom-clicable"
            />
            
            <div className="type-selection custom-clicable">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="type-dropdown custom-clicable"
              >
                {Object.values(REPRESENTATIVE_TYPES).map((type) => (
                  <option key={type.id} value={type.id} className="custom-clicable">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="color-selection custom-clicable">
              {REPRESENTATIVE_COLORS.map((color, index) => {
                // Adicionar bordas especiais para branco e preto
                const isWhite = color === '#FFFFFF';
                const isBlack = color === '#000000';
                
                // Estilos especiais para branco e preto
                const specialStyle = {};
                if (isWhite) {
                  specialStyle.border = '2px solid #aaa';
                  specialStyle.boxShadow = '0 0 4px rgba(0,0,0,0.2)';
                } else if (isBlack) {
                  specialStyle.border = '2px solid #666';
                  specialStyle.boxShadow = '0 0 4px rgba(255,255,255,0.2)';
                } else if (selectedColor === color) {
                  specialStyle.border = '2px solid #333';
                } else {
                  specialStyle.border = '2px solid transparent';
                }
                
                return (
                  <div 
                    key={index}
                    className={`color-option custom-clicable ${selectedColor === color ? 'selected' : ''}`}
                    style={{ 
                      backgroundColor: color,
                      ...specialStyle
                    }}
                    onClick={() => setSelectedColor(color)}
                    title={isWhite ? 'Branco' : isBlack ? 'Preto' : color}
                  />
                );
              })}
            </div>
            
            <button 
              onClick={addRepresentative}
              className="add-btn custom-clicable"
              disabled={!hasControl || representativeName.trim() === ''}
            >
              + Adicionar
            </button>
          </div>
          
          {/* Lista de representantes */}
          <div className="representatives-list custom-clicable">
            {representatives.map((rep) => (
              <div key={rep.id} className="representative-item custom-clicable">
                {editingId === rep.id ? (
                  // Modo de edição
                  <div className="edit-mode custom-clicable">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="edit-name-input custom-clicable"
                      autoFocus
                    />
                    
                    <div className="edit-color-selection custom-clicable">
                      {REPRESENTATIVE_COLORS.map((color, index) => {
                        const isWhite = color === '#FFFFFF';
                        const isBlack = color === '#000000';
                        
                        // Estilos especiais para branco e preto
                        const specialStyle = {};
                        if (isWhite) {
                          specialStyle.border = '2px solid #aaa';
                          specialStyle.boxShadow = '0 0 4px rgba(0,0,0,0.2)';
                        } else if (isBlack) {
                          specialStyle.border = '2px solid #666';
                          specialStyle.boxShadow = '0 0 4px rgba(255,255,255,0.2)';
                        } else if (editColor === color) {
                          specialStyle.border = '2px solid #333';
                        } else {
                          specialStyle.border = '2px solid transparent';
                        }
                        
                        return (
                          <div 
                            key={index}
                            className={`color-option mini custom-clicable ${editColor === color ? 'selected' : ''}`}
                            style={{ 
                              backgroundColor: color,
                              ...specialStyle
                            }}
                            onClick={() => setEditColor(color)}
                            title={isWhite ? 'Branco' : isBlack ? 'Preto' : color}
                          />
                        );
                      })}
                    </div>
                    
                    <div className="edit-actions custom-clicable">
                      <button 
                        className="save-edit-btn custom-clicable"
                        onClick={() => {
                          console.log('Salvando edições:', editName, editColor);
                          saveEditing();
                        }}
                        title="Salvar alterações"
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-edit-btn custom-clicable"
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
              Passar
            </button>
            
            <button 
              onClick={saveConfiguration}
              className="control-button"
            >
              Salvar
            </button>
            
            <button 
              onClick={() => setShowNames(!showNames)}
              className="control-button view-toggle"
            >
              {showNames ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        
        {hasControl && (
          <div className="control-status">
            <div className="status-indicator"></div>
            <span>Controle ativo</span>
          </div>
        )}
        
        {!hasControl && (
          <div className="control-status observer">
            <div className="status-indicator"></div>
            <span>Observador</span>
          </div>
        )}
      </div>
      
      <div className="canvas-container">
        <Canvas 
          shadows 
          camera={{ position: [0, 8, 12], fov: 45 }}
          style={{ background: '#e6e0ff' }}
          gl={{ 
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
          }}
        >
          <color attach="background" args={['#e6e0ff']} />
          <fog attach="fog" args={['#e6e0ff', 35, 45]} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[3, 5, 3]}
            intensity={0.8}
            castShadow
          />
          <pointLight position={[-3, 5, -3]} intensity={0.4} />
          <spotLight
            position={[0, 8, 0]}
            intensity={0.3}
            angle={Math.PI / 4}
            penumbra={0.2}
            castShadow
          />

          <mesh 
            position={[0, 0, 0]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            receiveShadow
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              handleRepresentativeClick(null);
            }}
          >
            <circleGeometry args={[5, 64]} />
            <meshPhysicalMaterial 
              color="#000000"
              metalness={0.7}
              roughness={0.2}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              reflectivity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Círculos decorativos com linhas mais brilhantes */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.5, 4.55, 64]} />
            <meshStandardMaterial 
              color="#888888" 
              metalness={0.9}
              roughness={0.1}
              emissive="#ffffff"
              emissiveIntensity={0.1}
            />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 3.55, 64]} />
            <meshStandardMaterial 
              color="#888888"
              metalness={0.9}
              roughness={0.1}
              emissive="#ffffff"
              emissiveIntensity={0.1}
            />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 2.55, 64]} />
            <meshStandardMaterial 
              color="#888888"
              metalness={0.9}
              roughness={0.1}
              emissive="#ffffff"
              emissiveIntensity={0.1}
            />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.55, 32]} />
            <meshStandardMaterial 
              color="#888888"
              metalness={0.9}
              roughness={0.1}
              emissive="#ffffff"
              emissiveIntensity={0.1}
            />
          </mesh>

          <Field 
            fieldTexture={fieldTexture} 
            representatives={representatives}
            selectedRepresentative={selectedRepresentative}
            onSelectionChange={handleRepresentativeClick}
            onPositionChange={setRepresentativePosition}
            onDragChange={setDraggingState}
            canMove={hasControl}
          />
          <OrbitControls 
            makeDefault
            enablePan={true}
            screenSpacePanning={true}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 6}
            enableRotate={!isDraggingAny}
            maxDistance={15}
            minDistance={4}
            enabled={!isDraggingAny}
            keyPanSpeed={15}
            panSpeed={1.5}
            enableDamping={true}
            dampingFactor={0.05}
            target={[0, 0, 0]}
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
        <ringGeometry args={[4.5, 4.55, 64]} />
        <meshBasicMaterial color="#cccccc" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.5, 3.55, 64]} />
        <meshBasicMaterial color="#cccccc" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.55, 64]} />
        <meshBasicMaterial color="#cccccc" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 32]} />
        <meshBasicMaterial color="#cccccc" transparent opacity={0.4} />
      </mesh>
      
      {/* Linhas direcionais primárias (N, S, L, O) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Norte */}
        <mesh position={[0, 4, 0.01]}>
          <boxGeometry args={[0.05, 4, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
        {/* Indicador Norte */}
        <mesh position={[0, 6.5, 0.01]}>
          <boxGeometry args={[0.6, 0.15, 0.01]} />
          <meshBasicMaterial color="#4285F4" transparent opacity={0.8} />
        </mesh>
        
        {/* Sul */}
        <mesh position={[0, -4, 0.01]}>
          <boxGeometry args={[0.05, 4, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
        
        {/* Leste */}
        <mesh position={[4, 0, 0.01]}>
          <boxGeometry args={[4, 0.05, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
        
        {/* Oeste */}
        <mesh position={[-4, 0, 0.01]}>
          <boxGeometry args={[4, 0.05, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      </group>
      
      {/* Linhas diagonais secundárias (NE, NO, SE, SO) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Nordeste */}
        <mesh position={[2.83, 2.83, 0.01]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
        
        {/* Noroeste */}
        <mesh position={[-2.83, 2.83, 0.01]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
        
        {/* Sudeste */}
        <mesh position={[2.83, -2.83, 0.01]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
        
        {/* Sudoeste */}
        <mesh position={[-2.83, -2.83, 0.01]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
};

const Field = ({ fieldTexture, representatives, selectedRepresentative, handleRepresentativeSelect, handleContextMenu }) => {
  // Carregar a textura para o plano
  const circleTexture = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    return textureLoader.load(fieldTexture || '/white-circle.png');
  }, [fieldTexture]);

  // Acessar os estados e funções do componente pai
  const { handleRepresentativeSelect: contextHandleSelect, handleContextMenu: contextHandleContextMenu } = useContext(ConstellationContext);

  const finalHandleSelect = handleRepresentativeSelect || contextHandleSelect;
  const finalHandleContextMenu = handleContextMenu || contextHandleContextMenu;

  return (
    <group>
      {/* Plano circular branco */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          finalHandleSelect(null);
        }}
      >
        <circleGeometry args={[5, 64]} />
        <meshBasicMaterial 
          color="#ffffff"
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Círculos decorativos com linhas cinzas */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.5, 4.55, 64]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.5, 3.55, 64]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.55, 64]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 32]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      
      {/* Componente decorativo */}
      <CompassRose />

      {/* Renderizar os representantes */}
      {representatives.map((rep) => (
        <Representative
          key={rep.id}
          representative={rep}
          selected={selectedRepresentative?.id === rep.id}
          onSelect={finalHandleSelect}
          onContextMenu={finalHandleContextMenu}
        />
      ))}
    </group>
  );
};

// Componente para um representante individual (modelo 3D)
const Representative = ({ representative, selected, onSelect, onContextMenu }) => {
  const { id, name, position, color, type } = representative;
  const [localPosition, setLocalPosition] = useState([position[0], 0, position[2]]);
  const [rotation, setRotation] = useState(0);
  const modelRef = useRef();
  const { camera } = useThree();
  const { setRepresentativePosition, setDraggingState, showNames } = useContext(ConstellationContext);
  
  // Referência única para informações de arrasto
  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosition: new THREE.Vector3(),
    startPoint: new THREE.Vector3(),
    startRotation: 0,
    isRotating: false
  });

  // Função para converter coordenadas de tela para coordenadas no plano
  const screenToPlaneCoordinates = useCallback((clientX, clientY) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Usar coordenadas relativas ao canvas
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Criar raycaster e plano
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    
    const hit = raycaster.ray.intersectPlane(plane, intersection);
    return hit ? intersection : null;
  }, [camera]);

  // Manipulador de movimento do mouse
  const handleMouseMove = useCallback((e) => {
    if (!dragInfo.current.isDragging) return;

    if (e.shiftKey || dragInfo.current.isRotating) {
      // Modo de rotação
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const deltaX = ((e.clientX - dragInfo.current.startX) / rect.width) * Math.PI * 2;
      setRotation(dragInfo.current.startRotation + deltaX);
    } else {
      // Modo de movimento
      const currentPoint = screenToPlaneCoordinates(e.clientX, e.clientY);
      if (!currentPoint || !dragInfo.current.startPoint) return;

      const deltaX = currentPoint.x - dragInfo.current.startPoint.x;
      const deltaZ = currentPoint.z - dragInfo.current.startPoint.z;

      const newX = dragInfo.current.startPosition.x + deltaX;
      const newZ = dragInfo.current.startPosition.z + deltaZ;

      // Limitar ao círculo
      const radius = 5;
      const distance = Math.sqrt(newX * newX + newZ * newZ);
      
      let finalX = newX;
      let finalZ = newZ;
      
      if (distance > radius) {
        const angle = Math.atan2(newZ, newX);
        finalX = Math.cos(angle) * radius;
        finalZ = Math.sin(angle) * radius;
      }

      setLocalPosition([finalX, 0, finalZ]);
      setRepresentativePosition(id, [finalX, 0, finalZ]);
    }
  }, [id, screenToPlaneCoordinates, setRepresentativePosition]);

  // Manipulador de teclas
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

  // Manipulador para soltar o mouse
  const handleMouseUp = useCallback(() => {
    if (dragInfo.current.isDragging) {
      dragInfo.current.isDragging = false;
      dragInfo.current.isRotating = false;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      document.body.style.cursor = 'auto';
      setDraggingState(false);
    }
  }, [handleMouseMove, handleKeyDown, handleKeyUp, setDraggingState]);

  // Manipulador de clique do mouse
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    onSelect(representative);

    const startPoint = screenToPlaneCoordinates(e.clientX, e.clientY);
    if (!startPoint) return;

    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosition: new THREE.Vector3(localPosition[0], localPosition[1], localPosition[2]),
      startPoint: startPoint,
      startRotation: rotation,
      isRotating: false
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    document.body.style.cursor = 'grabbing';
    setDraggingState(true);
  }, [localPosition, rotation, representative, onSelect, screenToPlaneCoordinates, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp, setDraggingState]);

  // Atualizar posição quando mudar externamente
  useEffect(() => {
    if (!dragInfo.current.isDragging) {
      setLocalPosition([position[0], 0, position[2]]);
    }
  }, [position]);

  // Carregar o modelo 3D apropriado para o tipo de representante
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
      return 0.6;
    } else if (type === 'subjetivo_longo') {
      return 0.9;
    } else if (type === 'subjetivo_curto') {
      return 0.4;
    }
    return 0.75;
  }, [type]);
  
  // Limpar quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (model) {
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
          node.material = node.material.clone();
          node.material.color.set(color);
          node.material.roughness = 0.5;
          node.material.metalness = 0.1;
          node.material.envMapIntensity = 0.8;
          
          if (selected) {
            node.material.emissive = new THREE.Color(color).multiplyScalar(0.3);
            node.material.emissiveIntensity = 0.3;
          } else {
            node.material.emissive = new THREE.Color('#000000');
            node.material.emissiveIntensity = 0;
          }
        }
      });
    }
  }, [model, color, selected]);
  
  // Ajustar escala do modelo
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.set(modelScale, modelScale, modelScale);
      modelRef.current.rotation.y = rotation;
    }
  }, [rotation, modelScale]);
  
  // Atualizar rotação no frame
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y = rotation;
    }
  });
  
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
      
      {showNames && (
        <Html
          position={[0, 2.8, 0]}
          center
          distanceFactor={15}
          transform
          sprite
        >
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: selected ? '#ff6d01' : 'white',
            padding: '1px 4px',
            borderRadius: '2px',
            fontSize: '10px',
            fontWeight: selected ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            textAlign: 'center',
            maxWidth: '70px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: 1,
            lineHeight: '1.1'
          }}>
            {name}
          </div>
        </Html>
      )}
      
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color="#ff6d01" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

export default ConstellationField; 