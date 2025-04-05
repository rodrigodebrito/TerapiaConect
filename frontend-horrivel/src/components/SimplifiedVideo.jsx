import React, { useEffect, useRef, useState } from 'react';
import './SimplifiedVideo.css';

/**
 * Componente de vídeo simplificado que usa a API do Daily.co
 * Esta versão evita problemas com múltiplas instâncias e conflitos de câmera
 */
const SimplifiedVideo = ({ roomName, userName, onDailyReference = () => {} }) => {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [clientId] = useState(`client_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
  const dailyObjRef = useRef(null);
  
  // Inicializar iframe e API Daily.co
  useEffect(() => {
    console.log('SimplifiedVideo - Inicializando com sala:', roomName);
    
    // Limpar qualquer iframe existente para evitar duplicação
    const existingIframe = document.querySelector('iframe[src*="daily.co"]');
    if (existingIframe && existingIframe.parentNode) {
      try {
        console.log('Removendo iframe existente do Daily.co');
        existingIframe.parentNode.removeChild(existingIframe);
      } catch (e) {
        console.warn('Erro ao remover iframe existente:', e);
      }
    }
    
    try {
      // Sanitizar o nome da sala para garantir formato válido (apenas letras, números, hífens)
      const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9-]/g, '-');
      
      // Criar iframe Daily.co
      const iframe = document.createElement('iframe');
      iframe.setAttribute('allow', 'camera; microphone; fullscreen; speaker; display-capture');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      
      // URL da sala Daily.co com parâmetros adicionais
      const dailyUrl = `https://terapiaconect.daily.co/${sanitizedRoomName}?showLeaveButton=true&showFullscreenButton=true&userName=${encodeURIComponent(userName)}`;
      
      iframe.src = dailyUrl;
      
      // Adicionar ao DOM
      if (containerRef.current) {
        containerRef.current.appendChild(iframe);
        iframeRef.current = iframe;
        console.log('Iframe Daily.co adicionado ao DOM');
        
        // Configurar evento para detectar quando o iframe estiver carregado
        iframe.onload = () => {
          console.log('Iframe Daily.co carregado com sucesso');
          setIsLoaded(true);
          
          // Tentar criar objeto Daily.co depois que o iframe estiver carregado
          setTimeout(createSimulatedDailyObject, 2000);
        };
      }
    } catch (err) {
      console.error('Erro ao criar iframe Daily.co:', err);
      setError(`Erro ao inicializar chamada: ${err.message}`);
    }
    
    // Limpar ao desmontar
    return () => {
      try {
        // Se temos referência ao iframe, remover do DOM
        if (iframeRef.current && iframeRef.current.parentNode) {
          iframeRef.current.parentNode.removeChild(iframeRef.current);
          console.log('Iframe Daily.co removido do DOM');
        }
        
        // Limpar objeto simulado
        if (dailyObjRef.current) {
          // Se o objeto tiver método destroy, chamá-lo
          if (dailyObjRef.current.destroy && typeof dailyObjRef.current.destroy === 'function') {
            dailyObjRef.current.destroy();
          }
          
          dailyObjRef.current = null;
        }
      } catch (err) {
        console.error('Erro durante limpeza do componente:', err);
      }
    };
  }, [roomName, userName]);
  
  // Criar objeto simulado do Daily.co para comunicação
  const createSimulatedDailyObject = () => {
    try {
      console.log('Criando objeto simulado do Daily.co');
      
      // Verificar primeiro se o objeto já existe na window global
      if (window.dailyCall) {
        console.log('Objeto Daily.co já existe na window global, reutilizando');
        dailyObjRef.current = window.dailyCall;
        onDailyReference(window.dailyCall);
        return;
      }
      
      // Criar objeto simulado
      const simulatedDailyObj = {
        // Propriedades
        meetingState: 'joined-meeting',
        participants: {},
        
        // Métodos
        on: function(eventName, callback) {
          console.log(`Daily.co simulado: registrando listener para ${eventName}`);
          window.addEventListener(`daily-${eventName}`, (event) => {
            if (callback && typeof callback === 'function') {
              callback(event.detail);
            }
          });
          return this; // Para encadeamento
        },
        
        off: function(eventName) {
          console.log(`Daily.co simulado: removendo listener para ${eventName}`);
          // Note: não podemos remover listeners específicos desta forma
          // Esta é uma limitação da simulação
          return this;
        },
        
        sendAppMessage: function(data, to = '*') {
          console.log(`Daily.co simulado: enviando mensagem para ${to}`, data);
          
          // Disparar evento para que outros componentes possam ouvir
          const event = new CustomEvent('daily-app-message', {
            detail: {
              data: data,
              from: clientId,
              to: to
            }
          });
          window.dispatchEvent(event);
          
          // Também armazenar em localStorage para comunicação entre abas
          try {
            localStorage.setItem('daily-message', JSON.stringify({
              data,
              timestamp: Date.now(),
              clientId
            }));
          } catch (e) {
            console.warn('Erro ao armazenar mensagem no localStorage:', e);
          }
        },
        
        setLocalAudio: function(enabled) {
          console.log(`Daily.co simulado: ${enabled ? 'ativando' : 'desativando'} áudio local`);
          // Se temos acesso ao iframe, podemos tentar enviar mensagem
          if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
              iframeRef.current.contentWindow.postMessage({
                action: 'setLocalAudio',
                enabled
              }, '*');
            } catch (e) {
              console.warn('Erro ao enviar mensagem para iframe:', e);
            }
          }
          return true;
        },
        
        setLocalVideo: function(enabled) {
          console.log(`Daily.co simulado: ${enabled ? 'ativando' : 'desativando'} vídeo local`);
          // Se temos acesso ao iframe, podemos tentar enviar mensagem
          if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
              iframeRef.current.contentWindow.postMessage({
                action: 'setLocalVideo',
                enabled
              }, '*');
            } catch (e) {
              console.warn('Erro ao enviar mensagem para iframe:', e);
            }
          }
          return true;
        },
        
        destroy: function() {
          console.log('Daily.co simulado: destruindo');
          // Talvez remover listeners globais
        }
      };
      
      // Armazenar referência
      dailyObjRef.current = simulatedDailyObj;
      
      // Configurar listener para mensagens do localStorage
      const handleStorageChange = (e) => {
        if (e.key === 'daily-message') {
          try {
            const message = JSON.parse(e.newValue);
            if (message && message.clientId !== clientId) {
              // Disparar evento para simulação
              const event = new CustomEvent('daily-app-message', {
                detail: {
                  data: message.data,
                  from: message.clientId,
                  to: '*' // Simulando broadcast
                }
              });
              window.dispatchEvent(event);
            }
          } catch (err) {
            console.warn('Erro ao processar mensagem do localStorage:', err);
          }
        }
      };
      
      // Registrar para eventos de storage
      window.addEventListener('storage', handleStorageChange);
      
      // Configurar listener para mensagens de outros componentes
      const handleMessageEvent = (event) => {
        // Verificar origem e tipo de mensagem
        if (event.data && typeof event.data === 'object' && event.data.type) {
          console.log('Mensagem recebida para Daily.co simulado:', event.data);
          
          // Disparar evento interno simulando evento Daily.co
          const internalEvent = new CustomEvent('daily-app-message', {
            detail: {
              data: event.data,
              from: event.data.clientId || 'unknown',
              to: '*'
            }
          });
          window.dispatchEvent(internalEvent);
        }
      };
      
      // Registrar para mensagens window
      window.addEventListener('message', handleMessageEvent);
      
      // Disponibilizar globalmente
      window.dailyCall = simulatedDailyObj;
      
      // Notificar componente pai
      onDailyReference(simulatedDailyObj);
      
      console.log('Objeto simulado do Daily.co criado e configurado com sucesso');
      
      // Função de limpeza para o useEffect
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message', handleMessageEvent);
      };
    } catch (err) {
      console.error('Erro ao criar objeto simulado Daily.co:', err);
    }
  };
  
  return (
    <div 
      className="simplified-video-container" 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {!isLoaded && !error && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Conectando à videochamada...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <h3>Erro ao iniciar videochamada</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default SimplifiedVideo;
