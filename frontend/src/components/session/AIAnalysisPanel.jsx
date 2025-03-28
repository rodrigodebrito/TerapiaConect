import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import SessionAnalysis from './SessionAnalysis.jsx';
import './AIAnalysisPanel.css';

/**
 * Componente de painel de análise AI para integração na sala de sessão
 * @param {Object} props - Props do componente
 * @param {string} props.sessionId - ID da sessão
 * @param {string} props.transcript - Transcrição da sessão
 * @param {Function} props.onClose - Função chamada ao fechar o painel
 */
const AIAnalysisPanel = ({ sessionId, transcript, onClose }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Resetar estado quando a sessão mudar
  useEffect(() => {
    setShowAnalysis(false);
    setAnalysis(null);
    setIsMinimized(false);
  }, [sessionId]);

  // Callback quando a análise for concluída
  const handleAnalysisComplete = (result) => {
    setAnalysis(result);
  };

  // Alternar estado minimizado
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`ai-analysis-panel ${isMinimized ? 'minimized' : ''}`}>
      <Card className="panel-card">
        <Card.Header className="panel-header">
          <div className="panel-title">Assistente IA</div>
          <div className="panel-controls">
            <Button 
              variant="link" 
              className="minimize-button" 
              onClick={toggleMinimize}
            >
              {isMinimized ? 'Expandir' : 'Minimizar'}
            </Button>
            <Button 
              variant="link" 
              className="close-button" 
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body className={`panel-body ${isMinimized ? 'd-none' : ''}`}>
          {!showAnalysis && !analysis ? (
            <div className="analysis-prompt">
              <p>O assistente de IA pode analisar esta sessão e fornecer insights terapêuticos.</p>
              <Button 
                variant="primary" 
                onClick={() => setShowAnalysis(true)}
                className="start-analysis-button"
              >
                Iniciar Análise
              </Button>
            </div>
          ) : (
            <SessionAnalysis 
              sessionId={sessionId}
              transcript={transcript}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AIAnalysisPanel; 