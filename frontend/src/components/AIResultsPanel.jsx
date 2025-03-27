import React, { useEffect, useState } from 'react';
import { useAI } from '../contexts/AIContext';
import './AIResultsPanel.css';

const AIResultsPanel = () => {
  const { lastResult, isProcessing } = useAI();
  const [visible, setVisible] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Listen for changes in lastResult
  useEffect(() => {
    if (lastResult && !isProcessing) {
      console.log('AIResultsPanel: Received result data:', lastResult);
      setResultData(lastResult);
      setVisible(true);
    }
  }, [lastResult, isProcessing]);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible || !resultData) return null;

  console.log('AIResultsPanel: Rendering with data:', resultData);
  
  // Garantir que temos um título apropriado
  const getTitle = () => {
    if (resultData.type === 'analysis') return 'Análise da Sessão';
    if (resultData.type === 'suggestions') return 'Sugestões';
    if (resultData.type === 'report') return 'Relatório da Sessão';
    return 'Resultados da IA';
  };
  
  // Garantir que temos sugestões para exibir
  const getSuggestions = () => {
    if (!resultData.suggestions) return [];
    
    if (Array.isArray(resultData.suggestions)) {
      return resultData.suggestions.length > 0 
        ? resultData.suggestions 
        : ['Não há sugestões específicas para esta conversa no momento.'];
    }
    
    return [resultData.suggestions];
  };
  
  return (
    <div className="ai-results-overlay">
      <div className="ai-results-panel">
        <div className="ai-results-header">
          <h3>{getTitle()}</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="ai-results-content">
          {resultData.error ? (
            <div className="ai-results-error">
              <p>{resultData.error}</p>
              {resultData.message && <p>{resultData.message}</p>}
              
              {/* Mostrar sugestões mesmo se houver erro */}
              {resultData.suggestions && (
                <div className="ai-results-section mt-3">
                  <h4>Sugestões Gerais</h4>
                  <ul>
                    {getSuggestions().map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {resultData.content && (
                <div className="ai-results-section">
                  <p>{resultData.content}</p>
                </div>
              )}
              
              {resultData.analysis && (
                <div className="ai-results-section">
                  <h4>Análise</h4>
                  <p>{resultData.analysis}</p>
                </div>
              )}
              
              {resultData.data && resultData.data.referencedMaterials && resultData.data.referencedMaterials.length > 0 && (
                <div className="ai-results-section">
                  <h4>Materiais de Referência</h4>
                  <div className="referenced-materials">
                    {resultData.data.referencedMaterials.map((material, index) => (
                      <div key={index} className="material-item">
                        <h5>{material.title}</h5>
                        <p className="material-insights">{material.insights}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resultData.suggestions && (
                <div className="ai-results-section">
                  <h4>Sugestões</h4>
                  <ul>
                    {getSuggestions().map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {resultData.data && resultData.data.referencedMaterials && resultData.data.referencedMaterials.length > 0 && (
                <div className="ai-results-section">
                  <h4>Materiais de Referência</h4>
                  <div className="referenced-materials">
                    {resultData.data.referencedMaterials.map((material, index) => (
                      <div key={index} className="material-item">
                        <h5>{material.title}</h5>
                        <p className="material-insights">{material.insights}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resultData.insights && (
                <div className="ai-results-section">
                  <h4>Insights</h4>
                  <p>{resultData.insights}</p>
                </div>
              )}
              
              {/* Exibir seção padrão se não houver nenhum conteúdo */}
              {!resultData.content && !resultData.analysis && 
               !resultData.suggestions && !resultData.insights && (
                <div className="ai-results-section">
                  <p>Não foi possível gerar conteúdo específico para esta sessão.</p>
                  <p>Sugestões gerais:</p>
                  <ul>
                    <li>Mantenha uma comunicação clara e empática</li>
                    <li>Observe as reações e sinais não-verbais do paciente</li>
                    <li>Faça perguntas abertas para explorar sentimentos</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="ai-results-footer">
          <button className="ai-results-button" onClick={handleClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default AIResultsPanel; 