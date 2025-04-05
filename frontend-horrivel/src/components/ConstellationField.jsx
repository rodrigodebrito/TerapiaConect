import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './ConstellationField.css';

export const ConstellationField = ({ 
  isHost = false, 
  sessionId = '', 
  fieldTexture = '/white-circle.png' // Definir uma textura padrão
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calcular dimensões mantendo proporção 16:9
  const calculateDimensions = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calcular dimensões mantendo proporção 16:9
    let width, height;
    const aspectRatio = 16 / 9;

    if (containerWidth / containerHeight > aspectRatio) {
      // Container mais largo que 16:9
      height = containerHeight;
      width = height * aspectRatio;
    } else {
      // Container mais alto que 16:9
      width = containerWidth;
      height = width / aspectRatio;
    }

    // Garantir que as dimensões não ultrapassem o container
    width = Math.min(width, containerWidth);
    height = Math.min(height, containerHeight);

    setDimensions({ width, height });
  };

  // Recalcular dimensões quando o container mudar de tamanho
  useEffect(() => {
    const resizeObserver = new ResizeObserver(calculateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Inicializar canvas quando as dimensões mudarem
  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Limpar canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Adicionar grade de referência
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Linhas horizontais
    for (let y = 0; y < dimensions.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
    }

    // Linhas verticais
    for (let x = 0; x < dimensions.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }
  }, [dimensions]);

  useEffect(() => {
    // Inicializar o canvas e configurar o campo
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Ajustar o tamanho do canvas para preencher o container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    // Carregar a textura do campo
    const texture = new Image();
    texture.src = fieldTexture;
    
    // Adicionar um timeout para evitar carregamento infinito
    const textureTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Timeout carregando textura, usando cor padrão');
        setIsLoading(false);
        
        // Usar cor sólida em vez de textura
        if (ctx) {
          ctx.fillStyle = '#e6e0ff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 5000);
    
    texture.onload = () => {
      clearTimeout(textureTimeout);
      setIsLoading(false);
      // Desenhar a textura como padrão de fundo
      if (ctx) {
        try {
          const pattern = ctx.createPattern(texture, 'repeat');
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            // Fallback se pattern não puder ser criado
            ctx.fillStyle = '#e6e0ff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } catch (e) {
          console.error('Erro ao criar padrão:', e);
          ctx.fillStyle = '#e6e0ff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
    
    texture.onerror = () => {
      clearTimeout(textureTimeout);
      console.error('Erro ao carregar textura:', fieldTexture);
      setIsLoading(false);
      
      // Fallback para cor sólida
      if (ctx) {
        ctx.fillStyle = '#e6e0ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Adicionar listeners para redimensionamento
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(textureTimeout);
    };
  }, [fieldTexture, isLoading]);

  // Função para alternar tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        overflow: 'hidden'
      }}
    >
      {isLoading && (
        <div className="field-loading">
          <div className="field-loader"></div>
          <span>Carregando campo...</span>
            </div>
      )}
            
      <div className="field-header">
        <h2>Campo de Constelação</h2>
        <div className="field-controls">
            <button 
            className="field-control-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? "⬆" : "⤢"}
            </button>
          </div>
      </div>
      
      <div className="field-container">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
        
        {isHost && (
          <div className="field-toolbar">
            <button className="tool-btn" title="Adicionar pessoa">👤</button>
            <button className="tool-btn" title="Adicionar objeto">⭐</button>
            <button className="tool-btn" title="Adicionar texto">T</button>
            <button className="tool-btn" title="Limpar campo">🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
};

ConstellationField.propTypes = {
  isHost: PropTypes.bool,
  sessionId: PropTypes.string,
  fieldTexture: PropTypes.string
}; 