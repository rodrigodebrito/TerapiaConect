import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FallbackMeeting from './FallbackMeeting';

const FloatingVideo = ({ sessionId, therapistName, clientName, onClose }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoRef = useRef(null);
  const frameRef = useRef(null);

  // Função para obter as coordenadas globais (considerando múltiplos monitores)
  const getGlobalBounds = () => {
    if (typeof window.screen.availLeft !== 'undefined') {
      return {
        left: window.screen.availLeft,
        top: window.screen.availTop,
        right: window.screen.availLeft + window.screen.availWidth,
        bottom: window.screen.availTop + window.screen.availHeight
      };
    }
    return {
      left: 0,
      top: 0,
      right: window.screen.width,
      bottom: window.screen.height
    };
  };

  useEffect(() => {
    const handleResize = () => {
      const bounds = getGlobalBounds();
      setPosition(prev => ({
        x: Math.min(Math.max(bounds.left, prev.x), bounds.right - 280),
        y: Math.min(Math.max(bounds.top, prev.y), bounds.bottom - 158)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e) => {
    // Permite interação com o iframe do Jitsi
    if (e.target.closest('.fallback-iframe')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.screenX - position.x,
      y: e.screenY - position.y
    });

    // Previne seleção de texto durante o drag
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    // Usa screenX/screenY para suportar múltiplos monitores
    const bounds = getGlobalBounds();
    const newX = Math.max(bounds.left, Math.min(e.screenX - dragStart.x, bounds.right - 280));
    const newY = Math.max(bounds.top, Math.min(e.screenY - dragStart.y, bounds.bottom - 158));

    // Usa requestAnimationFrame para movimento mais suave
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      setPosition({ x: newX, y: newY });
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Adiciona classe no body para prevenir seleção de texto
      document.body.classList.add('dragging-video');
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.classList.remove('dragging-video');
      };
    }
  }, [isDragging]);

  const floatingVideo = (
    <div
      ref={videoRef}
      className="floating-video-wrapper"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '280px',
        height: '158px',
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundColor: '#000',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
        zIndex: 2147483647
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => videoRef.current?.style.setProperty('box-shadow', '0 8px 24px rgba(0, 0, 0, 0.25)')}
      onMouseLeave={() => videoRef.current?.style.setProperty('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)')}
    >
      <FallbackMeeting
        sessionId={sessionId}
        therapistName={therapistName}
        clientName={clientName}
        className="floating"
      />
    </div>
  );

  return createPortal(floatingVideo, document.body);
};

export default FloatingVideo; 