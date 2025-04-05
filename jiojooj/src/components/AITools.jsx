import React from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import '../styles/AITools.css';

/**
 * Componente que exibe os botões de ferramentas de IA
 * para uso durante as sessões de videochamada
 */
const AITools = ({ sessionId }) => {
  const { analyze, suggest, report, isProcessing } = useAI();
  
  return (
    <div className="ai-tools-container">
      <div className="ai-tools-buttons">
        <button 
          className="ai-button"
          onClick={() => suggest(sessionId)}
          disabled={isProcessing}
        >
          <span role="img" aria-label="Sugestões">💡</span>
          <span>Sugestões</span>
        </button>

        <button 
          className="ai-button"
          onClick={() => analyze(sessionId)}
          disabled={isProcessing}
        >
          <span role="img" aria-label="Analisar">🧠</span>
          <span>Analisar</span>
        </button>
        
        <button 
          className="ai-button"
          onClick={() => report(sessionId)}
          disabled={isProcessing}
        >
          <span role="img" aria-label="Relatório">📝</span>
          <span>Relatório</span>
        </button>
        
        <button 
          className="ai-button"
          onClick={() => window.open(`/campo/${sessionId}`, '_blank')}
        >
          <span role="img" aria-label="Campo">📋</span>
          <span>Campo</span>
        </button>
      </div>
    </div>
  );
};

AITools.propTypes = {
  sessionId: PropTypes.string.isRequired
};

export default AITools; 