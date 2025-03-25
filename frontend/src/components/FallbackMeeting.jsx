import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export const FallbackMeeting = ({ 
  audioEnabled = true, 
  videoEnabled = true, 
  isFloating = false,
  onPipModeChange
}) => {
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    console.log('FallbackMeeting - Props:', { audioEnabled, videoEnabled, isFloating });
    
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        console.log('Jitsi API já carregada');
        initJitsi();
        return;
      }

      console.log('Carregando script do Jitsi');
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        console.log('Script do Jitsi carregado');
        initJitsi();
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    const initJitsi = () => {
      console.log('Inicializando Jitsi');
      const domain = 'meet.jit.si';
      const options = {
        roomName: 'terapiaconect',
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: !audioEnabled,
          startWithVideoMuted: !videoEnabled,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableNoisyMicDetection: false,
          enableNoAudioDetection: false,
          enableClosePage: false,
          hideConferenceSubject: true,
          hideConferenceTimer: true,
          disableInviteFunctions: true,
          readOnlyName: true,
          buttonsWithNotifyClick: [
            'camera',
            'microphone',
            'desktop',
            'fullscreen',
            'hangup'
          ]
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'desktop',
            'fullscreen',
            'hangup'
          ],
          SETTINGS_SECTIONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DISABLE_VIDEO_BACKGROUND: true,
          DISABLE_FOCUS_INDICATOR: true,
          DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
          DISABLE_TRANSCRIPTION_SUBTITLES: true,
          DISABLE_PRESENCE_STATUS: true,
          DISABLE_RINGING: true,
          DISABLE_REMOTE_VIDEO_MENU: true,
          DEFAULT_BACKGROUND: '#1a1a1a',
          DEFAULT_LOCAL_DISPLAY_NAME: 'Você',
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
          VIDEO_QUALITY_LABEL_DISABLED: true,
          TOOLBAR_ALWAYS_VISIBLE: true,
          TOOLBAR_TIMEOUT: 4000,
          INITIAL_TOOLBAR_TIMEOUT: 4000,
          TOOLBAR_BUTTONS_MIN_WIDTH: 48
        }
      };

      try {
        if (jitsiApiRef.current) {
          console.log('Dispondo instância anterior do Jitsi');
          jitsiApiRef.current.dispose();
        }

        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        iframeRef.current = jitsiApiRef.current.getIframe();

        if (iframeRef.current) {
          console.log('Configurando iframe do Jitsi');
          // Configurar permissões do iframe
          iframeRef.current.allow = "camera; microphone; fullscreen; display-capture; picture-in-picture; clipboard-write";
          
          // Adicionar suporte ao PIP nativo
          iframeRef.current.addEventListener('loadedmetadata', () => {
            console.log('Iframe carregado, tentando entrar em PIP');
            if (document.pictureInPictureEnabled) {
              iframeRef.current.requestPictureInPicture()
                .then(() => {
                  console.log('Entrou em PIP com sucesso');
                  onPipModeChange?.(true);
                })
                .catch(error => {
                  console.error('Erro ao entrar em PIP:', error);
                });
            } else {
              console.log('PIP não suportado pelo navegador');
            }
          });

          // Listener para mudanças no estado do PIP
          iframeRef.current.addEventListener('enterpictureinpicture', () => {
            console.log('Evento enterpictureinpicture disparado');
            onPipModeChange?.(true);
          });

          iframeRef.current.addEventListener('leavepictureinpicture', () => {
            console.log('Evento leavepictureinpicture disparado');
            onPipModeChange?.(false);
          });
        }

        // Configurar handlers para eventos do Jitsi
        jitsiApiRef.current.addEventListeners({
          videoConferenceJoined: () => {
            console.log('Conferência iniciada');
            jitsiApiRef.current.executeCommand('displayName', 'Você');
          },
          audioMuteStatusChanged: ({ muted }) => {
            console.log('Status do áudio mudou:', muted);
          },
          videoMuteStatusChanged: ({ muted }) => {
            console.log('Status do vídeo mudou:', muted);
          },
          readyToClose: () => {
            console.log('Jitsi pronto para fechar');
          }
        });

      } catch (error) {
        console.error('Erro ao inicializar Jitsi:', error);
      }
    };

    loadJitsiScript();

    return () => {
      if (jitsiApiRef.current) {
        console.log('Limpando recursos do Jitsi');
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

  // Atualizar estado de áudio/vídeo quando as props mudarem
  useEffect(() => {
    if (jitsiApiRef.current) {
      console.log('Atualizando estado de áudio/vídeo:', { audioEnabled, videoEnabled });
      jitsiApiRef.current.executeCommand('toggleAudio', !audioEnabled);
      jitsiApiRef.current.executeCommand('toggleVideo', !videoEnabled);
    }
  }, [audioEnabled, videoEnabled]);

  return (
    <div 
      ref={jitsiContainerRef} 
      className={`video-area ${isFloating ? 'pip-mode' : ''}`}
      style={{ 
        width: '100%', 
        height: '100%',
        display: isFloating ? 'block' : 'flex',
        position: isFloating ? 'fixed' : 'relative',
        zIndex: isFloating ? 2147483647 : 'auto'
      }}
    />
  );
};

FallbackMeeting.propTypes = {
  audioEnabled: PropTypes.bool,
  videoEnabled: PropTypes.bool,
  isFloating: PropTypes.bool,
  onPipModeChange: PropTypes.func
};

export default FallbackMeeting; 