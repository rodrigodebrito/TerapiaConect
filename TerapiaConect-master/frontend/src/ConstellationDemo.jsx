import React from 'react';
import { ConstellationProvider } from './contexts/ConstellationContext';
import ConstellationField from './components/ConstellationField/index';

const ConstellationDemo = () => {
  return (
    <div className="constellation-demo-container" style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <ConstellationProvider>
        <ConstellationField />
      </ConstellationProvider>
    </div>
  );
};

export default ConstellationDemo; 