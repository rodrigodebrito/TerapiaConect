import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AIInsights.css';

const AIInsights = ({ sessionId, isTherapist }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promptInput, setPromptInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (sessionId) {
      fetchInsights();
    }
  }, [sessionId]);
  
  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/ai/insights/session/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setInsights(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar insights:', error);
      if (error.response && error.response.status === 403) {
        setError('Você não tem permissão para ver os insights desta sessão.');
      } else {
        setError('Erro ao carregar insights. Tente novamente mais tarde.');
      }
      setLoading(false);
    }
  };
  
  const handleRequestInsight = async (e) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await axios.post(`/api/ai/insights/session/${sessionId}`, {
        prompt: promptInput
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Adicionar o novo insight ao estado
      setInsights(prev => [response.data, ...prev]);
      setPromptInput('');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Erro ao solicitar insight:', error);
      setIsSubmitting(false);
    }
  };
  
  const handleGenerateSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/ai/summary/session/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      alert('Resumo da sessão gerado com sucesso!');
      console.log(response.data);
      // Aqui você poderia mostrar o resumo em um modal ou em outra área da interface
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      setLoading(false);
      alert('Erro ao gerar resumo. Tente novamente mais tarde.');
    }
  };
  
  return (
    <div className="ai-insights">
      <div className="ai-insights-header">
        <h3>Insights da IA</h3>
        {isTherapist && (
          <div className="therapist-controls">
            <button 
              onClick={handleGenerateSummary}
              className="generate-summary-btn"
              disabled={loading}
            >
              Gerar Resumo
            </button>
          </div>
        )}
      </div>
      
      {isTherapist && (
        <form onSubmit={handleRequestInsight} className="prompt-form">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Solicite uma análise específica..."
            className="prompt-input"
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            className="request-insight-btn"
            disabled={isSubmitting || !promptInput.trim()}
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Insight'}
          </button>
        </form>
      )}
      
      <div className="insights-container">
        {loading ? (
          <div className="loading">Carregando insights...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : insights.length === 0 ? (
          <div className="no-insights">
            {isTherapist 
              ? 'Nenhum insight gerado ainda. Solicite uma análise ou aguarde a geração automática durante a sessão.'
              : 'Nenhum insight disponível para esta sessão.'}
          </div>
        ) : (
          insights.map((insight, index) => (
            <div key={index} className="insight-card">
              <div className="insight-header">
                <span className="insight-type">{insight.type}</span>
                <span className="insight-time">
                  {new Date(insight.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="insight-content">{insight.content}</div>
              {insight.keywords && (
                <div className="insight-keywords">
                  {insight.keywords.split(',').map((keyword, idx) => (
                    <span key={idx} className="keyword">{keyword.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIInsights; 