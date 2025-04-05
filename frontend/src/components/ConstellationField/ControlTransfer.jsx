import React, { useState, useContext, useEffect } from 'react';
import { ConstellationContext } from '../../contexts/ConstellationContext';
import './ControlTransfer.css';

/**
 * Componente para permitir transferir o controle da constelação para outros participantes
 */
const ControlTransfer = () => {
  const { 
    hasControl, 
    transferControl, 
    getSessionParticipants 
  } = useContext(ConstellationContext);
  
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState("next");
  const [showParticipants, setShowParticipants] = useState(false);
  const [transferring, setTransferring] = useState(false);
  
  // Obter participantes quando o componente carregar
  useEffect(() => {
    const fetchParticipants = () => {
      const sessionParticipants = getSessionParticipants();
      setParticipants(sessionParticipants);
      
      // Se não há participantes selecionados e há pelo menos 1, selecionar o primeiro
      if (!selectedParticipant && sessionParticipants.length > 0) {
        setSelectedParticipant(sessionParticipants[0].id);
      }
    };
    
    fetchParticipants();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchParticipants, 10000);
    
    return () => clearInterval(interval);
  }, [getSessionParticipants, selectedParticipant]);
  
  const handleTransferControl = () => {
    if (selectedParticipant) {
      setTransferring(true);
      
      // Feedback visual temporário
      setTimeout(() => {
        // Se for "next", usar null para usar o sistema de "próximo cliente"
        const targetId = selectedParticipant === "next" ? null : selectedParticipant;
        transferControl(targetId);
        setShowParticipants(false);
        setTransferring(false);
      }, 500);
    }
  };
  
  const toggleParticipantsList = () => {
    setShowParticipants(prev => !prev);
  };
  
  // Renderizar apenas para quem tem controle
  if (!hasControl) return null;
  
  return (
    <div className="control-transfer-container">
      <button 
        className="transfer-button"
        onClick={toggleParticipantsList}
        title="Transferir controle para outro participante"
        disabled={transferring}
      >
        {transferring ? <span>Transferindo...</span> : <span>Transferir Controle</span>}
      </button>
      
      {showParticipants && (
        <div className="participants-dropdown">
          <div className="participants-list">
            <div className="participants-header">
              <h3>Transferir controle para:</h3>
              <button className="close-button" onClick={() => setShowParticipants(false)}>×</button>
            </div>
            
            <div className="participants-options">
              {/* Lista de participantes específicos */}
              {participants.map(participant => (
                <div 
                  className={`participant-option ${participant.isSpecial ? 'special' : ''}`} 
                  key={participant.id}
                >
                  <input 
                    type="radio" 
                    id={`participant-${participant.id}`} 
                    name="participant" 
                    value={participant.id}
                    checked={selectedParticipant === participant.id}
                    onChange={() => setSelectedParticipant(participant.id)}
                    disabled={participant.isCurrentUser} // Desabilitar a opção atual
                  />
                  <label htmlFor={`participant-${participant.id}`}>
                    {participant.name}
                    {participant.isCurrentUser && " (você)"}
                  </label>
                </div>
              ))}
              
              {participants.length === 0 && (
                <div className="no-participants">
                  Nenhum outro participante disponível
                </div>
              )}
            </div>
            
            <div className="participants-actions">
              <button 
                className={`transfer-action-button ${transferring ? 'transferring' : ''}`}
                onClick={handleTransferControl}
                disabled={!selectedParticipant || transferring}
              >
                {transferring ? 'Transferindo...' : 'Transferir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlTransfer; 