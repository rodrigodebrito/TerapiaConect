import React from 'react';

/**
 * Componente de spinner de carregamento
 * Usado para indicar que uma operação está em andamento
 */
const LoadingSpinner = ({ size = 'medium', text = 'Carregando...' }) => {
  // Definir tamanhos do spinner baseados no parâmetro size
  const spinnerSizes = {
    small: {
      width: '30px',
      height: '30px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderTop: '3px solid #007bff'
    },
    medium: {
      width: '50px',
      height: '50px',
      border: '5px solid rgba(255, 255, 255, 0.3)',
      borderTop: '5px solid #007bff'
    },
    large: {
      width: '80px',
      height: '80px',
      border: '6px solid rgba(255, 255, 255, 0.3)',
      borderTop: '6px solid #007bff'
    }
  };

  const selectedSize = spinnerSizes[size] || spinnerSizes.medium;

  return (
    <div 
      className="loading-spinner-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        height: '100%',
        width: '100%'
      }}
    >
      <div 
        className="spinner"
        style={{
          ...selectedSize,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}
      />
      {text && (
        <p 
          className="spinner-text"
          style={{
            color: '#666',
            fontSize: size === 'large' ? '18px' : '14px',
            margin: 0
          }}
        >
          {text}
        </p>
      )}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner; 