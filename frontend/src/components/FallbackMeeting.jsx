import React, { useState } from 'react';
import './DyteMeeting.css';

/**
 * Componente de fallback para videoconferência quando o Dyte falhar
 * Usa alternativas como Google Meet ou Jitsi Meet em iframes
 */
const FallbackMeeting = ({ sessionId, therapistName, clientName }) => {
  const [meetingType, setMeetingType] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [showIframe, setShowIframe] = useState(false);

  // Gerar um nome de sala único baseado no ID da sessão
  const roomName = `terapiaconnect-${sessionId.substring(0, 8)}`;
  
  // Opções de videoconferência alternativas
  const meetingOptions = [
    {
      name: 'Jitsi Meet',
      logo: '📹',
      url: `https://meet.jit.si/${roomName}`,
      description: 'Videoconferência gratuita e segura'
    },
    {
      name: 'Google Meet',
      logo: '🔵',
      url: 'https://meet.google.com/new',
      description: 'Crie uma nova reunião no Google Meet'
    },
    {
      name: 'Whereby',
      logo: '🟣',
      url: 'https://whereby.com/user',
      description: 'Crie uma sala e compartilhe o link'
    }
  ];

  const handleSelectMeeting = (option) => {
    setMeetingType(option.name);
    setMeetingUrl(option.url);
    setShowIframe(true);
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
  };

  if (showIframe) {
    return (
      <div className="fallback-meeting-container">
        <div className="fallback-header">
          <h3>Videoconferência via {meetingType}</h3>
          <button 
            onClick={() => setShowIframe(false)}
            className="back-button"
          >
            ← Voltar
          </button>
        </div>
        <iframe
          src={meetingUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="fallback-iframe"
          title={`Reunião via ${meetingType}`}
        ></iframe>
        <div className="fallback-footer">
          <p>Link da reunião: <strong>{meetingUrl}</strong></p>
          <button 
            onClick={() => handleCopyLink(meetingUrl)}
            className="copy-link-button"
          >
            Copiar Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fallback-options-container">
      <h3>Escolha uma alternativa para videoconferência</h3>
      <p>A conexão com o Dyte não foi possível. Por favor, escolha uma das opções abaixo:</p>
      
      <div className="fallback-options-grid">
        {meetingOptions.map((option, index) => (
          <div 
            key={index} 
            className="fallback-option-card"
            onClick={() => handleSelectMeeting(option)}
          >
            <div className="option-logo">{option.logo}</div>
            <h4>{option.name}</h4>
            <p>{option.description}</p>
            <button className="select-option-button">Selecionar</button>
          </div>
        ))}
      </div>
      
      <div className="fallback-note">
        <p><strong>Nota:</strong> Após selecionar uma opção, compartilhe o link da reunião com o outro participante.</p>
      </div>
    </div>
  );
};

export default FallbackMeeting; 