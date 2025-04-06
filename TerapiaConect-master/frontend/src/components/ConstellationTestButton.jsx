import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ConstellationField/ConstellationField.css';

/**
 * Botão para acessar o teste do Campo de Constelação Familiar
 * Este componente deve ser importado e adicionado ao dashboard do terapeuta
 */
const ConstellationTestButton = () => {
  const navigate = useNavigate();

  const goToConstellationTest = () => {
    navigate('/teste-constelacao');
  };

  return (
    <div className="constellation-test-button">
      <button 
        className="btn-constellation-test" 
        onClick={goToConstellationTest}
      >
        <div className="btn-icon">
          <i className="fa-solid fa-compass"></i>
        </div>
        <div className="btn-content">
          <div className="btn-title">Campo de Constelação</div>
          <div className="btn-description">Testar a nova ferramenta de Constelação Familiar</div>
        </div>
      </button>
    </div>
  );
};

export default ConstellationTestButton; 