import React, { useState, useEffect } from 'react';
import './ConstellationField3D.css';

/**
 * Versão simplificada do campo de constelação para fins de teste.
 * Renderiza apenas uma tela azul com algumas informações básicas.
 */
const ConstellationField3D = ({ sessionId, isHost, isActive, debug }) => {
  const [timestamp] = useState(Date.now());
  
  useEffect(() => {
    console.log('ConstellationField3D montado com props:', { 
      sessionId, isHost, isActive, debug, timestamp 
    });
    
    // Registrar que o campo foi montado
    window.dispatchEvent(new CustomEvent('constellation-mounted', {
      detail: { sessionId, timestamp }
    }));
    
    return () => {
      console.log('ConstellationField3D desmontado');
    };
  }, [sessionId, isHost, isActive, debug, timestamp]);
  
  return (
    <div className="constellation-field-3d-container visible" style={{
      display: 'block', 
      visibility: 'visible', 
      opacity: 1, 
      zIndex: 999,
      backgroundColor: '#1a4a7e',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%'
      }}>
        <h2>Campo de Constelação</h2>
        <p>Sessão: {sessionId}</p>
        <p>Modo: {isHost ? 'Terapeuta' : 'Cliente'}</p>
        <p>Status: {isActive ? 'Ativo' : 'Inativo'}</p>
        <p>ID: {timestamp}</p>
      </div>
      
      {/* Fundo com círculos para simular o campo */}
      <div className="background-circles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i}
            className="circle"
            style={{
              position: 'absolute',
              width: `${20 + Math.random() * 50}px`,
              height: `${20 + Math.random() * 50}px`,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s infinite linear`
            }}
          />
        ))}
      </div>
      
      {/* Rosa dos ventos simplificada */}
      <div className="compass-rose" style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '100px',
        height: '100px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '24px' }}>N</div>
        <div style={{ 
          position: 'absolute',
          top: 0,
          width: '1px',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.5)'
        }}></div>
        <div style={{ 
          position: 'absolute',
          left: 0,
          width: '100%',
          height: '1px',
          background: 'rgba(255, 255, 255, 0.5)'
        }}></div>
      </div>
    </div>
  );
};

export default ConstellationField3D; 