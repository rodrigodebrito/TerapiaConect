import React, { useState } from 'react';
import './ConstellationField.css';

/**
 * Componente para adicionar o Campo de Constelação como uma ferramenta terapêutica.
 * Este componente será integrado à página de ferramentas do terapeuta.
 */
const ConstellationToolConfig = ({ onSave, existingTool = null }) => {
  const [toolName, setToolName] = useState(existingTool?.name || 'Constelação Familiar');
  const [toolDescription, setToolDescription] = useState(
    existingTool?.description || 
    'Técnica terapêutica que trabalha com as dinâmicas familiares e sistêmicas'
  );
  const [toolDuration, setToolDuration] = useState(existingTool?.duration || 90);
  const [toolPrice, setToolPrice] = useState(existingTool?.price || 350);
  
  const handleSave = () => {
    const toolData = {
      name: toolName,
      description: toolDescription,
      duration: parseInt(toolDuration),
      price: parseFloat(toolPrice),
      type: 'constellation',
      icon: 'fa-solid fa-compass',
      // Metadados específicos para a ferramenta de constelação
      metadata: {
        hasRepresentatives: true,
        allowClientInteraction: true,
        defaultRepresentativeNames: [
          'Cliente', 
          'Mãe', 
          'Pai', 
          'Criança interna', 
          'Passado', 
          'Futuro'
        ]
      }
    };
    
    onSave(toolData);
  };
  
  return (
    <div className="constellation-tool-config">
      <h2>Configurar Ferramenta de Constelação</h2>
      
      <div className="tool-preview">
        <div className="tool-icon">
          <i className="fa-solid fa-compass"></i>
        </div>
        <div className="tool-preview-info">
          <h3>Prévia</h3>
          <div className="preview-name">{toolName}</div>
          <div className="preview-description">{toolDescription}</div>
          <div className="preview-details">
            <span className="preview-duration">{toolDuration} minutos</span>
            <span className="preview-price">R$ {toolPrice}</span>
          </div>
        </div>
      </div>
      
      <div className="tool-form">
        <div className="form-group">
          <label htmlFor="tool-name">Nome da Ferramenta</label>
          <input
            id="tool-name"
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            placeholder="Ex: Constelação Familiar"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tool-description">Descrição</label>
          <textarea
            id="tool-description"
            value={toolDescription}
            onChange={(e) => setToolDescription(e.target.value)}
            placeholder="Descreva a ferramenta..."
            rows={3}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tool-duration">Duração (minutos)</label>
            <input
              id="tool-duration"
              type="number"
              value={toolDuration}
              onChange={(e) => setToolDuration(e.target.value)}
              min={30}
              step={10}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tool-price">Preço (R$)</label>
            <input
              id="tool-price"
              type="number"
              value={toolPrice}
              onChange={(e) => setToolPrice(e.target.value)}
              min={0}
              step={10}
            />
          </div>
        </div>
        
        <div className="form-info">
          <i className="fa-solid fa-info-circle"></i>
          <p>
            Esta ferramenta permitirá utilizar o Campo de Constelação durante as sessões.
            Ela inclui colaboração em tempo real e pode ser integrada com chamadas de vídeo.
          </p>
        </div>
        
        <div className="form-actions">
          <button className="btn-cancel">Cancelar</button>
          <button className="btn-save" onClick={handleSave}>
            {existingTool ? 'Atualizar Ferramenta' : 'Adicionar Ferramenta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConstellationToolConfig; 