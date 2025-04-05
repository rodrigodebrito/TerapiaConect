import React, { useContext, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { ConstellationContext } from '../../contexts/ConstellationContext';
import Representative from './Representative';

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

const Field = ({ fieldTexture, representatives, selectedRepresentative, onSelectionChange, onPositionChange, onDragChange, canMove }) => {
  // Carregar a textura para o plano
  const circleTexture = useMemo(() => {
    const textureLoader = new THREE.TextureLoader();
    return textureLoader.load(fieldTexture || '/white-circle.png');
  }, [fieldTexture]);

  // Acessar os estados e funções do componente pai
  const context = useContext(ConstellationContext);
  const handleRepresentativeSelect = context?.handleRepresentativeSelect;

  // Usar o manipulador de seleção fornecido ou o do contexto
  const handleSelect = useCallback((rep) => {
    console.log("Field handleSelect called with rep:", rep ? rep.name : "null");
    
    // Verificar se temos onSelectionChange nas props
    if (onSelectionChange) {
      console.log("Using onSelectionChange from props");
      onSelectionChange(rep);
    } 
    // Verificar se temos handleRepresentativeSelect no contexto
    else if (handleRepresentativeSelect) {
      console.log("Using handleRepresentativeSelect from context");
      handleRepresentativeSelect(rep);
    } else {
      console.log("No selection handler available");
    }
  }, [onSelectionChange, handleRepresentativeSelect]);

  // Verificar se temos representantes válidos
  console.log("Field representatives:", representatives);
  
  // Verificar o formato dos representantes
  const hasValidRepresentatives = Array.isArray(representatives) && representatives.length > 0;
  
  if (!hasValidRepresentatives) {
    console.warn("Field: Representantes inválidos ou vazios", representatives);
  } else {
    console.log(`Field: Renderizando ${representatives.length} representantes`);
    
    // Depurar o primeiro representante para verificar seu formato
    const firstRep = representatives[0];
    console.log("Formato do primeiro representante:", firstRep);
    console.log("Posição:", firstRep.position, "Tipo:", typeof firstRep.position);
  }

  return (
    <group>
      {/* Plano circular branco */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          handleSelect(null);
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
      {hasValidRepresentatives && representatives.map((rep) => {
        if (!rep || !rep.id) {
          console.warn("Field: Representante inválido encontrado", rep);
          return null;
        }
        
        return (
          <Representative
            key={rep.id}
            representative={rep}
            selected={selectedRepresentative?.id === rep.id}
            onSelect={handleSelect}
            onContextMenu={(rep, event) => {}}
          />
        );
      })}
    </group>
  );
};

export default Field; 