import React from 'react';
import PropTypes from 'prop-types';
import { ConstellationProvider } from '../../contexts/ConstellationContext';
import ConstellationField from '../../components/ConstellationField/index';
import { useAI } from '../../contexts/AIContext';

const ActiveTools = ({ activeTool, isFieldActive }) => {
  const { aiInsights, isProcessing } = useAI();

  return (
    <div className={`active-tools ${isFieldActive ? 'field-active' : ''}`}>
      {activeTool === 'constellation' && (
        <div className="constellation-container">
          <h3 className="tool-header">Campo de Constelação</h3>
          <ConstellationProvider>
            <ConstellationField />
          </ConstellationProvider>
        </div>
      )}
      
      {activeTool === 'ai' && (
        <div className="ai-panel">
          <h3 className="tool-header">Assistente IA</h3>
          <div className="ai-content">
            {isProcessing ? (
              <div className="ai-loading">Processando...</div>
            ) : aiInsights ? (
              <div className="ai-insights">
                <h4>Insights</h4>
                <p>{aiInsights}</p>
              </div>
            ) : (
              <div className="ai-placeholder">
                <p>O assistente IA está pronto para ajudar</p>
                <p>Ele analisará o áudio da sessão e fornecerá insights</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!activeTool && (
        <div className="no-tools">
          <p>Selecione uma ferramenta para começar</p>
        </div>
      )}
    </div>
  );
};

ActiveTools.propTypes = {
  activeTool: PropTypes.string,
  isFieldActive: PropTypes.bool
};

ActiveTools.defaultProps = {
  activeTool: null,
  isFieldActive: false
};

export default ActiveTools; 