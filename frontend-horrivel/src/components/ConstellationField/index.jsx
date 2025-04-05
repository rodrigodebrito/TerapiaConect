import React, { useRef, useState, useEffect, useMemo, useCallback, useContext, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import './ConstellationField.css';
import ConstellationProvider, { ConstellationContext } from '../../contexts/ConstellationContext';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Identificador único para este cliente (necessário para o componente ConstellationField)
const LOCAL_CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// URL base para os modelos - pode ser ajustada conforme necessário
const BASE_URL = window.location.origin;

// Função para corrigir URL de modelo
const getModelUrl = (relativePath) => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  
  // Garantir que haja uma barra entre o origin e o caminho
  // Remover /src se existir no caminho, pois os modelos estão diretamente na pasta public/representantes
  const cleanPath = relativePath.replace('/src/', '/').replace('\\src\\', '\\');
  return `${BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

// Componente para carregar modelos 3D previamente
const ModelsPreloader = () => {
  const { REPRESENTATIVE_TYPES, setLoadedModels } = useContext(ConstellationContext);
  const [preloadedModels, setPreloadedModels] = useState({});
  
  useEffect(() => {
    // Pré-carregar modelos para melhor desempenho
    console.log('ModelsPreloader: Verificando tipos de representantes');
    const loadedModels = {};
    
    if (REPRESENTATIVE_TYPES) {
      // Preload para todos os modelos
      Promise.allSettled(
        Object.entries(REPRESENTATIVE_TYPES).map(([key, type]) => {
          if (type.modelPath) {
            try {
              const fullPath = getModelUrl(type.modelPath);
              console.log(`Iniciando pré-carregamento para ${key}: ${type.name}`, fullPath);
              
              return new Promise((resolve, reject) => {
                const loader = new GLTFLoader();
                loader.load(
                  fullPath,
                  (gltf) => {
                    console.log(`Modelo ${type.name} carregado com sucesso`);
                    loadedModels[type.id] = { 
                      success: true, 
                      scene: gltf.scene,
                      path: fullPath 
                    };
                    resolve(gltf);
                  },
                  (progress) => {
                    if (progress.total > 0) {
                      const percent = Math.round(progress.loaded / progress.total * 100);
                      console.log(`Carregando ${type.name}: ${percent}%`);
                    }
                  },
                  (error) => {
                    console.error(`Erro ao carregar modelo ${type.name}:`, error, fullPath);
                    loadedModels[type.id] = { 
                      success: false, 
                      error: error,
                      path: fullPath 
                    };
                    reject(error);
                  }
                );
              });
            } catch (err) {
              console.warn(`Erro ao iniciar pré-carregamento do modelo ${type.name}:`, err);
              loadedModels[type.id] = { 
                success: false, 
                error: err,
                path: getModelUrl(type.modelPath)
              };
              return Promise.reject(err);
            }
                } else {
            console.warn(`Modelo ${key} não tem caminho definido`);
            return Promise.resolve(null);
          }
        })
      ).then((results) => {
        console.log('Pré-carregamento de modelos concluído', results);
        setPreloadedModels(loadedModels);
        // Compartilhar os modelos carregados através do contexto
        if (setLoadedModels) {
          setLoadedModels(loadedModels);
        }
      });
    } else {
      console.warn('REPRESENTATIVE_TYPES não está disponível no contexto');
    }
  }, [REPRESENTATIVE_TYPES, setLoadedModels]);
  
  return null;
};

// Componente para uma caixa simples como fallback para modelos 3D
const FallbackBox = ({ color }) => {
                return (
    <mesh position={[0, 1.0, 0]}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Componente para carregar modelo 3D com tratamento de erros
const ModelLoader = ({ modelPath, color, position = [0, 1.0, 0], scale = 1, selected = false }) => {
  const [error, setError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { loadedModels } = useContext(ConstellationContext);
  const maxRetries = 3;
  
  // Verificar se o modelo já foi pré-carregado
  useEffect(() => {
    if (loadedModels) {
      const preloadedModel = Object.values(loadedModels).find(model => model.path === modelPath);
      if (preloadedModel && preloadedModel.success) {
        setIsLoading(false);
      }
    }
  }, [modelPath, loadedModels]);
  
  // Tratamento de erro com useEffect
  useEffect(() => {
    // Monitorar erros no carregamento
    const handleError = (e) => {
      if (e && e.target && e.target.src && 
          e.target.src.includes(modelPath.split('/').pop())) {
        console.error(`Erro ao carregar modelo: ${modelPath}`, e);
        
        if (loadAttempt < maxRetries) {
          // Tentar novamente com delay incremental
          setTimeout(() => {
            console.log(`Tentativa ${loadAttempt + 1} de carregar modelo: ${modelPath}`);
            setLoadAttempt(prev => prev + 1);
          }, (loadAttempt + 1) * 1000);
                        } else {
          setError(true);
          setIsLoading(false);
        }
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [modelPath, loadAttempt]);
  
  // Log para debug
  useEffect(() => {
    console.log(`Tentando carregar modelo (tentativa ${loadAttempt + 1}): ${modelPath}`);
    
    // Se já excedemos o número de tentativas, mostrar o fallback
    if (loadAttempt >= maxRetries) {
      console.warn(`Máximo de tentativas excedido para modelo: ${modelPath}, usando fallback.`);
      setError(true);
      setIsLoading(false);
    }
    
    // Temporizador para garantir que alguma resposta será dada após um tempo máximo
    const timeoutId = setTimeout(() => {
      if (isLoading && !error) {
        console.warn(`Tempo limite excedido para modelo: ${modelPath}, tentando usar fallback.`);
        setError(true);
        setIsLoading(false);
      }
    }, 10000); // 10 segundos é o tempo máximo de espera
    
    return () => clearTimeout(timeoutId);
  }, [modelPath, loadAttempt, isLoading, error]);
  
  // Se já sabemos que há um erro, mostrar o fallback
  if (error) {
    console.log(`Usando fallback box para modelo: ${modelPath}`);
    return <FallbackBox color={color} />;
  }
  
  // Mostrar fallback enquanto estiver carregando
  if (isLoading && loadAttempt === 0 && !loadedModels) {
    return <FallbackBox color={color} />;
  }
  
  // Tentar carregar o modelo
  try {
    // Usando ErrorBoundary e Suspense para melhor tratamento de erro
    return (
      <ModelErrorBoundary fallback={<FallbackBox color={color} />}>
        <Suspense fallback={<FallbackBox color={color} />}>
          <ModelContent 
            modelPath={modelPath} 
            color={color} 
            position={position} 
            scale={scale} 
            selected={selected} 
            onError={() => {
              setError(true);
              setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
          />
        </Suspense>
      </ModelErrorBoundary>
    );
  } catch (e) {
    console.error(`Erro ao renderizar modelo ${modelPath}:`, e);
    
    // Em caso de erro, retornar fallback
    return <FallbackBox color={color} />;
  }
};

// Componente para o conteúdo do modelo (separado para usar com Suspense/ErrorBoundary)
const ModelContent = ({ modelPath, color, position, scale, selected, onError, onLoad }) => {
  const { loadedModels } = useContext(ConstellationContext);
  
  useEffect(() => {
    // Chamar onLoad quando o componente for montado com sucesso
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);
  
  try {
    // Verificar se já temos o modelo pré-carregado
    const modelType = Object.values(loadedModels || {}).find(model => model.path === modelPath);
    
    let scene;
    if (modelType && modelType.success && modelType.scene) {
      // Usar o modelo já carregado
      console.log(`Usando modelo pré-carregado para ${modelPath}`);
      scene = modelType.scene.clone();
    } else {
      // Carregar o modelo sob demanda
      const { scene: loadedScene } = useGLTF(modelPath);
      scene = loadedScene.clone();
    }
    
    // Aplicar cor e efeitos ao modelo
    scene.traverse((node) => {
      if (node.isMesh && node.material) {
        node.material = node.material.clone();
        node.material.color.set(color);
        node.material.roughness = 0.5;
        node.material.metalness = 0.1;
        node.material.envMapIntensity = 0.8;
        
        // Aplicar efeito de emissão se selecionado
        if (selected) {
          node.material.emissive = new THREE.Color(color).multiplyScalar(0.3);
          node.material.emissiveIntensity = 0.3;
        } else {
          node.material.emissive = new THREE.Color('#000000');
          node.material.emissiveIntensity = 0;
        }
      }
    });
    
    return (
      <primitive 
        object={scene} 
        position={position}
        scale={[scale, scale, scale]}
      />
    );
  } catch (e) {
    console.error(`Erro ao processar modelo ${modelPath}:`, e);
    if (onError) onError();
    return <FallbackBox color={color} />;
  }
};

// Componente ErrorBoundary simples para modelos
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro no carregamento do modelo:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Componente para um representante individual (modelo 3D)
const Representative = ({ representative, selected, onSelect, onContextMenu }) => {
  const { id, name, position, color, type, rotation: initialRotation = 0 } = representative;
  const [localPosition, setLocalPosition] = useState([position[0], 0, position[2]]);
  const [rotation, setRotation] = useState(initialRotation || 0);
  const [modelLoadError, setModelLoadError] = useState(false);
  const modelRef = useRef();
  const { camera } = useThree();
  const { 
    setRepresentativePosition, 
    setRepresentativeRotation, 
    setDraggingState, 
    showNames, 
    isDraggingAny,
    REPRESENTATIVE_TYPES
  } = useContext(ConstellationContext);
  
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
  
  // Função para usar ao clicar no representante
  const handleSelect = useCallback(() => {
    if (typeof onSelect === 'function') {
      onSelect(representative);
    }
  }, [onSelect, representative]);
  
  // Função para lidar com o menu de contexto
  const handleContextMenuEvent = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onContextMenu === 'function') {
      onContextMenu(representative, event);
    }
  }, [onContextMenu, representative]);

  // Manipulador de movimento do mouse
  const handleMouseMove = useCallback((e) => {
    if (!dragInfo.current.isDragging) return;

    if (e.shiftKey || dragInfo.current.isRotating) {
      // Modo de rotação
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const deltaX = ((e.clientX - dragInfo.current.startX) / rect.width) * Math.PI * 2;
      const newRotation = dragInfo.current.startRotation + deltaX;
      setRotation(newRotation);
      
      // Sincronizar rotação durante o movimento também para animação mais fluida
      setRepresentativeRotation(id, newRotation);
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

      // Atualizar posição local (visual imediato)
      setLocalPosition([finalX, 0, finalZ]);

      // IMPORTANTE: Não gerar IDs de evento durante o arrasto para evitar sobrecarga
      // Apenas quando parar o arrasto (no handleMouseUp) vamos persistir com ID de evento
      setRepresentativePosition(id, [finalX, 0, finalZ]);
    }
  }, [id, screenToPlaneCoordinates, setRepresentativePosition, setRepresentativeRotation]);

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
      
      // Registrar posição final e horário do arrasto
      dragInfo.current.finalPosition = [...localPosition];
      dragInfo.current.finalRotation = rotation;
      dragInfo.current.dragEndTime = Date.now();
      
      // Importante: primeiro atualizar posição e rotação, depois liberar o estado de arrasto
      console.log('Finalizando arrasto, sincronizando posição/rotação final');
      
      // Criar ID único para este evento de sincronização para evitar loops
      const positionUpdateId = `pos_update_${Date.now()}_${id}`;
      
      // Sincronizar rotação e posição finais
      setRepresentativeRotation(id, rotation);
      setRepresentativePosition(id, localPosition, positionUpdateId);
      
      // Depois de sincronizar posição, liberar o estado de arrasto
      // Usar um pequeno delay para garantir que o contexto realmente aplicou as mudanças
      setTimeout(() => {
        setDraggingState(false);
      }, 50);
    }
  }, [handleMouseMove, handleKeyDown, handleKeyUp, setDraggingState, id, rotation, localPosition, setRepresentativeRotation, setRepresentativePosition]);

  // Manipulador de clique do mouse
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    handleSelect(); // Usar a função local em vez de chamar diretamente onSelect

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
  }, [localPosition, rotation, handleSelect, screenToPlaneCoordinates, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp, setDraggingState]);

  // Atualizar posição quando mudar externamente
  useEffect(() => {
    // Apenas atualizar posição quando não estiver sendo arrastado pelo usuário local
    if (!dragInfo.current.isDragging) {
      const newPosition = [position[0], 0, position[2]];
      
      // Verificar se a posição realmente mudou antes de atualizar
      if (localPosition[0] !== newPosition[0] || 
          localPosition[1] !== newPosition[1] || 
          localPosition[2] !== newPosition[2]) {
          
        // SUPER IMPORTANTE: Prevenir completamente atualizações que:
        // 1. Possuem origem [0,0,0] - isto previne o representante de voltar para origem
        // 2. Possuem localização anterior muito diferente da atual - isto previne saltos grandes
        
        // Verificar se é uma tentativa de reset para origem
        if (newPosition[0] === 0 && newPosition[2] === 0 && 
            (Math.abs(localPosition[0]) > 0.05 || Math.abs(localPosition[2]) > 0.05)) {
          console.error(`BLOQUEADO: Tentativa de retorno de ${name} para origem [0,0,0]`);
          
          // Em vez disso, forçamos a posição atual para o servidor
          setTimeout(() => {
            setRepresentativePosition(id, localPosition, `fix_origin_${Date.now()}_${id}`);
          }, 100);
          return;
        }
        
        // Verificar se é um salto muito grande (mais de 1 unidade)
        const distanceChange = Math.sqrt(
          Math.pow(newPosition[0] - localPosition[0], 2) + 
          Math.pow(newPosition[2] - localPosition[2], 2)
        );
        
        if (distanceChange > 1.0) {
          console.error(`BLOQUEADO: Salto grande de posição para ${name} (${distanceChange.toFixed(2)} unidades)`);
          
          // Guardar e persistir nossa posição atual para correção do servidor
          setTimeout(() => {
            setRepresentativePosition(id, localPosition, `fix_jump_${Date.now()}_${id}`);
          }, 100);
          return;
        }
        
        // Manter posição final de arrasto
        if (dragInfo.current.finalPosition) {
          const [fx, fy, fz] = dragInfo.current.finalPosition;
          
          // Se faz menos de 5 segundos que o usuário finalizou o arrasto, dar prioridade à posição final
          const timeSinceDrag = Date.now() - (dragInfo.current.dragEndTime || 0);
          
          if (timeSinceDrag < 5000) {
            console.log(`Ignorando atualização externa para ${name}, arrasto recente (${timeSinceDrag}ms) `);
            
            // Forçar posição local para o servidor
            setTimeout(() => {
              setRepresentativePosition(id, dragInfo.current.finalPosition, `maintain_drag_${Date.now()}_${id}`);
            }, 100);
            return;
          }
        }
        
        // Se chegou até aqui, é uma atualização válida
        console.log(`Atualizando posição de ${name}: [${localPosition}] -> [${newPosition}]`);
        setLocalPosition(newPosition);
      }
    }
  }, [position, name, localPosition, id, setRepresentativePosition]);
  
  // Atualizar rotação quando mudar externamente
  useEffect(() => {
    if (!dragInfo.current.isDragging && representative.rotation !== undefined) {
      setRotation(representative.rotation);
    }
  }, [representative.rotation]);

  // Carregar o modelo 3D apropriado para o tipo de representante
  const modelPath = useMemo(() => {
    if (!REPRESENTATIVE_TYPES) return '';
    try {
      const typeKey = Object.keys(REPRESENTATIVE_TYPES).find(key => 
      REPRESENTATIVE_TYPES[key].id === type
      );
      return typeKey ? getModelUrl(REPRESENTATIVE_TYPES[typeKey].modelPath) : '';
    } catch (err) {
      console.error("Erro ao determinar o caminho do modelo:", err);
      return '';
    }
  }, [type, REPRESENTATIVE_TYPES]);
  
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
      // Não precisamos mais fazer a limpeza manual aqui
      // já que estamos usando o ModelLoader que gerencia isso
    };
  }, []);
  
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
        handleSelect();
      }}
      onContextMenu={handleContextMenuEvent}
      onPointerDown={handleMouseDown}
      scale={[modelScale, modelScale, modelScale]}
    >
      <ModelLoader 
        modelPath={modelPath} 
        color={color} 
        position={[0, 1.0, 0]} 
        selected={selected}
      />
      
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

// Componente para sincronizar a câmera
const SynchronizedCamera = () => {
  const { 
    cameraPosition,
    cameraTarget,
    cameraZoom,
    syncCamera,
    isDraggingAny
  } = useContext(ConstellationContext);
  
  const orbitControlsRef = useRef();
  const cameraRef = useRef();
  const isUpdatingRef = useRef(false);
  
  // Sincronizar a posição da câmera ao receber atualizações do contexto
  useEffect(() => {
    if (!orbitControlsRef.current || !cameraRef.current || isUpdatingRef.current) return;
    
    // Definir câmera inicial
    cameraRef.current.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    orbitControlsRef.current.target.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    cameraRef.current.zoom = cameraZoom;
    cameraRef.current.updateProjectionMatrix();
    orbitControlsRef.current.update();
  }, [cameraPosition, cameraTarget, cameraZoom]);
  
  // Monitora mudanças da câmera e as sincroniza
  const handleCameraChange = useCallback(() => {
    if (!orbitControlsRef.current || !cameraRef.current || isDraggingAny) return;
    
    isUpdatingRef.current = true;
    
    const position = [
      cameraRef.current.position.x,
      cameraRef.current.position.y,
      cameraRef.current.position.z
    ];
    
    const target = [
      orbitControlsRef.current.target.x,
      orbitControlsRef.current.target.y,
      orbitControlsRef.current.target.z
    ];
    
    const zoom = cameraRef.current.zoom;
    
    // Evitar atualizações desnecessárias
    if (
      position[0] !== cameraPosition[0] ||
      position[1] !== cameraPosition[1] ||
      position[2] !== cameraPosition[2] ||
      target[0] !== cameraTarget[0] ||
      target[1] !== cameraTarget[1] ||
      target[2] !== cameraTarget[2] ||
      zoom !== cameraZoom
    ) {
      syncCamera(position, target, zoom);
    }
    
    isUpdatingRef.current = false;
  }, [cameraPosition, cameraTarget, cameraZoom, syncCamera, isDraggingAny]);
  
  useThree(({ camera }) => {
    cameraRef.current = camera;
  });
  
  return (
    <OrbitControls 
      ref={orbitControlsRef}
      makeDefault
      enablePan={true}
      screenSpacePanning={true}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={Math.PI / 6}
      enableRotate={!isDraggingAny}
      maxDistance={15}
      minDistance={4}
      enabled={!isDraggingAny}
      onChange={handleCameraChange}
    />
  );
};

// Componente de visualização que usa o ConstellationContext
const ConstellationView = ({ fieldTexture, modalMode, sessionIdProp }) => {
  // Obter do contexto
  const {
    representatives,
    selectedRepresentative,
    representativeName,
    selectedType,
    selectedColor,
    handleRepresentativeSelect,
    handleContextMenu,
    setRepresentativePosition,
    setDraggingState,
    removeRepresentative,
    resetField,
    saveConfiguration,
    importConfiguration,
    exportConfiguration,
    setRepresentativeName,
    setSelectedType,
    setSelectedColor,
    addRepresentative,
    isDraggingAny,
    isHost,
    showNames,
    showDragHint,
    syncCamera,
    cameraPosition,
    cameraTarget,
    cameraZoom,
    sessionId: contextSessionId,
    CLIENT_ID,
    REPRESENTATIVE_TYPES,
    REPRESENTATIVE_COLORS,
    loadedModels,
    representativeTypes,
    representativeColors
  } = useContext(ConstellationContext);

  // Usar sessionIdProp se fornecido, senão usar do contexto
  const sessionId = sessionIdProp || contextSessionId;
  
  // Estado para armazenar configuração importada
  const [importString, setImportString] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportString, setExportString] = useState('');
  const [isAddingRepresentative, setIsAddingRepresentative] = useState(false);
  
  // Ref para o elemento de input de arquivo
  const fileInputRef = useRef(null);
  
  // Função para executar diagnóstico e reparo
  const runDiagnostics = useCallback(() => {
    if (!sessionId) {
      console.error('[DEBUG] Erro: sessionId não definido!');
      return;
    }
    
    // Obter referência ao contexto
    const storageKey = `global_constellation_${sessionId}`;
    try {
      // Ver se conseguimos acessar os dados no localStorage
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log(`[DEBUG CF] Dados em localStorage: ${parsedData.representatives?.length || 0} representantes`);
        console.log('[DEBUG CF] Última atualização:', new Date(parsedData.lastUpdate).toISOString());
        
        // Criar evento para forçar diagnóstico no contexto
        const diagnosticEvent = new CustomEvent('constellation-sync-force', {
          detail: {
            sessionId,
            data: {
              // Usar os mesmos dados
              ...parsedData,
              // Mas garantir nova interpretação
              eventId: `diagnostic_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              forceUpdate: true,
              action: 'diagnostic-repair'
            }
          }
        });
        
        // Disparar evento para Context processar
        window.dispatchEvent(diagnosticEvent);
        console.log('[DEBUG CF] Evento de diagnóstico disparado');
      } else {
        console.log('[DEBUG CF] Sem dados no localStorage para sessão', sessionId);
      }
    } catch (e) {
      console.error('[DEBUG CF] Erro ao executar diagnóstico:', e);
    }
  }, [sessionId]);
  
  // Handler para adicionar representante com controle de concorrência
  const handleAddRepresentative = useCallback(() => {
    if (!representativeName.trim() || isAddingRepresentative) return;
    
    setIsAddingRepresentative(true);
    
    console.log(`[DEBUG] Início de adição de representante: "${representativeName}" (antes: ${representatives?.length || 0})`);
    
    // Verificar se o modelo foi pré-carregado
    const typeInfo = Object.values(REPRESENTATIVE_TYPES || {}).find(type => type.id === selectedType);
    const modelPath = typeInfo ? getModelUrl(typeInfo.modelPath) : '';
    
    // Adicionar representante diretamente
    addRepresentative();
    
    // Garantir uma sincronização redundante
    setTimeout(() => {
      // Criar ID único para não colidir com outros eventos
      const forceAddId = `force_add_${Date.now()}_${CLIENT_ID || 'unknown'}`;
      
      // Verificar se o representante foi adicionado
      console.log(`[DEBUG][handleAddRepresentative] Verificando adição: ${representatives?.length || 0} representantes`);
      
      // Criar evento para forçar atualização
      const addEvent = new CustomEvent('constellation-add-representative', {
        detail: {
          sessionId,
          data: {
            name: representativeName,
            type: selectedType,
            color: selectedColor,
            eventId: forceAddId,
            forceUpdate: true,
            action: 'add-representative-direct',
            clientId: CLIENT_ID || 'unknown'
          }
        }
      });
      
      window.dispatchEvent(addEvent);
      console.log('[DEBUG][handleAddRepresentative] Dispatched direct add event');
      
      // Aguardar um pouco e então tentar forçar sincronização geral
      setTimeout(() => {
        console.log(`[DEBUG][handleAddRepresentative] Forçando sincronização final com ${representatives?.length || 0} representantes`);
        
        // Criar evento para sincronização completa
        const finalSyncEvent = new CustomEvent('constellation-sync-force', {
          detail: {
            sessionId,
            data: {
              representatives: representatives || [],
              cameraPosition,
              cameraTarget,
              cameraZoom,
              lastUpdate: Date.now(),
              updatedBy: CLIENT_ID || 'unknown',
              eventId: `final_sync_${Date.now()}`,
              forceUpdate: true
            }
          }
        });
        
        window.dispatchEvent(finalSyncEvent);
        setIsAddingRepresentative(false);
      }, 500);
    }, 300);
  }, [
    representativeName,
    selectedType,
    selectedColor,
    isAddingRepresentative,
    addRepresentative,
    representatives,
    sessionId,
    CLIENT_ID,
    cameraPosition,
    cameraTarget,
    cameraZoom,
    REPRESENTATIVE_TYPES
  ]);
  
  // Handler para confirmar reset do campo
  const handleResetField = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar o campo? Esta ação não pode ser desfeita.')) {
      resetField();
    }
  }, [resetField]);
  
  // Handler para salvar a configuração
  const handleSaveConfiguration = useCallback(() => {
    saveConfiguration();
    alert('Configuração salva!');
  }, [saveConfiguration]);
  
  // Handler para exportar configuração
  const handleExportConfiguration = useCallback(() => {
    const config = exportConfiguration();
    const configString = JSON.stringify(config);
    setExportString(configString);
    setShowExportDialog(true);
  }, [exportConfiguration]);
  
  // Handler para importar configuração
  const handleImportConfiguration = useCallback(() => {
    setShowImportDialog(true);
  }, []);
  
  // Handler para confirmar importação
  const handleConfirmImport = useCallback(() => {
    try {
      const config = JSON.parse(importString);
      const success = importConfiguration(config);
      
      if (success) {
        alert('Configuração importada com sucesso!');
        setShowImportDialog(false);
        setImportString('');
      } else {
        alert('Falha ao importar configuração. Verifique o formato dos dados.');
      }
    } catch (error) {
      alert(`Erro ao importar: ${error.message}`);
    }
  }, [importString, importConfiguration]);
  
  // Handler para importar de arquivo
  const handleFileImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result);
        const success = importConfiguration(config);
        
        if (success) {
          alert('Configuração importada com sucesso!');
        } else {
          alert('Falha ao importar configuração do arquivo.');
        }
      } catch (error) {
        alert(`Erro ao importar arquivo: ${error.message}`);
      }
    };
    
    reader.readAsText(file);
  }, [importConfiguration]);
  
  // Handler para salvar para arquivo
  const handleSaveToFile = useCallback(() => {
    const config = exportConfiguration();
    const configString = JSON.stringify(config, null, 2);
    
    const blob = new Blob([configString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `constellation-field-${Date.now()}.json`;
    
    a.click();
    URL.revokeObjectURL(url);
  }, [exportConfiguration]);
  
  // Logar representantes para debug quando houver mudanças
  useEffect(() => {
    console.log(`[DEBUG] ConstellationView: temos ${representatives?.length || 0} representantes`, 
      representatives?.map(r => ({id: r.id, name: r.name, position: r.position})) || []);
  }, [representatives]);
  
  // Log para debug quando o sessionId mudar
  useEffect(() => {
    console.log(`[DEBUG] ConstellationView: usando sessionId=${sessionId}, do prop=${!!sessionIdProp}`);
  }, [sessionId, sessionIdProp]);
  
  // Função para enviar um ping forçado para sincronização
  const sendForceSyncPing = useCallback(() => {
    if (!sessionId) return;
    
    console.log('[DEBUG FIELD] Forçando sincronização entre todas as instâncias');
    
    try {
      // Criar evento específico para forçar sincronização completa
      const forceSyncEvent = new CustomEvent('constellation-sync-ping', {
        detail: {
          sessionId,
          data: {
            timestamp: Date.now(),
            forceUpdate: true,
            clientId: LOCAL_CLIENT_ID,
            eventId: `debug_ping_${Date.now()}_${LOCAL_CLIENT_ID}`
          }
        }
      });
      
      // Disparar eventos para várias camadas
      window.dispatchEvent(forceSyncEvent);
      
      // Também disparar evento para API
      const forceSyncFieldEvent = new CustomEvent('constellation-sync-field', {
        detail: {
          sessionId,
          data: {
            timestamp: Date.now(),
            forceUpdate: true,
            clientId: LOCAL_CLIENT_ID,
            eventId: `debug_field_ping_${Date.now()}_${LOCAL_CLIENT_ID}`
          }
        }
      });
      window.dispatchEvent(forceSyncFieldEvent);
      
      console.log('[DEBUG FIELD] Eventos de sincronização forçada enviados com sucesso');
      
      // Depois de um pequeno delay, ler do localStorage para garantir que temos os dados mais recentes
      setTimeout(() => {
        const storageKey = `global_constellation_${sessionId}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            console.log('[DEBUG FIELD] Verificando dados do localStorage após sincronização forçada');
            const parsedData = JSON.parse(storedData);
            
            if (parsedData && parsedData.representatives) {
              console.log(`[DEBUG FIELD] Dados no localStorage: ${parsedData.representatives?.length || 0} representantes`);
            }
          } catch (e) {
            console.error('[DEBUG FIELD] Erro ao verificar localStorage:', e);
          }
        }
      }, 500);
    } catch (e) {
      console.error('[DEBUG FIELD] Erro ao forçar sincronização:', e);
    }
  }, [sessionId]);
  
  // ToggleContextUpdateReceiver para depuração
  const toggleDebugMode = useCallback(() => {
    setDebugVisible(prev => !prev);
  }, []);
  
  return (
    <div className={`constellation-field-container ${modalMode ? 'modal-mode' : ''}`}>
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
            
            <div className="color-selector">
              <p className="color-title">Cor:</p>
              <div className="color-options">
                {REPRESENTATIVE_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`color-option ${color === selectedColor ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <button
              className="add-btn"
              onClick={handleAddRepresentative}
              disabled={!representativeName.trim() || isAddingRepresentative}
            >
              Adicionar
            </button>
          </div>
          
          {/* Lista de representantes existentes */}
          {representatives && representatives.length > 0 && (
            <div className="representatives-list">
              {representatives.map((rep) => (
                <div
                  key={rep.id}
                  className={`representative-item ${selectedRepresentative && selectedRepresentative.id === rep.id ? 'selected' : ''}`}
                  onClick={() => handleRepresentativeSelect(rep)}
                >
                  <div
                    className="color-indicator"
                    style={{ backgroundColor: rep.color }}
                  />
                  <span className="name">{rep.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Botões de controle */}
          <div className="control-buttons">
            <button className="control-button" onClick={handleResetField}>
              Limpar Campo
            </button>
            <button className="control-button" onClick={handleSaveConfiguration}>
              Salvar
            </button>
          </div>
        </div>
      </div>
      
      <div className="canvas-container">
        <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          
          {/* Campo circular */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]} 
            receiveShadow
          >
            <circleGeometry args={[5, 64]} />
            <meshStandardMaterial 
              color="#111"
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
          
          {/* Representantes */}
          {representatives && representatives.length > 0 && representatives.map(rep => (
            <Representative
              key={rep.id}
              representative={rep}
              selected={selectedRepresentative && selectedRepresentative.id === rep.id}
              onSelect={handleRepresentativeSelect}
              onContextMenu={handleContextMenu}
            />
          ))}
          
          {/* Controles de câmera sincronizados */}
          <SynchronizedCamera />
        </Canvas>
      </div>
      
      {/* Controles de UI */}
      {showImportDialog && (
        <div className="import-dialog">
          <h3>Importar Configuração</h3>
          <textarea 
            value={importString} 
            onChange={(e) => setImportString(e.target.value)}
            placeholder="Cole o JSON da configuração aqui"
          />
          <div className="dialog-buttons">
            <button onClick={handleConfirmImport}>Importar</button>
            <button onClick={() => setShowImportDialog(false)}>Cancelar</button>
          </div>
        </div>
      )}
      
      {showExportDialog && (
        <div className="export-dialog">
          <h3>Exportar Configuração</h3>
          <textarea 
            value={exportString} 
            readOnly
            onClick={(e) => e.target.select()}
          />
          <div className="dialog-buttons">
            <button onClick={() => setShowExportDialog(false)}>Fechar</button>
            <button onClick={handleSaveToFile}>Salvar como arquivo</button>
          </div>
        </div>
      )}
      
      {/* Botão para importar de arquivo (oculto) */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".json" 
        onChange={handleFileImport}
      />
      
      {/* Dica de arrasto */}
      {showDragHint && (
        <div className="drag-hint">
          <p>Arraste para mover • Segure SHIFT para rotacionar</p>
        </div>
      )}
    </div>
  );
};

// Componente para o campo de constelação
const ConstellationField = ({ isHost = true, sessionId = null, fieldTexture = null, modalMode = false }) => {
  // Estado para debug e diagnóstico
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    clientId: LOCAL_CLIENT_ID,
    lastSync: '',
    syncEvents: []
  });
  
  // Estado para armazenar constantes do contexto
  const [representativeTypes, setRepresentativeTypes] = useState({
    MALE_ADULT: { id: 'male_adult', name: 'Homem Adulto' },
    FEMALE_ADULT: { id: 'female_adult', name: 'Mulher Adulta' }
  });
  const [representativeColors, setRepresentativeColors] = useState([
    '#4285F4', '#EA4335', '#FBBC05', '#34A853'
  ]);
  
  // Hook para extrair constantes do contexto
  useEffect(() => {
    // Função para extrair dados do contexto
    const extractContextData = () => {
      try {
        // Tentar obter dados do localStorage
        const storageKey = `global_constellation_${sessionId}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          // Se temos dados armazenados, vamos usá-los
          console.log('[DEBUG] Constantes extraídas do localStorage');
        } else {
          // Se não temos dados armazenados, vamos usar valores padrão
          console.log('[DEBUG] Usando constantes padrão');
        }
      } catch (e) {
        console.error('[DEBUG] Erro ao extrair constantes do contexto:', e);
      }
    };
    
    if (sessionId) {
      extractContextData();
    }
  }, [sessionId]);
  
  // Função para executar diagnóstico e reparo
  const runDiagnostics = useCallback(() => {
    // Aqui não temos acesso ao contexto diretamente, por isso precisamos usar um CustomEvent
    // para pedir ao contexto que faça o diagnóstico
    if (!sessionId) {
      console.error('[DEBUG] Erro: sessionId não definido!');
      return;
    }
    
    console.log('[DEBUG DIAG] Iniciando diagnóstico para sessão:', sessionId);
    
    // Obter referência ao contexto
    const storageKey = `global_constellation_${sessionId}`;
    try {
      // Ver se conseguimos acessar os dados no localStorage
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log(`[DEBUG DIAG] Dados em localStorage: representantes: ${parsedData.representatives?.length || 0}`);
        
        if (parsedData.representatives) {
          console.log(`[DEBUG DIAG] Representantes encontrados: ${parsedData.representatives?.length || 0}`);
        } else {
          console.log('[DEBUG DIAG] Array de representantes não existe ou é undefined');
        }
        
        // Criar evento para forçar diagnóstico no contexto
        const diagnosticEvent = new CustomEvent('constellation-force-sync', {
          detail: {
            sessionId,
            eventId: `diagnostic_${Date.now()}_${LOCAL_CLIENT_ID}`,
            forceUpdate: true,
            action: 'diagnostic-repair'
          }
        });
        
        // Disparar evento para Context processar
        window.dispatchEvent(diagnosticEvent);
        console.log('[DEBUG DIAG] Evento de diagnóstico disparado');
      } else {
        console.log('[DEBUG DIAG] Sem dados no localStorage para sessão', sessionId);
      }
    } catch (e) {
      console.error('[DEBUG DIAG] Erro ao executar diagnóstico:', e);
    }
  }, [sessionId]);
  
  // Adicionar handlers para eventos de sincronização durante o debug
  useEffect(() => {
    if (!debugVisible || !sessionId) return;
    
    console.log('Modo de debug ativado para ConstellationField');
    
    // Função para capturar eventos de sincronização
    const handleSyncEvent = (e) => {
      // Verificar se é para esta sessão
      if (e.detail && e.detail.sessionId === sessionId) {
        setDebugInfo(prev => ({
          ...prev,
          syncEvents: [...prev.syncEvents.slice(-9), {
            timestamp: new Date().toISOString(),
            type: e.type,
            data: e.detail.data
          }],
          lastSync: new Date().toISOString()
        }));
        
        console.log(`DEBUG: Evento de sincronização capturado: ${e.type}`);
      }
    };
    
    // Adicionar listeners
    window.addEventListener('constellation-updated', handleSyncEvent);
    window.addEventListener('constellation-field-updated', handleSyncEvent);
    window.addEventListener('constellation-sync-field', handleSyncEvent);
    window.addEventListener('constellation-sync-force', handleSyncEvent);
    
    // Capturar uma referência do clientId quando disponível
    const captureClientId = setInterval(() => {
      // Tentar buscar dos dados do contexto
      const storedData = localStorage.getItem(`global_constellation_${sessionId}`);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          if (parsed.updatedBy) {
            setDebugInfo(prev => ({
              ...prev,
              clientId: parsed.updatedBy
            }));
            clearInterval(captureClientId);
          }
        } catch (e) {
          console.error('Erro ao analisar dados de debug:', e);
        }
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('constellation-updated', handleSyncEvent);
      window.removeEventListener('constellation-field-updated', handleSyncEvent);
      window.removeEventListener('constellation-sync-field', handleSyncEvent);
      window.removeEventListener('constellation-sync-force', handleSyncEvent);
      clearInterval(captureClientId);
    };
  }, [debugVisible, sessionId]);
  
  // Função para enviar um ping forçado para sincronização
  const sendForceSyncPing = useCallback(() => {
    if (!sessionId) return;
    
    console.log('[DEBUG FIELD] Forçando sincronização entre todas as instâncias');
    
    try {
      // Criar evento específico para forçar sincronização completa
      const forceSyncEvent = new CustomEvent('constellation-sync-ping', {
        detail: {
          sessionId,
          data: {
            timestamp: Date.now(),
            forceUpdate: true,
            clientId: LOCAL_CLIENT_ID,
            eventId: `debug_ping_${Date.now()}_${LOCAL_CLIENT_ID}`
          }
        }
      });
      
      // Disparar eventos para várias camadas
      window.dispatchEvent(forceSyncEvent);
      
      // Também disparar evento para API
      const forceSyncFieldEvent = new CustomEvent('constellation-sync-field', {
        detail: {
          sessionId,
          data: {
            timestamp: Date.now(),
            forceUpdate: true,
            clientId: LOCAL_CLIENT_ID,
            eventId: `debug_field_ping_${Date.now()}_${LOCAL_CLIENT_ID}`
          }
        }
      });
      window.dispatchEvent(forceSyncFieldEvent);
      
      console.log('[DEBUG FIELD] Eventos de sincronização forçada enviados com sucesso');
      
      // Depois de um pequeno delay, ler do localStorage para garantir que temos os dados mais recentes
      setTimeout(() => {
        const storageKey = `global_constellation_${sessionId}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          try {
            console.log('[DEBUG FIELD] Verificando dados do localStorage após sincronização forçada');
            const parsedData = JSON.parse(storedData);
            
            if (parsedData && parsedData.representatives) {
              console.log(`[DEBUG FIELD] Dados no localStorage: ${parsedData.representatives?.length || 0} representantes`);
            }
          } catch (e) {
            console.error('[DEBUG FIELD] Erro ao verificar localStorage:', e);
          }
        }
      }, 500);
    } catch (e) {
      console.error('[DEBUG FIELD] Erro ao forçar sincronização:', e);
    }
  }, [sessionId]);
  
  // ToggleContextUpdateReceiver para depuração
  const toggleDebugMode = useCallback(() => {
    setDebugVisible(prev => !prev);
  }, []);
  
  return (
    <ConstellationProvider isHost={isHost} sessionId={sessionId}>
      <ModelsPreloader />
      <ConstellationView fieldTexture={fieldTexture} modalMode={modalMode} sessionIdProp={sessionId} />
      
      {/* Painel de Debug - mostra apenas em desenvolvimento */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="debug-panel" style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <button 
            onClick={toggleDebugMode}
            style={{
              padding: '4px 8px',
              backgroundColor: debugVisible ? 'darkred' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {debugVisible ? 'Desativar Debug' : 'Ativar Debug'}
          </button>
          
          {debugVisible && (
            <>
              <button 
                onClick={() => {
                  console.log('[DEBUG FIELD] Botão de sincronização forçada clicado');
                  // Usar evento global para que qualquer contexto possa responder
                  const forceSyncEvent = new CustomEvent('constellation-force-sync', {
                    detail: {
                      sessionId,
                      timestamp: Date.now(),
                      clientId: LOCAL_CLIENT_ID,
                      eventId: `force_sync_btn_${Date.now()}`
                    }
                  });
                  window.dispatchEvent(forceSyncEvent);
                  
                  // Também chamar o método direto
                  sendForceSyncPing();
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Forçar Sincronização
              </button>
              
              <button 
                onClick={runDiagnostics}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginTop: '4px'
                }}
              >
                Diagnóstico e Reparo
              </button>
              
              <button 
                onClick={() => {
                  // Verificar se sessionId está definido
                  if (!sessionId) {
                    console.error('[DEBUG] Erro: sessionId não definido!');
                    return;
                  }
                  
                  console.log(`[DEBUG] Enviando evento para adicionar representante de teste para sessão ${sessionId}`);
                  
                  // Criar nome de teste aleatório
                  const testName = `Teste-${Math.floor(Math.random() * 1000)}`;
                  
                  // Definições padrão para tipos e cores de representantes
                  // Usar como fallback caso não consigamos obter do localStorage
                  const defaultTypes = {
                    MALE_ADULT: { id: 'male_adult', name: 'Homem Adulto' },
                    FEMALE_ADULT: { id: 'female_adult', name: 'Mulher Adulta' }
                  };
                  const defaultColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
                  
                  try {
                    // Tentar obter tipos e cores do localStorage (preferível)
                    // ou usar os valores padrão
                    const types = representativeTypes || defaultTypes;
                    const colors = representativeColors || defaultColors;
                    
                    // Escolher tipo aleatório
                    const typeKeys = Object.keys(types);
                    const randomTypeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
                    const randomType = types[randomTypeKey]?.id || 'male_adult';
                    
                    // Escolher cor aleatória
                    const randomColor = colors[Math.floor(Math.random() * colors.length)] || '#4285F4';
                    
                    // Criar representante de teste usando o método direto
                    const addEvent = new CustomEvent('constellation-add-representative', {
                      detail: {
                        sessionId,
                        data: {
                          name: testName,
                          type: randomType,
                          color: randomColor,
                          eventId: `test_rep_${Date.now()}_${LOCAL_CLIENT_ID || 'unknown'}`,
                          forceUpdate: true,
                          action: 'add-test-representative',
                          clientId: LOCAL_CLIENT_ID || 'unknown'
                        }
                      }
                    });
                    
                    window.dispatchEvent(addEvent);
                    console.log('[DEBUG] Enviado evento para adicionar representante de teste:', testName);
                  } catch (e) {
                    console.error('[DEBUG] Erro ao criar representante de teste:', e);
                  }
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Adicionar Rep. Teste
              </button>
              
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
                maxWidth: '300px',
                maxHeight: '200px',
                overflow: 'auto',
                fontSize: '10px'
              }}>
                <p>SessionID: {sessionId}</p>
                <p>ClientID: {debugInfo.clientId || 'não detectado'}</p>
                <p>Última Sync: {debugInfo.lastSync || 'nenhuma'}</p>
                <p>Eventos: {debugInfo.syncEvents.length}</p>
                {debugInfo.syncEvents.map((event, idx) => (
                  <div key={idx} style={{
                    marginBottom: '2px',
                    borderBottom: '1px dashed #555',
                    paddingBottom: '2px'
                  }}>
                    {event.timestamp.split('T')[1].split('.')[0]} - {event.type}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ConstellationProvider>
  );
};

export default ConstellationField; 