import React, { useState, useEffect, useRef } from 'react';
import './FallbackMeeting.css';

/**
 * Componente para videoconferência com opções alternativas
 * Fornece o Jitsi Meet como opção principal
 */
const FallbackMeeting = ({ sessionId, therapistName, clientName, isFloating }) => {
  const [meetingOption, setMeetingOption] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Gerar um nome de sala consistente baseado no ID da sessão
  const roomName = sessionId 
    ? `terapiaconect-${sessionId.replace(/[^a-zA-Z0-9]/g, '')}`
    : `terapiaconect-${Math.random().toString(36).substring(2, 10)}`;

  // Automatically select Jitsi Meet when component mounts
  useEffect(() => {
    setMeetingOption('jitsi');
    setIsLoading(false);
  }, []);

  const meetingOptions = [
    {
      id: 'jitsi',
      name: 'Jitsi Meet',
      icon: '🎥',
      url: `https://8x8.vc/${roomName}`,
      isRecommended: true
    },
    {
      id: 'googlemeet',
      name: 'Google Meet',
      icon: '👨‍💻',
      url: `https://meet.google.com/new`,
      isRecommended: false
    },
    {
      id: 'whereby',
      name: 'Whereby',
      icon: '🖥️',
      url: `https://whereby.com/${roomName}`,
      isRecommended: false
    }
  ];

  const handleCopyLink = () => {
    const option = meetingOptions.find(opt => opt.id === meetingOption);
    if (option) {
      navigator.clipboard.writeText(option.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleChangeOption = () => {
    setShowOptions(true);
  };

  // Funções para arrastar o componente quando estiver flutuante
  const handleMouseDown = (e) => {
    if (!isFloating) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
    
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Adicionar e remover event listeners para o arrastar
  useEffect(() => {
    if (isFloating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isFloating, isDragging, dragStart]);

  if (isLoading) {
    return (
      <div className="fallback-loading">
        <div className="loading-spinner"></div>
        <p>Inicializando videoconferência...</p>
      </div>
    );
  }

  if (showOptions) {
    return (
      <div className="fallback-options-container">
        <h3>Escolha uma opção de videoconferência:</h3>
        <div className="fallback-options-grid">
          {meetingOptions.map(option => (
            <div 
              key={option.id}
              className={`fallback-option-card ${option.isRecommended ? 'recommended' : ''}`}
              onClick={() => {
                setMeetingOption(option.id);
                setShowOptions(false);
              }}
            >
              {option.isRecommended && <div className="recommended-badge">Recomendado</div>}
              <div className="option-icon">{option.icon}</div>
              <div className="option-name">{option.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const selectedOption = meetingOptions.find(opt => opt.id === meetingOption);

  if (!selectedOption) return null;

  // Nome da reunião para exibição
  const meetingTitle = `${therapistName || 'Terapeuta'} e ${clientName || 'Cliente'}`;

  // Aplicar estilos específicos quando estiver no modo flutuante
  const containerClassName = isFloating ? "fallback-meeting-container floating" : "fallback-meeting-container";
  
  const floatingStyle = isFloating ? {
    position: 'absolute',
    top: `${position.y}px`,
    left: `${position.x}px`,
    zIndex: 1000,
    cursor: isDragging ? 'grabbing' : 'grab'
  } : {};

  return (
    <div 
      className={containerClassName} 
      style={floatingStyle}
      ref={containerRef}
      onMouseDown={handleMouseDown}
    >
      {selectedOption ? (
        <div className="video-container-wrapper">
          <iframe
            src={selectedOption.url}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
            className="fallback-iframe"
            title={`Videoconferência: ${meetingTitle}`}
            onError={() => console.error("Erro ao carregar iframe")}
            style={{
              width: '100%',
              height: '100%',
              minHeight: isFloating ? '170px' : '500px',
              border: 'none'
            }}
          />
        </div>
      ) : (
        <div className="meeting-header">
          <div className="meeting-title">
            Videoconferência: {meetingTitle}
          </div>
          <div className="header-actions">
            <button 
              className="change-option-button" 
              onClick={handleChangeOption}
            >
              Mudar Opção
            </button>
            <button 
              className="change-option-button" 
              onClick={handleCopyLink}
            >
              {isCopied ? '✓ Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FallbackMeeting; 