import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DailyIframe from '@daily-co/daily-js';
import { toast } from 'react-toastify';
import './styles.css';

// Componente FallbackMeeting usando forwardRef para expor métodos via ref
const FallbackMeeting = forwardRef((props, ref) => {
  const {
    roomName,
    userName = 'Usuário',
    audioEnabled = true,
    videoEnabled = true,
    floating = false,
    onPipModeChange,
    onDailyReference
  } = props;

  const [call, setCall] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Referências
  const callContainerRef = useRef(null);
  const callRef = useRef(null);
  const isMountedRef = useRef(true);

  // Expor métodos via ref
  useImperativeHandle(ref, () => ({
    // Método para obter a referência ao objeto Daily.co
    getDailyCall: () => {
      if (callRef.current) {
        console.log('✅ Daily.co API object disponível e retornado via getDailyCall');
        return callRef.current;
      } else {
        console.warn('⚠️ Daily.co API object ainda não disponível via getDailyCall');
        return null;
      }
    },
    // Método para forçar criação do objeto Daily.co se ainda não existir
    ensureDailyCall: async () => {
      if (callRef.current) {
        console.log('✅ Daily.co API object já existe');
        return callRef.current;
      }
      
      try {
        console.log('🔄 Criando objeto Daily.co sob demanda...');
        
        // Verificar se o container está disponível
        if (!callContainerRef.current) {
          console.error('❌ Container para o Daily.co não está disponível');
          return null;
        }
        
        // Construir a URL da sala
        const roomUrl = `https://terapiaconect.daily.co/${roomName}`;
        
        // Criar o objeto de chamada
        const dailyCall = DailyIframe.createFrame(callContainerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '8px'
          },
          showLeaveButton: true,
          showFullscreenButton: true
        });
        
        // Armazenar a referência
        callRef.current = dailyCall;
        
        // Disponibilizar a referência para componentes externos
        if (onDailyReference && typeof onDailyReference === 'function') {
          onDailyReference(dailyCall);
        }
        
        // Configurar listeners básicos
        dailyCall.on('error', (error) => {
          console.error('Erro na chamada Daily.co:', error);
        });
        
        // Entrar na sala
        await dailyCall.join({
          url: roomUrl,
          userName: userName
        });
        
        console.log('✅ Daily.co API object criado e configurado com sucesso');
        return dailyCall;
      } catch (error) {
        console.error('❌ Erro ao criar objeto Daily.co sob demanda:', error);
        return null;
      }
    },
    // Método para definir o modo flutuante
    setFloating: (value) => {
      console.log(`Definindo modo flutuante para: ${value}`);
      if (onPipModeChange) {
        onPipModeChange(value);
      }
    }
  }));

  // Inicializar a chamada
  useEffect(() => {
    console.log(`Inicializando chamada para sala: ${roomName}`);
    
    if (!roomName) {
      setError('Nome da sala não fornecido');
      return;
    }

    // Registrar que o componente foi montado
    if (window.registerMount) {
      window.registerMount('FallbackMeeting');
    }

    // Função para criar e configurar o objeto de chamada
    const setupCall = async () => {
      try {
        // Verificar se já existe um objeto Daily.co para esta sala
        // para evitar duplicação durante renderizações
        const existingDailyInstance = window.dailyInstances ? 
          window.dailyInstances[roomName] : null;
          
        if (existingDailyInstance) {
          console.log('Reutilizando instância existente do Daily.co para esta sala');
          callRef.current = existingDailyInstance;
          
          // Disponibilizar a referência para componentes externos
          if (onDailyReference && typeof onDailyReference === 'function') {
            onDailyReference(existingDailyInstance);
          }
          
          setCall(existingDailyInstance);
          setLoading(false);
          setIsJoined(true);
          return;
        }
        
        // Construir a URL da sala
        const roomUrl = `https://terapiaconect.daily.co/${roomName}`;
        console.log(`Conectando à sala: ${roomUrl}`);

        // Criar o objeto de chamada
        const dailyCall = DailyIframe.createFrame(callContainerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '8px'
          },
          showLeaveButton: true,
          showFullscreenButton: true
        });

        // Armazenar a referência
        callRef.current = dailyCall;
        
        // Armazenar em um objeto global para reutilização se necessário
        if (!window.dailyInstances) window.dailyInstances = {};
        window.dailyInstances[roomName] = dailyCall;
        
        // Disponibilizar a referência para componentes externos
        if (onDailyReference && typeof onDailyReference === 'function') {
          try {
            onDailyReference(dailyCall);
          } catch (refError) {
            console.error('Erro ao enviar referência Daily.co:', refError);
          }
        }

        // Configurar listeners de eventos
        dailyCall.on('joined-meeting', () => {
          console.log('Participante entrou na sala com sucesso');
          setIsJoined(true);
          setLoading(false);
        });

        dailyCall.on('left-meeting', () => {
          console.log('Participante saiu da sala');
          setIsJoined(false);
        });

        dailyCall.on('error', (error) => {
          console.error('Erro na chamada Daily.co:', error);
          setError(`Erro na videochamada: ${error.errorMsg}`);
          toast.error(`Erro na videochamada: ${error.errorMsg}`);
        });

        // Entrar na sala
        const joinOptions = {
          url: roomUrl,
          userName: userName,
          showLeaveButton: true,
          showFullscreenButton: true
        };

        await dailyCall.join(joinOptions);
        setCall(dailyCall);

        // Configurar áudio e vídeo iniciais
        dailyCall.setLocalAudio(audioEnabled);
        dailyCall.setLocalVideo(videoEnabled);

        // Atualizar o estado floating se necessário
        if (floating && onPipModeChange) {
          onPipModeChange(true);
        }
        
        // Exportar o objeto global para debug
        window._dailyAPI = dailyCall;
        console.log('Daily.co API object disponível globalmente como window._dailyAPI');

      } catch (error) {
        console.error('Erro ao configurar chamada:', error);
        setError(`Erro ao iniciar videochamada: ${error.message || 'Erro desconhecido'}`);
        toast.error(`Erro ao iniciar videochamada: ${error.message || 'Erro desconhecido'}`);
        setLoading(false);
      }
    };

    // Tentar configurar com retry automático
    let retryCount = 0;
    const maxRetries = 3;
    
    const trySetupWithRetry = async () => {
      try {
        await setupCall();
      } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`Falha na tentativa ${retryCount}, tentando novamente em ${retryCount * 1000}ms...`);
          setTimeout(trySetupWithRetry, retryCount * 1000);
        } else {
          console.error(`Falha após ${maxRetries} tentativas:`, error);
          setError(`Não foi possível conectar à sala após várias tentativas. (${error.message || 'Erro desconhecido'})`);
          setLoading(false);
        }
      }
    };
    
    trySetupWithRetry();

    // Cleanup ao desmontar
    return () => {
      isMountedRef.current = false;
      
      // Desregistrar que o componente foi desmontado
      if (window.registerUnmount) {
        window.registerUnmount('FallbackMeeting');
      }
      
      if (callRef.current) {
        try {
          console.log('Destruindo objeto de chamada Daily.co...');
          callRef.current.destroy();
          callRef.current = null;
        } catch (error) {
          console.error('Erro ao destruir chamada:', error);
        }
      }
    };
  }, [roomName, userName, audioEnabled, videoEnabled, onDailyReference, onPipModeChange, floating]);

  // Renderizar o componente
  return (
    <div className={`fallback-meeting-container ${floating ? 'floating' : ''}`}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div>Conectando à sala de videochamada...</div>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      <div 
        ref={callContainerRef} 
        className="call-container"
        style={{ display: loading || error ? 'none' : 'block' }}
      ></div>
    </div>
  );
});

FallbackMeeting.propTypes = {
  roomName: PropTypes.string.isRequired,
  userName: PropTypes.string,
  audioEnabled: PropTypes.bool,
  videoEnabled: PropTypes.bool,
  floating: PropTypes.bool,
  onPipModeChange: PropTypes.func,
  onDailyReference: PropTypes.func
};

FallbackMeeting.displayName = 'FallbackMeeting';

export default FallbackMeeting; 