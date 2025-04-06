import React, { useState, useEffect, useRef } from 'react';
import './ConstellationField3D.css';

/**
 * Campo de Constelação 3D com prato/plataforma sincronizada
 */
const ConstellationField3D = ({ sessionId, isHost, isActive, debug }) => {
  const [timestamp] = useState(Date.now());
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  
  // Inicializar o campo e configurar o Canvas
  useEffect(() => {
    console.log('ConstellationField3D montado com props:', { 
      sessionId, isHost, isActive, debug, timestamp 
    });
    
    // Registrar que o campo foi montado
    window.dispatchEvent(new CustomEvent('constellation-mounted', {
      detail: { sessionId, timestamp }
    }));
    
    // Configurar o Canvas se estiver disponível
    const setupCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Configurar o tamanho do canvas para ocupar o container
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
      
      // Iniciar animação
      startAnimation();
    };
    
    // Dar tempo para o DOM ser montado completamente
    setTimeout(setupCanvas, 100);
    
    // Lidar com redimensionamento da janela
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      console.log('ConstellationField3D desmontado');
      window.removeEventListener('resize', handleResize);
      
      // Cancelar animação se estiver rodando
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sessionId, isHost, isActive, debug, timestamp]);
  
  // Função para desenhar o prato 3D
  const drawPlate = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    // Limpar o canvas
    ctx.clearRect(0, 0, width, height);
    
    // Salvar o estado atual
    ctx.save();
    
    // Transladar para o centro e aplicar rotação
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    
    // Desenhar o prato circular principal
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1a3a5e';
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Desenhar círculos concêntricos
    for (let r = radius * 0.8; r > 0; r -= radius * 0.2) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Desenhar divisões da bússola
    const directions = ['N', 'E', 'S', 'W'];
    directions.forEach((dir, i) => {
      const angle = (i * Math.PI / 2);
      const x = Math.cos(angle) * (radius * 0.9);
      const y = Math.sin(angle) * (radius * 0.9);
      
      // Linha da direção
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Texto da direção
      ctx.save();
      ctx.translate(x * 1.1, y * 1.1);
      ctx.rotate(-rotation); // Contra-rotação para manter o texto na orientação correta
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dir, 0, 0);
      ctx.restore();
    });
    
    // Adicionar alguns elementos para destacar a rotação
    for (let i = 0; i < 12; i++) {
      const angle = i * (Math.PI / 6);
      const x1 = Math.cos(angle) * (radius * 0.95);
      const y1 = Math.sin(angle) * (radius * 0.95);
      const x2 = Math.cos(angle) * (radius * 1.0);
      const y2 = Math.sin(angle) * (radius * 1.0);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = i % 3 === 0 ? 2 : 1;
      ctx.stroke();
    }
    
    // Restaurar o estado
    ctx.restore();
  };
  
  // Animação do canvas
  const startAnimation = () => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      drawPlate(ctx, canvas.width, canvas.height);
      
      // Continuar a animação
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Iniciar o loop de animação
    animate();
  };
  
  // Sincronização de rotação via localStorage
  const syncRotation = (newRotation) => {
    try {
      localStorage.setItem('constellation-rotation', JSON.stringify({
        rotation: newRotation,
        sessionId,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Erro ao salvar rotação no localStorage:', err);
    }
  };
  
  // Ouvir por eventos de rotação
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'constellation-rotation') {
        try {
          const data = JSON.parse(e.newValue);
          if (data.sessionId === sessionId) {
            setRotation(data.rotation);
          }
        } catch (err) {
          console.error('Erro ao processar evento de rotação:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Inicializar a rotação a partir do localStorage
    try {
      const stored = localStorage.getItem('constellation-rotation');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.sessionId === sessionId) {
          setRotation(data.rotation);
        }
      }
    } catch (err) {
      console.error('Erro ao ler rotação do localStorage:', err);
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sessionId]);
  
  // Classes CSS para visibilidade e movimentação
  const containerClasses = [
    'constellation-field-3d-container',
    isActive ? 'visible' : 'constellation-field-3d-inactive',
    isDragging ? 'dragging' : ''
  ].join(' ');
  
  // Adicionar mensagem de console para depuração quando o componente é renderizado
  console.log('ConstellationField3D renderizado', { isActive, isDragging, rotation });
  
  // Manipuladores de eventos de mouse simplificados
  const handleMouseDown = (e) => {
    console.log('Mouse down em ConstellationField3D', e.clientX, e.clientY);
    setIsDragging(true);
    setLastMousePosition({
      x: e.clientX || e.touches[0].clientX,
      y: e.clientY || e.touches[0].clientY
    });
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Obter coordenadas do mouse ou toque
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
    
    if (clientX === null) return;
    
    // Calcular alteração na posição do mouse
    const deltaX = clientX - lastMousePosition.x;
    
    // Console log para debug
    console.log('Mouse move:', { 
      deltaX, 
      oldRotation: rotation
    });
    
    // Aplicar uma rotação proporcional ao movimento horizontal
    setRotation(prevRotation => {
      const newRotation = prevRotation + (deltaX * 0.01);
      
      // Sincronizar com outros clientes
      syncRotation(newRotation);
      
      return newRotation;
    });
    
    // Atualizar a posição anterior do mouse
    setLastMousePosition({
      x: clientX,
      y: clientY
    });
  };
  
  const handleMouseUp = () => {
    console.log('Mouse up em ConstellationField3D');
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      className={containerClasses}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Assegurar que o canvas tenha 100% de largura e altura */}
      <canvas 
        ref={canvasRef} 
        className="constellation-canvas"
      />
      
      {debug && (
        <div className="debug-info">
          <p>Sessão: {sessionId}</p>
          <p>Modo: {isHost ? 'Terapeuta' : 'Cliente'}</p>
          <p>Rotação: {Math.round(rotation * 100) / 100}</p>
          <p>Arrastando: {isDragging ? 'Sim' : 'Não'}</p>
          <p>Clique para girar o campo!</p>
        </div>
      )}
      
      {/* Botões para girar manualmente (mais fácil de testar) */}
      <div className="manual-rotation-controls">
        <button
          onClick={() => {
            const newRotation = rotation - 0.2;
            setRotation(newRotation);
            syncRotation(newRotation);
          }}
          className="rotation-button left"
        >
          ←
        </button>
        <button
          onClick={() => {
            const newRotation = rotation + 0.2;
            setRotation(newRotation);
            syncRotation(newRotation);
          }}
          className="rotation-button right"
        >
          →
        </button>
      </div>
      
      <div className="instructions">
        <p>Clique e arraste para girar o campo (ou use os botões)</p>
      </div>
      
      {/* Rosa dos ventos no canto */}
      <div className="compass-rose">
        <div className="compass-n">N</div>
        <div className="compass-e">L</div>
        <div className="compass-s">S</div>
        <div className="compass-w">O</div>
      </div>
    </div>
  );
};

export default ConstellationField3D; 