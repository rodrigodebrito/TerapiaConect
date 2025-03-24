import React, { useState, useEffect } from 'react';
import './FallbackMeeting.css';

/**
 * Componente para videoconferência com opções alternativas
 * Fornece o Jitsi Meet como opção principal, com Google Meet e Whereby como alternativas
 */
const FallbackMeeting = ({ sessionId, therapistName, clientName }) => {
  const [meetingType, setMeetingType] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [loading, setLoading] = useState(true);

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
      url: `https://meet.jit.si/${roomName}`,
      description: 'Videoconferência gratuita e segura (Recomendado)',
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
      url: 'https://whereby.com/user',
      description: 'Crie uma sala e compartilhe o link',
      recommended: false
    }
  ];

  // Automaticamente seleciona o Jitsi Meet quando o componente é montado
  useEffect(() => {
    const jitsiOption = meetingOptions.find(option => option.type === 'jitsi');
    if (jitsiOption) {
      handleSelectMeeting(jitsiOption);
    }
  }, []);

  // Lidar com o evento de carregamento do iframe
  useEffect(() => {
    if (meetingUrl) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [meetingUrl]);

  const handleSelectMeeting = (option) => {
    setMeetingType(option.type);
    setMeetingUrl(option.url);
    setLoading(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    alert('Link copiado para a área de transferência!');
  };

  const handleSelectOption = (optionType) => {
    const selectedOption = meetingOptions.find(option => option.type === optionType);
    if (selectedOption) {
      handleSelectMeeting(selectedOption);
    }
  };

  return (
    <div className="fallback-meeting-container">
      {meetingType ? (
        <>
          <div className="fallback-header">
            <div>
              {loading ? 'Iniciando videoconferência...' : `Videoconferência: ${therapistName} e ${clientName}`}
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
                className="change-option-button" 
                onClick={() => setMeetingType(null)}
              >
                Mudar Opção
              </button>
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <p>Carregando videoconferência... Por favor aguarde.</p>
            </div>
          ) : (
            <iframe 
              src={meetingUrl} 
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="fallback-iframe"
            ></iframe>
          )}
          <div className="fallback-footer">
            Se houver algum problema com esta videoconferência, você pode voltar e escolher outra opção.
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