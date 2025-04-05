import React, { useState } from 'react';
import ConstellationField3D from './index';
import './demo.css';

const DemoPage = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className={`demo-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="demo-header">
        <h1>Campo de Constelação 3D</h1>
        <button 
          className="demo-button" 
          onClick={toggleFullscreen}
        >
          {isFullscreen ? 'Sair de Tela Cheia' : 'Tela Cheia'}
        </button>
      </div>
      
      <div className="demo-content">
        <div className="field-container">
          <ConstellationField3D />
        </div>
        
        <div className="instructions">
          <h2>Instruções</h2>
          <ul>
            <li><strong>Girar:</strong> Clique e arraste para girar a visualização</li>
            <li><strong>Zoom:</strong> Use a roda do mouse para aproximar/afastar</li>
            <li><strong>Mover:</strong> Clique com o botão direito e arraste para mover o campo</li>
          </ul>
          
          <h2>Sobre o Campo de Constelação</h2>
          <p>
            O Campo de Constelação 3D é uma ferramenta interativa para visualização
            e manipulação de representantes em sessões terapêuticas. Baseado em uma
            bússola tradicional, o campo oferece uma superfície intuitiva para posicionar
            elementos e explorar relações entre eles.
          </p>
          <p>
            <strong>Recursos futuros:</strong>
          </p>
          <ul>
            <li>Adição de representantes</li>
            <li>Sincronização entre participantes</li>
            <li>Salvar e carregar configurações</li>
            <li>Personalização visual</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DemoPage; 