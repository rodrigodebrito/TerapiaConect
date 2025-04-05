import React from 'react';
import PropTypes from 'prop-types';
import './Loader.css';

/**
 * Componente de carregamento que pode ser usado em toda a aplicação
 */
const Loader = ({ size = 'medium', text = 'Carregando...', fullScreen = false }) => {
  const loaderContent = (
    <>
      <div className={`loader-spinner spinner-${size}`}>
        <div className="spinner"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </>
  );

  if (fullScreen) {
    return (
      <div className="loader-full-screen">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="loader-container">
      {loaderContent}
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool
};

export default Loader; 