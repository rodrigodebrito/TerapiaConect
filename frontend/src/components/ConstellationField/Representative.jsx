import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { ConstellationContext } from '../../contexts/ConstellationContext';

// Definição dos tipos de representantes
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

// Preload dos modelos para garantir disponibilidade
Object.values(REPRESENTATIVE_TYPES).forEach(type => {
  useGLTF.preload(type.modelPath);
});

const Representative = ({ representative, selected, onSelect, onContextMenu }) => {
  const { id, name, position, color, type } = representative;
  
  // Garantir posições compatíveis com objeto ou array
  const posX = position && typeof position === 'object' && 'x' in position ? position.x : 
              Array.isArray(position) ? position[0] : 0;
  const posY = position && typeof position === 'object' && 'y' in position ? position.y : 
              Array.isArray(position) ? position[1] : 0;
  const posZ = position && typeof position === 'object' && 'z' in position ? position.z : 
              Array.isArray(position) ? position[2] : 0;
  
  console.log("Representative position:", position, "parsed as:", [posX, posY, posZ]);
  
  const [localPosition, setLocalPosition] = useState([posX, posY, posZ]);
  const [rotation, setRotation] = useState(0);
  const modelRef = useRef();
  const { camera } = useThree();
  
  // Verificar se o contexto existe antes de desestruturar
  const context = useContext(ConstellationContext);
  const setRepresentativePosition = context?.setRepresentativePosition || (() => {});
  const setDraggingState = context?.setDraggingState || (() => {});
  const showNames = context?.showNames !== undefined ? context.showNames : true;

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
      
      // Importante: Sincronizar a posição com o servidor via context
      // Determinar o formato de posição esperado pelo contexto (objeto ou array)
      if (typeof position === 'object' && 'x' in position) {
        // Formato de objeto
        setRepresentativePosition(id, { x: finalX, y: 0, z: finalZ });
      } else {
        // Formato de array
        setRepresentativePosition(id, [finalX, 0, finalZ]);
      }
    }
  }, [id, screenToPlaneCoordinates, setRepresentativePosition, position]);

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
    
    // Chamar a função de seleção fornecida pelas props
    if (onSelect) {
      console.log("Representative handleMouseDown: calling onSelect with", representative.name);
      onSelect(representative);
    }

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
      // Atualizar com os novos valores, lidando com formatos de objeto ou array
      const newPosX = position && typeof position === 'object' && 'x' in position ? position.x : 
                     Array.isArray(position) ? position[0] : 0;
      const newPosY = position && typeof position === 'object' && 'y' in position ? position.y : 
                     Array.isArray(position) ? position[1] : 0;
      const newPosZ = position && typeof position === 'object' && 'z' in position ? position.z : 
                     Array.isArray(position) ? position[2] : 0;
      
      setLocalPosition([newPosX, newPosY, newPosZ]);
    }
  }, [position]);

  // Carregar o modelo 3D apropriado para o tipo de representante
  const modelPath = React.useMemo(() => {
    console.log("Tentando encontrar modelo para tipo:", type);
    // Garantir que o tipo esteja em um formato esperado (às vezes pode vir como "MALE_CHILD" em vez de "male_child")
    const normalizedType = type ? type.toLowerCase() : '';
    
    // Procurar o tipo nas chaves disponíveis
    const matchingType = Object.keys(REPRESENTATIVE_TYPES).find(key => 
      REPRESENTATIVE_TYPES[key].id.toLowerCase() === normalizedType
    );
    
    if (matchingType) {
      console.log("Tipo encontrado:", matchingType, "usando modelo:", REPRESENTATIVE_TYPES[matchingType].modelPath);
      return REPRESENTATIVE_TYPES[matchingType].modelPath;
    }
    
    // Verificar se o próprio tipo já é um caminho de modelo direto
    if (normalizedType.includes('.glb')) {
      console.log("Usando caminho de modelo direto:", normalizedType);
      return normalizedType;
    }
    
    // Fallback para adulto masculino
    console.log("Tipo não encontrado, usando padrão MALE_ADULT");
    return REPRESENTATIVE_TYPES.MALE_ADULT.modelPath;
  }, [type]);
  
  // Usar diretamente useGLTF com clone para garantir que cada instância seja independente
  const { scene: originalModel } = useGLTF(modelPath);
  
  // Clonar o modelo para evitar compartilhamento de instâncias
  const model = React.useMemo(() => {
    if (originalModel) {
      return originalModel.clone(true);
    }
    return null;
  }, [originalModel]);
  
  // Definir a escala baseada no tipo do representante
  const modelScale = React.useMemo(() => {
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
  
  // Verificar se o modelo está disponível para debugar
  useEffect(() => {
    if (!model) {
      console.warn(`Modelo não encontrado para o tipo: ${type}, caminho: ${modelPath}`);
    } else {
      console.log(`Modelo carregado para ${name} (${type})`);
    }
  }, [model, name, type, modelPath]);
  
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

export default Representative; 