import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './AIToolsContainer.css';

/**
 * Container para Ferramentas de IA
 * Exibe as ferramentas disponíveis para o terapeuta ou cliente durante a sessão
 */
const AIToolsContainer = ({ sessionId, isHost }) => {
  const [activeTab, setActiveTab] = useState('transcription');
  const [isMinimized, setIsMinimized] = useState(false);
  
  useEffect(() => {
    console.log('AIToolsContainer montado com props:', { sessionId, isHost });
  }, [sessionId, isHost]);
  
  const tools = [
    { id: 'transcription', label: 'Transcrição', icon: '📝' },
    { id: 'notes', label: 'Notas', icon: '📌' },
    { id: 'exercises', label: 'Exercícios', icon: '🏋️' },
    { id: 'ai', label: 'IA Assistente', icon: '🤖' }
  ];
  
  return (
    <div className={`ai-tools-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="tools-header">
        <h3>Ferramentas Terapêuticas</h3>
        <button 
          className="toggle-minimize"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '↓' : '↑'}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <div className="tools-tabs">
            {tools.map(tool => (
              <button
                key={tool.id}
                className={`tool-tab ${activeTab === tool.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tool.id)}
              >
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-label">{tool.label}</span>
              </button>
            ))}
          </div>
          
          <div className="tool-content">
            {activeTab === 'transcription' && (
              <div className="transcription-tool">
                <h4>Transcrição da Sessão</h4>
                <div className="transcription-container">
                  <p className="placeholder-text">
                    A transcrição será exibida aqui durante a sessão...
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="notes-tool">
                <h4>Notas da Sessão</h4>
                <textarea 
                  className="notes-input"
                  placeholder="Adicione suas notas aqui..."
                  rows={6}
                />
                <button className="save-button">Salvar Notas</button>
              </div>
            )}
            
            {activeTab === 'exercises' && (
              <div className="exercises-tool">
                <h4>Exercícios Terapêuticos</h4>
                <ul className="exercise-list">
                  <li className="exercise-item">
                    <span className="exercise-title">Exercício de Respiração</span>
                    <button className="assign-exercise">Atribuir</button>
                  </li>
                  <li className="exercise-item">
                    <span className="exercise-title">Mindfulness Guiado</span>
                    <button className="assign-exercise">Atribuir</button>
                  </li>
                  <li className="exercise-item">
                    <span className="exercise-title">Diário de Gratidão</span>
                    <button className="assign-exercise">Atribuir</button>
                  </li>
                </ul>
              </div>
            )}
            
            {activeTab === 'ai' && (
              <div className="ai-assistant-tool">
                <h4>Assistente IA</h4>
                <div className="ai-chat">
                  <div className="ai-messages">
                    <div className="ai-message system">
                      Como posso ajudar na sessão de hoje?
                    </div>
                  </div>
                  <div className="ai-input-container">
                    <input 
                      type="text" 
                      className="ai-input"
                      placeholder="Digite sua pergunta..."
                    />
                    <button className="ai-send">Enviar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

AIToolsContainer.propTypes = {
  sessionId: PropTypes.string.isRequired,
  isHost: PropTypes.bool
};

AIToolsContainer.defaultProps = {
  isHost: false
};

export default AIToolsContainer; 