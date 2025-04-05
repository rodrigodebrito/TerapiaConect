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

// Adicionar uma textura de fallback como parte do componente
const fallbackTexture = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(240,240,250);stop-opacity:1" />
    </radialGradient>
  </defs>
  <circle cx="100" cy="100" r="98" stroke="#aaaaaa" stroke-width="1" fill="url(#grad)" />
</svg>
`;

// Componente para o campo de constelação
const ConstellationField = ({ isHost = true, sessionId = null, fieldTexture = "/assets/field-texture.svg", optimized = false }) => {
  // Verificar se a URL da textura existe, caso contrário, usar fallback
  const effectiveTexture = useMemo(() => {
    // Checar se a textura padrão existe
    try {
      const img = new Image();
      img.src = fieldTexture;
      return fieldTexture;
    } catch (e) {
      console.warn("Erro ao carregar textura padrão, usando fallback", e);
      return `data:image/svg+xml;base64,${btoa(fallbackTexture)}`;
    }
  }, [fieldTexture]);

  // Pré-carregar modelos para garantir disponibilidade
  useEffect(() => {
    Object.values(REPRESENTATIVE_TYPES).forEach(type => {
      try {
        useGLTF.preload(type.modelPath);
        console.log(`Modelo pré-carregado: ${type.name}`);
      } catch (e) {
        console.error(`Erro ao pré-carregar modelo ${type.name}:`, e);
      }
    });
  }, []);

  return (
    <ConstellationProvider isHost={isHost} sessionId={sessionId}>
      <ConstellationView fieldTexture={effectiveTexture} optimized={optimized} />
    </ConstellationProvider>
  );
};

// Componente para renderizar um representante 3D
const Representative3D = ({ rep, isSelected, onMove, onSelect, isDragging, optimized }) => {
  const modelRef = useRef();
  const { camera, gl } = useThree();
  const { scene } = useGLTF(Object.values(REPRESENTATIVE_TYPES)
    .find(type => type.id === rep.type)?.modelPath || REPRESENTATIVE_TYPES.MALE_ADULT.modelPath);
    
  // Clone a cena para poder personalizar cada representante
  const model = useMemo(() => {
    // Cria uma cópia da cena original
    const clone = scene.clone();
    
    // Encontra todos os materiais nos filhos recursivamente e atualiza a cor
    clone.traverse(child => {
      if (child.isMesh) {
        // Aplicar otimizações quando necessário
        if (optimized) {
          // Reduzir qualidade dos materiais
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => {
                const newMat = mat.clone();
                newMat.roughness = 0.5;
                newMat.metalness = 0.2;
                newMat.emissive = new THREE.Color(rep.color).multiplyScalar(0.3);
                newMat.emissiveIntensity = 0.3;
                newMat.needsUpdate = true;
                return newMat;
              });
            } else {
              const newMat = child.material.clone();
              newMat.roughness = 0.5;
              newMat.metalness = 0.2;
              newMat.emissive = new THREE.Color(rep.color).multiplyScalar(0.3);
              newMat.emissiveIntensity = 0.3;
              newMat.needsUpdate = true;
              child.material = newMat;
            }
          }
        }
        
        // Colorir o modelo com a cor do representante
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              if (material.color) {
                material.color.set(rep.color);
                material.emissive = new THREE.Color(rep.color).multiplyScalar(0.3);
                material.emissiveIntensity = 0.3;
              }
            });
          } else if (child.material.color) {
            child.material.color.set(rep.color);
            child.material.emissive = new THREE.Color(rep.color).multiplyScalar(0.3);
            child.material.emissiveIntensity = 0.3;
          }
        }
      }
    });
    
    return clone;
  }, [scene, rep.color, optimized]);
  
  // Posição do representante - ajustar para que fique acima do campo
  const [position, setPosition] = useState([rep.position.x, 0.5, rep.position.z]);
  
  // Animação de hover/seleção
  const [hovered, setHovered] = useState(false);
  const hoveredColor = new THREE.Color(rep.color).multiplyScalar(1.2);
  
  // Efeito para atualizar a posição quando as props mudam
  useEffect(() => {
    setPosition([rep.position.x, 0.5, rep.position.z]); // Fixar Y em 0.5 para ficar acima do campo
  }, [rep.position.x, rep.position.z]);
  
  // Função para arrastar
  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    
    // Calcular a nova posição com base no mouse
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Converter coordenadas do mouse
    mouse.x = (e.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / gl.domElement.clientHeight) * 2 + 1;
    
    // Configurar raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Onde o raio intersecta o plano
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    // Limitar movimento dentro do círculo (raio 5)
    const distance = Math.sqrt(intersectPoint.x * intersectPoint.x + intersectPoint.z * intersectPoint.z);
    if (distance <= 5) {
      setPosition([intersectPoint.x, 0.5, intersectPoint.z]);
      onMove(rep.id, { x: intersectPoint.x, y: 0.5, z: intersectPoint.z });
    }
  }, [isDragging, rep, camera, gl.domElement, onMove]);
  
  // Usar useFrame apenas quando necessário
  useFrame(() => {
    if (optimized && !isSelected && !hovered) return; // Pular frames de animação em modo otimizado
    
    if (modelRef.current) {
      // Animação de flutuação quando selecionado
      if (isSelected) {
        modelRef.current.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
      }
      
      // Ajuste de cor quando hover
      if (hovered && !isSelected) {
        modelRef.current.traverse(child => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => {
                if (material.color) {
                  material.color.lerp(hoveredColor, 0.1);
                }
              });
            } else if (child.material.color) {
              child.material.color.lerp(hoveredColor, 0.1);
            }
          }
        });
      }
    }
  }, optimized ? 10 : 0); // Prioridade menor quando otimizado
  
  // Renderização do representante
  return (
    <group
      position={position}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(rep.id);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      ref={modelRef}
      scale={[0.7, 0.7, 0.7]}
      className="representative-model"
    >
      <primitive object={model} position={[0, 0, 0]} />
      
      {/* Nome flutuante */}
      {!optimized && (
        <Html position={[0, 2, 0]} center>
          <div className="representative-label" style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '2px 5px',
            borderRadius: '3px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>{rep.name}</div>
        </Html>
      )}
      
      {/* Indicador de seleção */}
      {isSelected && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.9, 32]} />
          <meshBasicMaterial color="#ff6d01" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

// Componente de visualização que usa o ConstellationContext
const ConstellationView = ({ fieldTexture, optimized }) => {
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

  // Ref para o canvas WebGL
  const canvasRef = useRef(null);
  
  // Evitar renderizações desnecessárias quando otimizado
  const memoizedReps = useMemo(() => representatives, [
    representatives.length, 
    // Em modo otimizado, não reage a alterações menores
    optimized ? null : representatives
  ]);

  return (
    <div className={`constellation-field-container ${optimized ? 'optimized-mode' : ''}`}>
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
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
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
                            className={`color-option mini ${editColor === color ? 'selected' : ''}`}
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
                    
                    <div className="edit-actions">
                      <button 
                        className="save-edit-btn"
                        onClick={() => {
                          console.log('Salvando edições:', editName, editColor);
                          saveEditing();
                        }}
                        title="Salvar alterações"
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-edit-btn"
                        onClick={() => {
                          console.log('Cancelando edição');
                          cancelEditing();
                        }}
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
      
      <div className="canvas-container" ref={canvasRef}>
        <Canvas 
          shadows 
          camera={{ position: [0, 8, 12], fov: 45 }}
          style={{ background: '#e6e0ff' }}
          gl={{ 
            antialias: optimized ? false : true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
          }}
          frameloop={optimized ? "demand" : "always"}
          dpr={optimized ? [0.5, 1.0] : [1, 2]}
          performance={{ min: optimized ? 0.5 : 1 }}
          onCreated={({ gl }) => {
            // Configurações adicionais do WebGL quando em modo otimizado
            if (optimized) {
              gl.setClearColor(new THREE.Color('#e6e0ff'));
              gl.setPixelRatio(window.devicePixelRatio * 0.7);
              gl.outputEncoding = THREE.LinearEncoding; // Mais rápido que sRGB
            } else {
              gl.outputEncoding = THREE.sRGBEncoding;
            }
          }}
        >
          <color attach="background" args={['#f0f0f5']} />
          <fog attach="fog" args={['#f0f0f5', 35, 45]} />
          
          {/* Aumentar intensidade de luz */}
          <ambientLight intensity={1.0} />
          <directionalLight
            position={[3, 5, 3]}
            intensity={1.0}
            castShadow={!optimized}
          />
          
          {/* Luzes extras para garantir boa iluminação */}
          <pointLight position={[-3, 5, -3]} intensity={0.8} />
          <spotLight
            position={[0, 8, 0]}
            intensity={0.6}
            angle={Math.PI / 4}
            penumbra={0.2}
            castShadow
          />

          {/* Campo base - SUBSTITUIR O MATERIAL FÍSICO POR BASIC */}
          <mesh 
            position={[0, 0, 0]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            receiveShadow={!optimized}
          >
            <circleGeometry args={[5, optimized ? 32 : 64]} />
            <meshBasicMaterial 
              color="#ffffff"
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Círculos decorativos para maior visibilidade */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.5, 4.55, 64]} />
            <meshBasicMaterial 
              color="#666666"
              transparent
              opacity={0.7}
            />
          </mesh>
          
          {/* Círculos adicionais */}
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 3.55, 64]} />
            <meshBasicMaterial 
              color="#666666"
              transparent
              opacity={0.7}
            />
          </mesh>

          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 2.55, 64]} />
            <meshBasicMaterial 
              color="#666666"
              transparent
              opacity={0.7}
            />
          </mesh>

          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.55, 32]} />
            <meshBasicMaterial 
              color="#666666"
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Rosa dos ventos */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {/* Norte */}
            <mesh position={[0, 4, 0.03]}>
              <boxGeometry args={[0.05, 4, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.8} />
            </mesh>
            {/* Indicador Norte */}
            <mesh position={[0, 6.5, 0.03]}>
              <boxGeometry args={[0.6, 0.15, 0.01]} />
              <meshBasicMaterial color="#4285F4" transparent opacity={0.9} />
            </mesh>
            
            {/* Sul */}
            <mesh position={[0, -4, 0.03]}>
              <boxGeometry args={[0.05, 4, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.8} />
            </mesh>
            
            {/* Leste */}
            <mesh position={[4, 0, 0.03]}>
              <boxGeometry args={[4, 0.05, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.8} />
            </mesh>
            
            {/* Oeste */}
            <mesh position={[-4, 0, 0.03]}>
              <boxGeometry args={[4, 0.05, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.8} />
            </mesh>
          </group>

          {/* Linhas diagonais */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {/* Nordeste */}
            <mesh position={[2.83, 2.83, 0.03]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.05, 4.8, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.6} />
            </mesh>
            
            {/* Noroeste */}
            <mesh position={[-2.83, 2.83, 0.03]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.05, 4.8, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.6} />
            </mesh>
            
            {/* Sudeste */}
            <mesh position={[2.83, -2.83, 0.03]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.05, 4.8, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.6} />
            </mesh>
            
            {/* Sudoeste */}
            <mesh position={[-2.83, -2.83, 0.03]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.05, 4.8, 0.01]} />
              <meshBasicMaterial color="#666666" transparent opacity={0.6} />
            </mesh>
          </group>

          {/* Representantes */}
          {memoizedReps.map((rep) => (
            <Representative3D
              key={rep.id}
              rep={{
                ...rep,
                position: { 
                  x: rep.position.x, 
                  y: 0.5, // Forçar altura 0.5 para todos os representantes
                  z: rep.position.z 
                }
              }}
              isSelected={selectedRepresentative === rep.id}
              isDragging={isDraggingAny && selectedRepresentative === rep.id}
              onMove={(id, newPos) => {
                // Garantir que a altura Y seja sempre 0.5
                setRepresentativePosition(id, { ...newPos, y: 0.5 });
              }}
              onSelect={handleRepresentativeClick}
              optimized={optimized}
            />
          ))}

          {/* Controles de câmera */}
          <OrbitControls 
            enablePan={!optimized} 
            enableRotate={true}
            rotateSpeed={0.5}
            zoomSpeed={optimized ? 0.3 : 0.6}
            minDistance={5}
            maxDistance={20}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2 - 0.1}
            target={[0, 0, 0]}
          />
        </Canvas>
        
        {/* Dica de arrasto */}
        {showDragHint && (
          <div className="drag-hint">
            Clique e arraste para mover o representante
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
      {/* Linhas principais (Norte-Sul, Leste-Oeste) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Norte */}
        <mesh position={[0, 4, 0.02]}>
          <boxGeometry args={[0.05, 4, 0.01]} />
          <meshBasicMaterial color="#666666" transparent opacity={0.8} />
        </mesh>
        {/* Indicador Norte */}
        <mesh position={[0, 6.5, 0.02]}>
          <boxGeometry args={[0.6, 0.15, 0.01]} />
          <meshBasicMaterial color="#4285F4" transparent opacity={0.9} />
        </mesh>
        
        {/* Sul */}
        <mesh position={[0, -4, 0.02]}>
          <boxGeometry args={[0.05, 4, 0.01]} />
          <meshBasicMaterial color="#666666" transparent opacity={0.8} />
        </mesh>
        
        {/* Leste */}
        <mesh position={[4, 0, 0.02]}>
          <boxGeometry args={[4, 0.05, 0.01]} />
          <meshBasicMaterial color="#666666" transparent opacity={0.8} />
        </mesh>
        
        {/* Oeste */}
        <mesh position={[-4, 0, 0.02]}>
          <boxGeometry args={[4, 0.05, 0.01]} />
          <meshBasicMaterial color="#666666" transparent opacity={0.8} />
        </mesh>
      </group>
      
      {/* Linhas diagonais secundárias (NE, NO, SE, SO) */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Nordeste */}
        <mesh position={[2.83, 2.83, 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshStandardMaterial color="#666666" transparent opacity={0.6} emissive="#999999" emissiveIntensity={0.2} />
        </mesh>
        
        {/* Noroeste */}
        <mesh position={[-2.83, 2.83, 0.02]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshStandardMaterial color="#666666" transparent opacity={0.6} emissive="#999999" emissiveIntensity={0.2} />
        </mesh>
        
        {/* Sudeste */}
        <mesh position={[2.83, -2.83, 0.02]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshStandardMaterial color="#666666" transparent opacity={0.6} emissive="#999999" emissiveIntensity={0.2} />
        </mesh>
        
        {/* Sudoeste */}
        <mesh position={[-2.83, -2.83, 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 4.8, 0.01]} />
          <meshStandardMaterial color="#666666" transparent opacity={0.6} emissive="#999999" emissiveIntensity={0.2} />
        </mesh>
      </group>
    </group>
  );
};

// Ajustar o componente Scene para usar todas as props corretamente
const Scene = ({ 
  optimized, 
  representatives, 
  selectedRepresentative, 
  handleRepresentativeSelect,
  setRepresentativePosition,
  draggingId,
  fieldTexture
}) => {
  const dragging = draggingId !== null;
  
  return (
    <>
      <color attach="background" args={['#f0f0f5']} />
      <fog attach="fog" args={['#f0f0f5', 35, 45]} />
      
      {/* Luzes */}
      <ambientLight intensity={1.0} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={1.0}
        castShadow={!optimized}
      />
      <pointLight position={[-3, 5, -3]} intensity={0.8} />
      <spotLight
        position={[0, 8, 0]}
        intensity={0.6}
        angle={Math.PI / 4}
        penumbra={0.2}
        castShadow={!optimized}
      />

      {/* Campo com textura clara */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow={!optimized}
      >
        <circleGeometry args={[5, optimized ? 32 : 64]} />
        <meshBasicMaterial 
          color="#ffffff"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Círculos decorativos */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.5, 4.55, 64]} />
        <meshBasicMaterial color="#666666" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.5, 3.55, 64]} />
        <meshBasicMaterial color="#666666" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.55, 64]} />
        <meshBasicMaterial color="#666666" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 32]} />
        <meshBasicMaterial color="#666666" transparent opacity={0.7} />
      </mesh>

      {/* Rosa dos ventos */}
      <CompassRose />

      {/* Renderizar representantes */}
      {representatives && representatives.map(rep => (
        <Representative3D 
          key={rep.id}
          rep={rep}
          isSelected={rep.id === selectedRepresentative}
          onSelect={handleRepresentativeSelect}
          onMove={setRepresentativePosition}
          isDragging={draggingId === rep.id}
          optimized={optimized}
        />
      ))}

      {/* Configurações da câmera */}
      <OrbitControls 
        enablePan={false}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        maxDistance={15}
        minDistance={3}
        enabled={!dragging}
      />
    </>
  );
};

export default ConstellationField; 