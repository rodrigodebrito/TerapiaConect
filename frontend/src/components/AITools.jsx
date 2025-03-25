import React from 'react';
import './AITools.css';

const AITools = ({ onAnalyze, onSuggest, onReport, isProcessing }) => {
  return (
    <div className="ai-tools-container">
      <div className="jitsi-control-bar">
        <button 
          onClick={onAnalyze} 
          className="jitsi-control-button"
          disabled={isProcessing}
          title="Análise da Sessão"
        >
          <span className="icon">🧠</span>
        </button>
        
        <button 
          onClick={onSuggest} 
          className="jitsi-control-button"
          disabled={isProcessing}
          title="Sugestões"
        >
          <span className="icon">💡</span>
        </button>
        
        <button 
          onClick={onReport} 
          className="jitsi-control-button"
          disabled={isProcessing}
          title="Relatório"
        >
          <span className="icon">📝</span>
        </button>
      </div>
    </div>
  );
};

export default AITools; 