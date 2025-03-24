import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import VideoArea from './VideoArea';
import ToolsMenu from './ToolsMenu';
import ActiveTools from './ActiveTools';
import { SessionProvider } from '../../contexts/SessionContext';
import { AIProvider } from '../../contexts/AIContext';
import '../SessionRoom.css';

const SessionRoom = () => {
  const { sessionId } = useParams();
  const [activeTool, setActiveTool] = useState(null);
  const [isFieldActive, setIsFieldActive] = useState(false);
  const [isVideoFloating, setIsVideoFloating] = useState(false);

  const tools = [
    {
      id: 'constellation',
      name: 'Campo de Constelação',
      icon: '🌟'
    },
    {
      id: 'ai',
      name: 'Assistente IA',
      icon: '🤖'
    }
  ];

  // Função para alternar a ferramenta ativa
  const handleToolClick = (toolId) => {
    // Se já está ativo, desative
    if (activeTool === toolId) {
      setActiveTool(null);
      
      // Se estamos desativando o campo, restaure o vídeo
      if (toolId === 'constellation') {
        setIsFieldActive(false);
        setIsVideoFloating(false);
      }
      return;
    }
    
    // Ativando uma ferramenta
    setActiveTool(toolId);
    
    // Se estamos ativando o campo, transforme o vídeo em flutuante
    if (toolId === 'constellation') {
      setIsFieldActive(true);
      setIsVideoFloating(true);
    } else {
      // Para outras ferramentas, volte ao normal
      setIsFieldActive(false);
      setIsVideoFloating(false);
    }
  };

  return (
    <SessionProvider sessionId={sessionId}>
      <AIProvider>
        <div className="session-room">
          <VideoArea isFloating={isVideoFloating} />
          <ToolsMenu 
            tools={tools} 
            activeTool={activeTool} 
            onToolClick={handleToolClick} 
          />
          <ActiveTools 
            activeTool={activeTool} 
            isFieldActive={isFieldActive} 
          />
        </div>
      </AIProvider>
    </SessionProvider>
  );
};

export default SessionRoom; 