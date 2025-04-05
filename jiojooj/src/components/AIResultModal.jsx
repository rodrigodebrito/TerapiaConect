import React from 'react';
import PropTypes from 'prop-types';
import './AIResultModal.css';

const AIResultModal = ({ isOpen, onClose, title, content, type }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'analysis':
        return '🔍';
      case 'suggestions':
        return '💡';
      case 'report':
        return '📝';
      default:
        return '📊';
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={e => e.stopPropagation()}>
        <div className="ai-modal-header">
          <span className="ai-modal-icon">{getIcon()}</span>
          <h2>{title}</h2>
          <button className="ai-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ai-modal-body">
          {content && typeof content === 'string' ? (
            content.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))
          ) : (
            <p>Nenhum conteúdo disponível</p>
          )}
        </div>
      </div>
    </div>
  );
};

AIResultModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string,
  type: PropTypes.oneOf(['analysis', 'suggestions', 'report']).isRequired
};

export default AIResultModal; 