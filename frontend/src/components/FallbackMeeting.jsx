import React, { useState, useEffect } from 'react';
import './FallbackMeeting.css';

/**
 * Componente para videoconferência com opções alternativas
 * Fornece o Jitsi Meet como opção principal
 */
const FallbackMeeting = ({ sessionId, therapistName, clientName }) => {
  const [meetingType, setMeetingType] = useState('jitsi'); // Começa diretamente com Jitsi
  const [meetingUrl, setMeetingUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [showIframe, setShowIframe] = useState(true);

  // Gerar um nome de sala único baseado no ID da sessão
  const roomName = sessionId 
    ? `terapiaconect-${sessionId.replace(/[^a-zA-Z0-9]/g, '')}`
    : `terapiaconect-${Date.now()}`;

  // Opções de plataformas para videoconferência
  const meetingOptions = [
    {
      type: 'jitsi',
      name: 'Jitsi Meet',
      logo: '📹',
      url: `https://8x8.vc/${roomName}`,
      description: 'Videoconferência gratuita e segura',
      recommended: true
    },
    {
      type: 'google',
      name: 'Google Meet',
      logo: '🔵',
      url: 'https://meet.google.com/new',
      description: 'Crie uma nova reunião no Google Meet',
      recommended: false
    },
    {
      type: 'whereby',
      name: 'Whereby',
      logo: '🟣',
      url: 'https://whereby.com/create-room',
      description: 'Crie uma sala e compartilhe o link',
      recommended: false
    }
  ];

  // Inicializar diretamente o Jitsi Meet quando o componente é montado
  useEffect(() => {
    console.log("FallbackMeeting: Inicializando Jitsi Meet...");
    const jitsiUrl = `https://8x8.vc/${roomName}`;
    setMeetingUrl(jitsiUrl);
    setLoading(true);
    
    // Tempo para o iframe carregar
    const timer = setTimeout(() => {
      console.log("FallbackMeeting: Jitsi Meet carregado");
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [roomName]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    alert('Link copiado para a área de transferência!');
  };

  const handleOpenInNewTab = () => {
    window.open(meetingUrl, '_blank');
  };

  const handleSelectOption = (optionType) => {
    console.log(`FallbackMeeting: Selecionando opção ${optionType}`);
    const selectedOption = meetingOptions.find(option => option.type === optionType);
    if (selectedOption) {
      setMeetingType(selectedOption.type);
      setMeetingUrl(selectedOption.url);
      setLoading(true);
      setShowIframe(true);
      
      // Tempo para o novo iframe carregar
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  const showOptions = () => {
    console.log("FallbackMeeting: Exibindo opções");
    setMeetingType(null);
  };

  const handleIframeError = () => {
    console.log("FallbackMeeting: Erro ao carregar iframe");
    setShowIframe(false);
  };

  return (
    <div className="fallback-meeting-container">
      {meetingType ? (
        <>
          <div className="fallback-header">
            <div>
              {loading ? 'Iniciando videoconferência...' : `Videoconferência: ${therapistName || 'Terapeuta'} e ${clientName || 'Cliente'}`}
            </div>
            <div className="header-actions">
              <button 
                className="copy-link-button" 
                onClick={handleCopyLink} 
                title="Copiar link para compartilhar"
              >
                Copiar Link
              </button>
              <button 
                className="open-new-tab-button" 
                onClick={handleOpenInNewTab}
                title="Abrir em nova janela"
              >
                Abrir em Nova Janela
              </button>
              <button 
                className="change-option-button" 
                onClick={showOptions}
              >
                Mudar Opção
              </button>
            </div>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '40px' }}>
              <p>Carregando videoconferência... Por favor aguarde.</p>
            </div>
          ) : !showIframe ? (
            <div className="iframe-error-container">
              <h3>Não foi possível carregar a videoconferência no iframe</h3>
              <p>Você pode tentar abrir a reunião em uma nova janela:</p>
              <button 
                onClick={handleOpenInNewTab}
                className="open-new-tab-button-large"
              >
                Abrir Videoconferência em Nova Janela
              </button>
              <p>Ou copie o link e compartilhe com o outro participante:</p>
              <div className="meeting-link-container">
                <input 
                  type="text" 
                  value={meetingUrl} 
                  readOnly 
                  className="meeting-link-input"
                />
                <button 
                  onClick={handleCopyLink}
                  className="copy-link-button-small"
                >
                  Copiar
                </button>
              </div>
            </div>
          ) : (
            <iframe 
              src={meetingUrl} 
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="fallback-iframe"
              title="Video Conference"
              onError={handleIframeError}
            ></iframe>
          )}
          
          <div className="fallback-footer">
            <p>
              Se houver problemas com a videoconferência, tente abrir em uma nova janela ou escolha outra opção.
            </p>
          </div>
        </>
      ) : (
        <div className="fallback-options-container">
          <h2>Escolha uma opção para sua videoconferência</h2>
          <div className="fallback-options-grid">
            {meetingOptions.map((option) => (
              <div 
                key={option.type} 
                className={`fallback-option-card ${option.recommended ? 'recommended' : ''}`}
                onClick={() => handleSelectOption(option.type)}
              >
                {option.recommended && <span className="recommended-badge">Recomendado</span>}
                <div className="option-logo">{option.logo}</div>
                <h4>{option.name}</h4>
                <p>{option.description}</p>
                <button className="select-option-button">Selecionar</button>
              </div>
            ))}
          </div>
          <div className="fallback-note">
            <p>Nota: Ao escolher uma opção, você será redirecionado para uma sala de conferência segura. 
            Os participantes precisarão permitir acesso à câmera e microfone.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FallbackMeeting; 