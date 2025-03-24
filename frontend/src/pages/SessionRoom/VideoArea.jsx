import React, { useEffect, useRef } from 'react';
import { useSession } from '../../contexts/SessionContext';

const VideoArea = () => {
  const { session } = useSession();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Simulação inicial - futuramente será implementada a videoconferência real
  useEffect(() => {
    // Aqui será integrado o código de inicialização da videoconferência
    console.log('Inicializando área de vídeo para a sessão:', session?.id);
  }, [session]);

  return (
    <div className="video-area">
      <div className="video-container">
        <div className="video-stream local-stream" ref={localVideoRef}>
          <div className="video-placeholder">
            <p>Sua câmera</p>
          </div>
        </div>
        <div className="video-stream remote-stream" ref={remoteVideoRef}>
          <div className="video-placeholder">
            <p>Câmera do participante</p>
          </div>
        </div>
        <div className="video-controls">
          <button className="video-button">
            <span role="img" aria-label="Microfone">🎤</span>
          </button>
          <button className="video-button">
            <span role="img" aria-label="Câmera">📹</span>
          </button>
          <button className="video-button">
            <span role="img" aria-label="Compartilhar tela">📺</span>
          </button>
          <button className="video-button end-call">
            <span role="img" aria-label="Encerrar">❌</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoArea; 