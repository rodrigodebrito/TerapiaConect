import React, { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAI } from '../contexts/AIContext';
import { toast } from 'react-toastify';
import './FallbackMeeting.css';
import './AITools.css';

const FallbackMeeting = ({
  roomName,
  userName,
  audioEnabled = true,
  videoEnabled = true,
  floating = false,
  onPipModeChange = () => {},
}) => {
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const iframeRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  const aiButtonsCreatedRef = useRef(false);
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [isJitsiScriptLoaded, setIsJitsiScriptLoaded] = useState(false);
  const [isJitsiMounted, setIsJitsiMounted] = useState(false);
  const { analyze, suggest, report, isProcessing, emotions, startListening, stopListening, isListening, transcript } = useAI();

  // Extrair o sessionId do roomName ou URL
  const getSessionId = useCallback(() => {
    // Primeiro, tentar obter da URL
    if (window && window.location && window.location.pathname) {
      const path = window.location.pathname;
      const matches = path.match(/\/session\/([^\/]+)/);
      if (matches && matches[1]) {
        console.log("SessionId extraído da URL:", matches[1]);
        return matches[1];
      }
    }
    
    // Tentar obter do roomName
    if (!roomName) return null;
    
    // Tenta extrair o sessionId do formato room-123456
    const parts = roomName.split('-');
    if (parts.length > 1) {
      console.log("SessionId extraído do roomName:", parts[1]);
      return parts[1];
    }
    
    console.log("Usando roomName como sessionId:", roomName);
    return roomName;
  }, [roomName]);

  // Prevenir re-renderizações desnecessárias usando useCallback
  const handleAnalyze = useCallback(() => {
    const sessionId = getSessionId();
    if (sessionId) {
      console.log("Chamando análise com sessionId:", sessionId);
      analyze(sessionId);
    } else {
      console.error("sessionId não disponível para análise");
      toast.error("Erro: ID da sessão não disponível");
    }
  }, [getSessionId, analyze]);

  const handleSuggest = useCallback(() => {
    const sessionId = getSessionId();
    if (sessionId) {
      console.log("Chamando sugestões com sessionId:", sessionId);
      suggest(sessionId);
    } else {
      console.error("sessionId não disponível para sugestões");
      toast.error("Erro: ID da sessão não disponível");
    }
  }, [getSessionId, suggest]);

  const handleReport = useCallback(() => {
    const sessionId = getSessionId();
    if (sessionId) {
      console.log("Chamando relatório com sessionId:", sessionId);
      report(sessionId);
    } else {
      console.error("sessionId não disponível para relatório");
      toast.error("Erro: ID da sessão não disponível");
    }
  }, [getSessionId, report]);

  // Mapeia uma emoção para um emoji correspondente
  const getEmotionEmoji = useCallback((emotion) => {
    const emotionMap = {
      happiness: '😊',
      sadness: '😢',
      anger: '😠',
      surprise: '😲',
      fear: '😨',
      disgust: '🤢',
      neutral: '😐',
      joy: '😄',
      trust: '🤝',
      anticipation: '🤔',
      love: '❤️',
      optimism: '🌞',
      pessimism: '☁️',
      anxiety: '😰'
    };
    
    return emotionMap[emotion.toLowerCase()] || '❓';
  }, []);

  // Atualizar emoções no container
  const updateEmotions = useCallback((emotionsContainer) => {
    if (!emotionsContainer) return;
    
    // Limpar emoções anteriores
    emotionsContainer.innerHTML = '';
    
    // Adicionar emoções detectadas
    if (emotions && Object.keys(emotions).length > 0) {
      // Ordenar emoções por intensidade
      const sortedEmotions = Object.entries(emotions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3); // Mostrar apenas as 3 mais intensas
      
      sortedEmotions.forEach(([emotion, intensity]) => {
        if (intensity >= 0.1) { // Mostrar apenas se tiver intensidade significativa
          const emotionEl = document.createElement('div');
          emotionEl.className = 'emotion-indicator';
          
          // Mapear emoção para emoji
          const emoji = getEmotionEmoji(emotion);
          
          emotionEl.innerHTML = `<span class="emotion-emoji">${emoji}</span>`;
          emotionEl.style.opacity = Math.min(1, intensity);
          
          emotionsContainer.appendChild(emotionEl);
        }
      });
    }
  }, [emotions, getEmotionEmoji]);

  // Função para criar botões de IA
  const createAIButtons = useCallback(() => {
    if (floating || aiButtonsCreatedRef.current) return;
    
    console.log('Criando botões de IA agora com suporte a emoções');
    
    // Remover todos os botões existentes
    document.querySelectorAll('[id*="ai-"], [class*="ai-tools"], [class*="ai-buttons"]').forEach(el => {
      if (el.id !== 'direct-ai-buttons') {
        console.log('Removendo botão antigo:', el.id || el.className);
        el.remove();
      }
    });
    
    // Remover botões específicos pelo texto
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent || '';
      if ((text.includes('Analisar') || text.includes('Sugestões') || text.includes('Relatório')) && 
          !btn.closest('#direct-ai-buttons')) {
        const parent = btn.parentElement;
        if (parent && parent.children.length <= 3) {
          parent.remove();
        } else {
          btn.remove();
        }
      }
    });
    
    // Remover container antigo se existir
    const oldContainer = document.getElementById('direct-ai-buttons');
    if (oldContainer) {
      oldContainer.remove();
    }
    
    // Criar container principal
    const container = document.createElement('div');
    container.id = 'direct-ai-buttons';
    container.setAttribute('data-testid', 'ai-tools-container');
    container.style.cssText = `
      position: fixed !important;
      bottom: 80px !important;
      left: 0 !important;
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
    `;
    
    // Criar toolbar
    const toolbar = document.createElement('div');
    toolbar.setAttribute('data-testid', 'ai-tools-toolbar');
    toolbar.style.cssText = `
      display: flex !important;
      gap: 10px !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
      border-radius: 50px !important;
      padding: 8px 16px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
      pointer-events: all !important;
      position: relative !important;
    `;
    
    // Criar contenedor de emoções
    const emotionsContainer = document.createElement('div');
    emotionsContainer.className = 'ai-emotions-container';
    emotionsContainer.setAttribute('data-testid', 'ai-emotions-container');
    emotionsContainer.style.cssText = `
      position: absolute !important;
      top: -30px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      display: flex !important;
      gap: 5px !important;
      justify-content: center !important;
    `;
    
    // Criar função para botões
    const createButton = (emoji, text, onClick) => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', `ai-button-${text.toLowerCase()}`);
      button.style.cssText = `
        background-color: #2a3e4c !important;
        color: white !important;
        border: none !important;
        border-radius: 50px !important;
        padding: 8px 16px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-family: sans-serif !important;
        transition: all 0.2s ease !important;
      `;
      
      button.innerHTML = `<span style="font-size: 18px !important; display: inline-block !important;">${emoji}</span> <span>${text}</span>`;
      button.onclick = onClick;
      
      // Adicionar hover effect via event listeners
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#3a5268 !important';
        button.style.transform = 'translateY(-2px) !important';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#2a3e4c !important';
        button.style.transform = 'translateY(0) !important';
      });
      
      return button;
    };
    
    // Criar os botões
    const analyzeButton = createButton('🧠', 'Analisar', handleAnalyze);
    const suggestButton = createButton('💡', 'Sugestões', handleSuggest);
    const reportButton = createButton('📝', 'Relatório', handleReport);
    
    // Adicionar botões à toolbar
    toolbar.appendChild(analyzeButton);
    toolbar.appendChild(suggestButton);
    toolbar.appendChild(reportButton);
    toolbar.appendChild(emotionsContainer);
    
    // Adicionar toolbar ao container
    container.appendChild(toolbar);
    
    // Adicionar container ao body
    document.body.appendChild(container);
    console.log('Botões de IA criados com sucesso');
    
    // Atualizar emoções iniciais
    updateEmotions(emotionsContainer);
    
    // Marcar como criado
    aiButtonsCreatedRef.current = true;
  }, [floating, handleAnalyze, handleSuggest, handleReport, updateEmotions]);

  // Efeito para criar botões assim que o componente montar
  useEffect(() => {
    if (!floating) {
      // Criar botões imediatamente, não esperar pelo Jitsi
      createAIButtons();
      
      // Verificador periódico para garantir que os botões existam
      const interval = setInterval(() => {
        if (!document.getElementById('direct-ai-buttons')) {
          console.log('Botões de IA não encontrados, recriando...');
          createAIButtons();
        }
      }, 2000);
      
      return () => {
        clearInterval(interval);
        
        // Remover botões ao desmontar
        const container = document.getElementById('direct-ai-buttons');
        if (container) {
          container.remove();
        }
        
        aiButtonsCreatedRef.current = false;
      };
    }
  }, [floating, createAIButtons]);
  
  // Efeito para atualizar estados dos botões
  useEffect(() => {
    // Atualizar estado de processamento
    const container = document.getElementById('direct-ai-buttons');
    if (container) {
      if (isProcessing) {
        container.classList.add('processing');
      } else {
        container.classList.remove('processing');
      }
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        button.disabled = isProcessing;
        button.style.opacity = isProcessing ? '0.5 !important' : '1 !important';
        button.style.cursor = isProcessing ? 'not-allowed !important' : 'pointer !important';
      });
      
      // Atualizar emoções
      const emotionsContainer = container.querySelector('.ai-emotions-container');
      if (emotionsContainer) {
        updateEmotions(emotionsContainer);
      }
    }
  }, [isProcessing, emotions, updateEmotions]);

  // Efeito para iniciar a captura de áudio quando o Jitsi estiver carregado
  useEffect(() => {
    if (isJitsiLoaded && !floating) {
      // Iniciar a gravação de áudio após um pequeno delay para garantir que tudo esteja carregado
      const timer = setTimeout(() => {
        if (!isListening) {
          console.log('Iniciando reconhecimento de voz automaticamente');
          startListening();
        }
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        if (isListening) {
          console.log('Finalizando reconhecimento de voz');
          stopListening();
        }
      };
    }
  }, [isJitsiLoaded, floating, startListening, stopListening, isListening]);

  // Efeito para monitorar a transcrição e registrar mudanças
  useEffect(() => {
    if (transcript) {
      console.log('Transcrição atualizada:', transcript.substring(0, 50) + (transcript.length > 50 ? '...' : ''));
    }
  }, [transcript]);

  // Registrar o AIContext globalmente para que os botões possam acessá-lo
  useEffect(() => {
    if (window) {
      window.__AI_CONTEXT = { analyze, suggest, report, isProcessing, emotions, startListening, stopListening, isListening, transcript };
      
      // Disparar evento para outros componentes
      const event = new CustomEvent('ai-context-updated', {
        detail: {
          isProcessing,
          emotions,
          isListening,
          transcript
        }
      });
      window.dispatchEvent(event);
    }
  }, [analyze, suggest, report, isProcessing, emotions, startListening, stopListening, isListening, transcript]);

  // Carregar o script Jitsi uma vez
  useEffect(() => {
    if (!scriptLoadedRef.current) {
      loadJitsiScript();
    } else if (window.JitsiMeetExternalAPI) {
      initJitsi();
    }

    return () => {
      // Cleanup
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi:', error);
        }
      }
    };
  }, [roomName, userName, isJitsiScriptLoaded]);

  // Efeito para controlar áudio/vídeo
  useEffect(() => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.executeCommand('toggleAudio', !audioEnabled);
        jitsiApiRef.current.executeCommand('toggleVideo', !videoEnabled);
      } catch (error) {
        console.error('Error toggling audio/video:', error);
      }
    }
  }, [audioEnabled, videoEnabled]);

  // Efeito para garantir que o iframe seja estável após o carregamento
  useEffect(() => {
    if (isJitsiLoaded && jitsiApiRef.current) {
      setTimeout(() => {
        setIsJitsiMounted(true);
        
        // Garantir que os botões existam após o Jitsi estar completamente carregado
        if (!floating && !document.getElementById('direct-ai-buttons')) {
          createAIButtons();
        }
      }, 1000);
    }
  }, [isJitsiLoaded, floating, createAIButtons]);

  const loadJitsiScript = () => {
    if (window.JitsiMeetExternalAPI) {
      console.log('Jitsi Meet API already loaded');
      scriptLoadedRef.current = true;
      setIsJitsiScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      setIsJitsiScriptLoaded(true);
      console.log('Jitsi Meet API script loaded');
    };
    script.onerror = (error) => {
      console.error('Error loading Jitsi Meet API:', error);
    };
    document.body.appendChild(script);
  };

  const initJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI || !roomName) return;

    try {
      console.log('Initializing Jitsi Meet with room:', roomName);

      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing existing Jitsi instance:', error);
        }
      }

      const domain = 'meet.jit.si';
      const options = {
        roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        lang: 'pt-BR',
        configOverwrite: {
          startWithAudioMuted: !audioEnabled,
          startWithVideoMuted: !videoEnabled,
          disableDeepLinking: true,
          startAsModerator: true,
          p2p: {
            enabled: true,
            preferredCodec: 'VP9',
          },
          analytics: {
            disabled: true,
          },
          prejoinPageEnabled: false,
          requireDisplayName: false,
          disableThirdPartyRequests: true,
          disableLocalVideoFlip: true,
          notifications: [],
          remoteVideoMenu: {
            disableKick: true
          },
          disableProfile: false,
          hideEmailInSettings: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: !floating ? [
            'microphone', 'camera', 'desktop', 
            'fullscreen', 'hangup', 
            'chat', 'settings', 'videoquality',
          ] : [
            'microphone', 'camera', 'hangup'
          ],
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DISABLE_PRESENCE_STATUS: true,
          HIDE_INVITE_MORE_HEADER: true,
          MOBILE_APP_PROMO: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          DEFAULT_BACKGROUND: '#1a1a1a',
          DISABLE_VIDEO_BACKGROUND: true,
          VIDEO_QUALITY_LABEL_DISABLED: true,
          CONNECTION_INDICATOR_DISABLED: true,
          TOOLBAR_TIMEOUT: 10000
        },
        userInfo: {
          displayName: userName || 'Usuário',
        },
      };

      // Limpar nós filhos antes de inicializar
      while (jitsiContainerRef.current.firstChild) {
        jitsiContainerRef.current.removeChild(jitsiContainerRef.current.firstChild);
      }

      // Initialize the Jitsi Meet API
      const jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = jitsiApi;

      // Save the iframe reference
      setTimeout(() => {
        try {
          if (jitsiApiRef.current) {
            const iframe = jitsiApiRef.current.getIFrame();
            if (iframe) {
              iframeRef.current = iframe;
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
              iframe.style.backgroundColor = '#1a1a1a';
              
              // Add Picture in Picture support
              if (document.pictureInPictureEnabled) {
                iframe.allowPictureInPicture = true;
              }
            } else {
              console.warn('Jitsi iframe not found');
            }
          }
        } catch (error) {
          console.error('Error getting Jitsi iframe:', error);
        }
      }, 1000);

      // Setup event listeners
      jitsiApi.addListener('videoConferenceJoined', () => {
        console.log('Local user joined the conference');
        setIsJitsiLoaded(true);
        
        // Garantir que os botões existam após entrar na conferência
        if (!floating && !document.getElementById('direct-ai-buttons')) {
          createAIButtons();
        }
      });

      jitsiApi.addListener('videoConferenceLeft', () => {
        console.log('Local user left the conference');
        setIsJitsiLoaded(false);
      });

      jitsiApi.addListener('readyToClose', () => {
        console.log('Jitsi Meet is ready to close');
        setIsJitsiLoaded(false);
      });

      // Desativar notificações indesejadas
      jitsiApi.on('notificationTriggered', (notification) => {
        console.log('Jitsi notification:', notification);
        // Podemos ignorar notificações indesejadas aqui
      });

      // Listener para erros de wake lock - geralmente pode ser ignorado em alguns navegadores
      jitsiApi.on('errorOccurred', (error) => {
        // Ignorar erros de wake lock que causam problemas visuais
        if (error && error.message && error.message.includes('wake lock')) {
          console.log('Wake lock error (ignorado):', error);
          return;
        }
        
        // Lidar com outros erros
        console.error('Jitsi Meet error:', error);
      });

    } catch (error) {
      console.error('Failed to initialize Jitsi Meet:', error);
    }
  };

  const handlePipClick = () => {
    if (iframeRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(error => {
          console.error('Error exiting PiP mode:', error);
        });
        onPipModeChange(false);
      } else {
        iframeRef.current.requestPictureInPicture().then(() => {
          onPipModeChange(true);
        }).catch(error => {
          console.error('Error entering PiP mode:', error);
        });
      }
    }
  };

  // Componente de botão de microfone
  const MicButton = useCallback(() => {
    if (floating) return null;
    
    const handleMicToggle = () => {
      if (isListening) {
        console.log('Parando reconhecimento de voz manualmente');
        stopListening();
      } else {
        console.log('Iniciando reconhecimento de voz manualmente');
        startListening();
      }
    };
    
    return (
      <div 
        className="mic-button"
        onClick={handleMicToggle}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '150px',
          zIndex: 2147483647,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: isListening ? '#e74c3c' : '#2ecc71',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        <span 
          style={{
            fontSize: '22px',
            color: 'white'
          }}
        >
          {isListening ? '🔴' : '🎙️'}
        </span>
      </div>
    );
  }, [isListening, startListening, stopListening, floating]);

  return (
    <div className="meeting-root">
      <div className="fallback-container">
        <div 
          className={`video-area ${floating ? 'pip-mode' : ''}`} 
          ref={jitsiContainerRef}
        >
          {!isJitsiLoaded && (
            <div className="loading-indicator">
              <span>Carregando sala de reunião...</span>
            </div>
          )}

          {document.pictureInPictureEnabled && !floating && isJitsiLoaded && isJitsiMounted && (
            <button 
              className="pip-button" 
              onClick={handlePipClick}
              title="Modo Picture-in-Picture"
            >
              <span>PiP</span>
            </button>
          )}
        </div>
      </div>
      <div className="wake-lock-fix" aria-hidden="true"></div>
      <MicButton />
      
      {transcript && (
        <div 
          className="transcript-indicator"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 2147483646,
            maxWidth: '80%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Transcrição:</div>
          <div>{transcript.length > 150 ? transcript.substring(transcript.length - 150) + '...' : transcript}</div>
        </div>
      )}
    </div>
  );
};

FallbackMeeting.propTypes = {
  roomName: PropTypes.string.isRequired,
  userName: PropTypes.string,
  audioEnabled: PropTypes.bool,
  videoEnabled: PropTypes.bool,
  floating: PropTypes.bool,
  onPipModeChange: PropTypes.func,
};

export default FallbackMeeting;