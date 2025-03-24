import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSession } from '../../contexts/SessionContext';

const VideoArea = ({ isFloating }) => {
  const { session } = useSession();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoAreaRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Simulação inicial - futuramente será implementada a videoconferência real
  useEffect(() => {
    // Aqui será integrado o código de inicialização da videoconferência
    console.log('Inicializando área de vídeo para a sessão:', session?.id);
  }, [session]);

  // Funções para arrastar o vídeo quando em modo flutuante
  const handleMouseDown = (e) => {
    if (!isFloating) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
    
    if (videoAreaRef.current) {
      videoAreaRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Aplicar eventos de mouse quando em modo flutuante
  useEffect(() => {
    if (isFloating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isFloating, isDragging, dragStart]);

  return (
    <div 
      ref={videoAreaRef}
      className={`video-area ${isFloating ? 'video-floating' : ''}`}
      onMouseDown={handleMouseDown}
    >
      {isFloating && (
        <div className="restore-video">
          <span role="img" aria-label="Mover">↔️</span>
        </div>
      )}
      <div className="video-container">
        <div className="video-stream local-stream" ref={localVideoRef}>
          <div className="video-placeholder">
            <p>Sua câmera</p>
          </div>
        </div>
        <div className="video-stream remote-stream" ref={remoteVideoRef}>
          <div className="video-placeholder">
            <p>Câmera do participante</p>
          </div>
        </div>
        <div className="video-controls">
          <button className="video-button">
            <span role="img" aria-label="Microfone">🎤</span>
          </button>
          <button className="video-button">
            <span role="img" aria-label="Câmera">📹</span>
          </button>
          <button className="video-button">
            <span role="img" aria-label="Compartilhar tela">📺</span>
          </button>
          <button className="video-button end-call">
            <span role="img" aria-label="Encerrar">❌</span>
          </button>
        </div>
      </div>
    </div>
  );
};

VideoArea.propTypes = {
  isFloating: PropTypes.bool
};

VideoArea.defaultProps = {
  isFloating: false
};

export default VideoArea; 