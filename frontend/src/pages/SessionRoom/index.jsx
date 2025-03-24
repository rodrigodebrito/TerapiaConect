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

  return (
    <SessionProvider sessionId={sessionId}>
      <AIProvider>
        <div className="session-room">
          <VideoArea />
          <ToolsMenu tools={tools} activeTool={activeTool} setActiveTool={setActiveTool} />
          <ActiveTools activeTool={activeTool} />
        </div>
      </AIProvider>
    </SessionProvider>
  );
};

export default SessionRoom; 