import React from 'react';
import PropTypes from 'prop-types';
import './AIToolsJitsi.css';

const AIToolsJitsi = ({ onAnalyze, onSuggest, onReport, isProcessing }) => {
  return (
    <div className="ai-tools-fixed">
      <div className="ai-toolbar">
        <button 
          className="ai-button"
          onClick={onAnalyze}
          disabled={isProcessing}
          title="Analisar a sessão atual"
        >
          <span role="img" aria-label="Analisar">🧠</span>
          <span className="button-text">Analisar</span>
        </button>
        
        <button 
          className="ai-button"
          onClick={onSuggest}
          disabled={isProcessing}
          title="Obter sugestões para a sessão"
        >
          <span role="img" aria-label="Sugerir">💡</span>
          <span className="button-text">Sugestões</span>
        </button>
        
        <button 
          className="ai-button"
          onClick={onReport}
          disabled={isProcessing}
          title="Gerar relatório da sessão"
        >
          <span role="img" aria-label="Relatório">📝</span>
          <span className="button-text">Relatório</span>
        </button>

        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <span>Processando...</span>
          </div>
        )}
      </div>
    </div>
  );
};

AIToolsJitsi.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  onSuggest: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool
};

export default AIToolsJitsi; 