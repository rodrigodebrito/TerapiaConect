import React from 'react';
import PropTypes from 'prop-types';

const ToolsMenu = ({ tools, activeTool, onToolClick }) => {
  return (
    <div className="tools-menu">
      <h3 className="tools-title">Ferramentas</h3>
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolClick(tool.id)}
        >
          <span className="tool-icon">{tool.icon}</span>
          <span className="tool-name">{tool.name}</span>
        </button>
      ))}
    </div>
  );
};

ToolsMenu.propTypes = {
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeTool: PropTypes.string,
  onToolClick: PropTypes.func.isRequired,
};

export default ToolsMenu; 