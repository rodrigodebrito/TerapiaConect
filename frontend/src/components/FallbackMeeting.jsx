import React, { useState, useEffect } from 'react';
import './FallbackMeeting.css';

/**
 * Componente para videoconferência com opções alternativas
 * Fornece o Jitsi Meet como opção principal
 */
const FallbackMeeting = ({ sessionId, therapistName, clientName, isFloating = false }) => {
  const [meetingOption, setMeetingOption] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className={`video-container ${isFloating ? 'floating' : ''}`}>
      <div className={`video-container-wrapper ${isFloating ? 'floating' : ''}`}>
        <iframe
          src={selectedOption.url}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          allowFullScreen
          className={`fallback-iframe ${isFloating ? 'floating' : ''}`}
          title={`Videoconferência: ${meetingTitle}`}
          onError={() => console.error("Erro ao carregar iframe")}
        />
      </div>
      
      {!isFloating && (
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