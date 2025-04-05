import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import './FloatingVideo.css';

/**
 * Componente de janela flutuante que exibe um vídeo do Daily.co
 * Alternativa ao PiP nativo, permite que o usuário continue vendo a videoconferência
 * enquanto navega pela plataforma
 */
const FloatingVideo = ({ 
  roomUrl, 
  sessionId, 
  isVisible, 
  onClose,
  position = { x: window.innerWidth - 320, y: window.innerHeight - 240 }
}) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [size, setSize] = useState({ width: 320, height: 240 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  
  // Construir URL com parâmetros apropriados
  const constructUrl = useCallback(() => {
    if (!roomUrl) return '';
    
    // Adicionar parâmetros para otimização do iframe flutuante
    const separator = roomUrl.includes('?') ? '&' : '?';
    return `${roomUrl}${separator}floating=true&showControls=minimal&layout=active`;
  }, [roomUrl]);
  
  // Lidar com início do arrasto da janela
  const handleDragStart = useCallback((e) => {
    if (e.target.className.includes('resize-handle')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - currentPosition.x,
      y: e.clientY - currentPosition.y
    });
    
    // Adicionar classe para estilização durante o arrasto
    if (containerRef.current) {
      containerRef.current.classList.add('dragging');
    }
    
    // Prevenir seleção de texto durante arrasto
    e.preventDefault();
  }, [currentPosition]);
  
  // Lidar com movimento durante o arrasto
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    // Calcular nova posição
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    // Limitar aos limites da janela
    newX = Math.max(0, Math.min(window.innerWidth - size.width, newX));
    newY = Math.max(0, Math.min(window.innerHeight - size.height, newY));
    
    setCurrentPosition({ x: newX, y: newY });
  }, [isDragging, dragStart, size]);
  
  // Finalizar arrasto
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      // Remover classe de arrasto
      if (containerRef.current) {
        containerRef.current.classList.remove('dragging');
      }
    }
  }, [isDragging]);
  
  // Iniciar redimensionamento
  const handleResizeStart = useCallback((e) => {
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    // Adicionar classe para estilização durante o redimensionamento
    if (containerRef.current) {
      containerRef.current.classList.add('resizing');
    }
    
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  // Redimensionar durante movimento
  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return;
    
    // Calcular nova largura e altura
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Atualizar tamanho com valores mínimos
    const newWidth = Math.max(240, size.width + deltaX);
    const newHeight = Math.max(180, size.height + deltaY);
    
    setSize({ width: newWidth, height: newHeight });
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  }, [isResizing, dragStart, size]);
  
  // Finalizar redimensionamento
  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      
      // Remover classe de redimensionamento
      if (containerRef.current) {
        containerRef.current.classList.remove('resizing');
      }
    }
  }, [isResizing]);
  
  // Lidar com carregamento do iframe
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    console.log('Iframe flutuante do Daily.co carregado com sucesso');
  }, []);
  
  // Gerenciar eventos de mouse para arrastar e redimensionar
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isVisible, handleDragMove, handleResizeMove, handleDragEnd, handleResizeEnd]);
  
  // Se não estiver visível, não renderizar nada
  if (!isVisible) return null;
  
  return (
    <div 
      ref={containerRef}
      className="floating-video-container"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`
      }}
      onMouseDown={handleDragStart}
    >
      <div className="floating-video-header">
        <span className="floating-video-title">
          Videoconferência {sessionId ? `- Sessão: ${sessionId}` : ''}
        </span>
        <button className="floating-video-close" onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className="floating-video-content">
        {isLoading && (
          <div className="floating-video-loading">
            <span>Carregando vídeo...</span>
          </div>
        )}
        
        {roomUrl && (
          <iframe
            ref={iframeRef}
            src={constructUrl()}
            title="Daily.co Meeting"
            allow="camera; microphone; fullscreen; speaker; display-capture"
            onLoad={handleIframeLoad}
            className="floating-video-iframe"
          />
        )}
      </div>
      
      <div 
        className="resize-handle"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};

FloatingVideo.propTypes = {
  roomUrl: PropTypes.string.isRequired,
  sessionId: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  })
};

export default FloatingVideo; 