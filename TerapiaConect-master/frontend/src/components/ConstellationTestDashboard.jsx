import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConstellationField/ConstellationField.css';

/**
 * Dashboard flutuante para testar o Campo de Constelação
 * Este componente pode ser adicionado a qualquer página
 */
const ConstellationTestDashboard = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const goToConstellationTest = () => {
    navigate('/teste-constelacao');
  };

  return (
    <div className={`floating-constellation-dashboard ${isExpanded ? 'expanded' : ''}`}>
      <div className="dashboard-header" onClick={toggleExpand}>
        <div className="header-icon">
          <i className="fa-solid fa-compass"></i>
        </div>
        <div className="header-title">Ferramentas de Constelação</div>
        <div className="toggle-icon">
          <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
        </div>
      </div>

      {isExpanded && (
        <div className="dashboard-content">
          <div className="dashboard-description">
            Acesse o campo de constelação familiar para testar a nova ferramenta terapêutica.
          </div>
          
          <div className="dashboard-options">
            <button 
              className="option-btn test-btn" 
              onClick={goToConstellationTest}
            >
              <i className="fa-solid fa-vr-cardboard"></i>
              Testar Campo 3D
            </button>
            
            <button className="option-btn config-btn">
              <i className="fa-solid fa-gear"></i>
              Configurar
            </button>
          </div>
          
          <div className="dashboard-footer">
            <div className="status-badge">
              <span className="status-dot"></span>
              Em desenvolvimento
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstellationTestDashboard; 