import React, { useState, useEffect, useRef } from 'react';
import './FallbackMeeting.css';

/**
 * Componente para videoconferência com opções alternativas
 * Design inspirado no Zoom para melhor usabilidade
 */
const FallbackMeeting = ({ sessionId, therapistName, clientName, isFloating }) => {
  const [meetingOption, setMeetingOption] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

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
    if (!isFloating || e.target.closest('.meeting-controls')) return;
    
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

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Detectar quando sair do modo fullscreen usando a tecla ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.mozFullScreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  // Funções para controlar áudio e vídeo (mostrar notificação)
  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    
    // Notificação - simulada para interface
    const audioStatus = !isAudioMuted ? 'desativado' : 'ativado';
    showTemporaryNotification(`Microfone ${audioStatus}`);
    
    // Aqui você adicionaria a integração real com a API Jitsi
  };

  const toggleVideo = () => {
    setIsVideoMuted(!isVideoMuted);
    
    // Notificação - simulada para interface
    const videoStatus = !isVideoMuted ? 'desativada' : 'ativada';
    showTemporaryNotification(`Câmera ${videoStatus}`);
    
    // Aqui você adicionaria a integração real com a API Jitsi
  };

  // Função para mostrar notificação temporária
  const [notification, setNotification] = useState(null);
  
  const showTemporaryNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

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
  const containerClassName = isFloating 
    ? `fallback-meeting-container floating ${isFullscreen ? 'fullscreen' : ''}` 
    : `fallback-meeting-container ${isFullscreen ? 'fullscreen' : ''}`;
  
  const floatingStyle = isFloating && !isFullscreen ? {
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
      {notification && (
        <div className="meeting-notification">
          {notification}
        </div>
      )}

      <div className="meeting-header">
        <div className="meeting-title">
          {meetingTitle}
        </div>
        <div className="header-actions">
          <button 
            className="meeting-control-btn"
            onClick={handleCopyLink}
            title="Copiar link da reunião"
          >
            {isCopied ? '✓' : '🔗'}
          </button>
          <button 
            className="meeting-control-btn"
            onClick={handleChangeOption}
            title="Mudar opção de videoconferência"
          >
            📋
          </button>
        </div>
      </div>

      {selectedOption && (
        <div className="video-container-wrapper">
          <iframe
            ref={iframeRef}
            src={selectedOption.url}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
            className="fallback-iframe"
            title={`Videoconferência: ${meetingTitle}`}
            onError={() => console.error("Erro ao carregar iframe")}
          />
        </div>
      )}

      {/* Barra de controles estilo Zoom */}
      <div className="meeting-controls">
        <div className="controls-left">
          <button 
            className={`meeting-control-btn ${isAudioMuted ? 'disabled' : ''}`}
            onClick={toggleAudio}
            title={isAudioMuted ? "Ativar microfone" : "Desativar microfone"}
          >
            {isAudioMuted ? '🔇' : '🎤'}
          </button>
          <button 
            className={`meeting-control-btn ${isVideoMuted ? 'disabled' : ''}`}
            onClick={toggleVideo}
            title={isVideoMuted ? "Ativar câmera" : "Desativar câmera"}
          >
            {isVideoMuted ? '🚫' : '📹'}
          </button>
        </div>
        
        <div className="controls-center">
          {/* Botões adicionais de controle central podem ser colocados aqui */}
        </div>
        
        <div className="controls-right">
          <button 
            className="meeting-control-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
          >
            {isFullscreen ? '⬆' : '⤢'}
          </button>
        </div>
      </div>

      {isFloating && (
        <div className="drag-handle" title="Arrastar">⋮⋮</div>
      )}
    </div>
  );
};

export default FallbackMeeting; 