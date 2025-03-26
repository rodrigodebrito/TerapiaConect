import React from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import './AITools.css';

const AITools = ({ onAnalyze, onSuggest, onReport, isProcessing }) => {
  const { 
    isListening, 
    startListening, 
    stopListening, 
    transcript, 
    emotions, 
    localProcessing, 
    anonymization,
    toggleLocalProcessing,
    toggleAnonymization,
    isCompatible
  } = useAI();

  // Função para renderizar o painel de emoções detectadas
  const renderEmotionPanel = () => {
    if (!emotions || Object.keys(emotions).length === 0) {
      return (
        <div className="no-emotions">
          Nenhuma emoção detectada ainda
        </div>
      );
    }

    // Definição de cores para cada emoção
    const emotionColors = {
      happiness: '#4CAF50', // Verde
      sadness: '#2196F3',   // Azul
      anger: '#F44336',     // Vermelho
      fear: '#9C27B0',      // Roxo
      surprise: '#FF9800',  // Laranja
      disgust: '#795548'    // Marrom
    };

    // Tradução dos nomes das emoções para português
    const emotionNames = {
      happiness: 'Felicidade',
      sadness: 'Tristeza',
      anger: 'Raiva',
      fear: 'Medo',
      surprise: 'Surpresa',
      disgust: 'Nojo'
    };

    // Encontrar a emoção mais presente
    const mostPresent = Object.entries(emotions).reduce(
      (max, [emotion, count]) => count > max.count ? { emotion, count } : max,
      { emotion: '', count: 0 }
    );

    return (
      <div className="emotion-panel">
        <div className="primary-emotion" style={{ 
          backgroundColor: emotionColors[mostPresent.emotion] || '#888'
        }}>
          <span className="emotion-name">{emotionNames[mostPresent.emotion] || mostPresent.emotion}</span>
          <span className="emotion-count">{mostPresent.count}</span>
        </div>
        <div className="other-emotions">
          {Object.entries(emotions)
            .filter(([emotion]) => emotion !== mostPresent.emotion)
            .sort((a, b) => b[1] - a[1])
            .map(([emotion, count]) => (
              <div 
                key={emotion} 
                className="emotion-badge"
                style={{ backgroundColor: emotionColors[emotion] || '#888' }}
              >
                {emotionNames[emotion] || emotion}: {count}
              </div>
            ))
          }
        </div>
      </div>
    );
  };

  return (
    <div className="ai-tools-container">
      <div className="jitsi-control-bar">
        <button 
          className="jitsi-control-button"
          onClick={onAnalyze}
          disabled={isProcessing}
          title="Análise da Sessão"
        >
          🧠
        </button>
        <button 
          className="jitsi-control-button"
          onClick={onSuggest}
          disabled={isProcessing}
          title="Sugestões"
        >
          💡
        </button>
        <button 
          className="jitsi-control-button"
          onClick={onReport}
          disabled={isProcessing}
          title="Relatório"
        >
          📝
        </button>
        <button 
          className="jitsi-control-button"
          onClick={() => isListening ? stopListening() : startListening()}
          disabled={!isCompatible() || isProcessing}
          title={isListening ? "Parar Transcrição" : "Iniciar Transcrição"}
        >
          {isListening ? '🎙️' : '🔇'}
        </button>
        <button 
          className="jitsi-control-button"
          onClick={() => {
            const panel = document.querySelector('.emotion-container');
            if (panel) {
              panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
          }}
          title="Emoções Detectadas"
        >
          😊
        </button>
        <button 
          className="jitsi-control-button"
          onClick={() => {
            const panel = document.querySelector('.settings-container');
            if (panel) {
              panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
          }}
          title="Configurações"
        >
          ⚙️
        </button>
      </div>
      
      <div className="emotion-container" style={{ display: 'none' }}>
        <h3>Emoções Detectadas</h3>
        {renderEmotionPanel()}
      </div>
      
      <div className="settings-container" style={{ display: 'none' }}>
        <h3>Configurações de IA</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={localProcessing} 
              onChange={toggleLocalProcessing}
            />
            Processamento Local
          </label>
          <p className="setting-description">
            Executa análise básica no navegador para melhor privacidade e resposta
          </p>
        </div>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={anonymization} 
              onChange={toggleAnonymization}
            />
            Anonimização de Dados
          </label>
          <p className="setting-description">
            Remove informações pessoais antes do envio para o servidor
          </p>
        </div>
      </div>
    </div>
  );
};

AITools.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  onSuggest: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool
};

AITools.defaultProps = {
  isProcessing: false
};

export default AITools; 