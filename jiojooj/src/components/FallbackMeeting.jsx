import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAI } from '../contexts/AIContext';
import api from '../services/api';
import ConstellationField from './ConstellationField/index';
import '../styles/FallbackMeeting.css';
import axios from 'axios';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

// Constantes para representantes
const REPRESENTATIVE_TYPES = {
  PATIENT: { id: 'PATIENT', name: 'Paciente' },
  FAMILY: { id: 'FAMILY', name: 'Família' },
  FRIEND: { id: 'FRIEND', name: 'Amigo' },
  PROFESSIONAL: { id: 'PROFESSIONAL', name: 'Profissional' },
  INSTITUTION: { id: 'INSTITUTION', name: 'Instituição' },
  OTHER: { id: 'OTHER', name: 'Outro' }
};

const REPRESENTATIVE_COLORS = [
  '#FF5252', // Vermelho
  '#FF9800', // Laranja
  '#FFEB3B', // Amarelo
  '#4CAF50', // Verde
  '#2196F3', // Azul
  '#673AB7', // Roxo
  '#E91E63', // Rosa
  '#795548', // Marrom
  '#607D8B', // Azul acinzentado
  '#009688', // Verde-água
  '#00BCD4', // Ciano
  '#FFC107', // Âmbar
  '#8BC34A', // Verde claro
  '#CDDC39', // Lima
  '#9C27B0', // Púrpura
  '#3F51B5', // Índigo
  '#F44336', // Vermelho claro
  '#FFFFFF', // Branco
  '#000000'  // Preto
];

// Componente para o iframe do Daily
const DailyFrame = ({ roomUrl, userName, isVideoEnabled, isAudioEnabled }) => {
  const iframeRef = useRef(null);
  
  return (
    <iframe
      ref={iframeRef}
      title="Daily Video Call"
      src={roomUrl}
      className="daily-iframe"
      allow="camera; microphone; fullscreen; speaker; display-capture; picture-in-picture"
      allowFullScreen
      allowPictureInPicture
    />
  );
};

const FallbackMeeting = ({ roomName, userInfo }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyUrl, setDailyUrl] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showField, setShowField] = useState(false);
  const [fieldMounted, setFieldMounted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showRepresentativesModal, setShowRepresentativesModal] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const videoContainerRef = useRef(null);
  const constellationRef = useRef(null);
  const [representativeName, setRepresentativeName] = useState('');
  const [selectedType, setSelectedType] = useState('PATIENT');
  const [selectedColor, setSelectedColor] = useState('#4CAF50'); // Verde
  const [hasControl, setHasControl] = useState(true);
  const [representatives, setRepresentatives] = useState([
    {
      id: 'sample-1',
      name: 'Maria Silva',
      type: 'PATIENT',
      color: '#FF5252'
    },
    {
      id: 'sample-2',
      name: 'João Souza',
      type: 'FAMILY',
      color: '#4CAF50'
    }
  ]);
  // Estados para edição
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const { analyze, suggest, report } = useAI();
  
  // Extrair o ID da sessão do roomName
  const getSessionId = () => {
    return roomName.startsWith('session-') ? roomName.substring(8) : roomName;
  };
  
  // Funções para botões de IA
  const handleSuggest = () => {
    const sessionId = getSessionId();
    console.log('Chamando sugestões para sessão:', sessionId);
    if (typeof suggest === 'function') {
      suggest(sessionId);
    }
  };
  
  const handleAnalyze = () => {
    const sessionId = getSessionId();
    console.log('Chamando análise para sessão:', sessionId);
    if (typeof analyze === 'function') {
      analyze(sessionId);
    }
  };
  
  const handleReport = () => {
    const sessionId = getSessionId();
    console.log('Chamando relatório para sessão:', sessionId);
    if (typeof report === 'function') {
      report(sessionId);
    }
  };
  
  // Função para alternar entre modo tela cheia
  const toggleFullScreen = useCallback(() => {
    try {
      const container = document.querySelector('.fallback-meeting-container');
      
      if (!document.fullscreenElement) {
        // Entrar em modo tela cheia
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.mozRequestFullScreen) { // Firefox
          container.mozRequestFullScreen();
        } else if (container.webkitRequestFullscreen) { // Chrome, Safari e Opera
          container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) { // IE/Edge
          container.msRequestFullscreen();
        }
        setIsFullScreen(true);
      } else {
        // Sair do modo tela cheia
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        setIsFullScreen(false);
      }
    } catch (error) {
      console.error('Erro ao alternar modo tela cheia:', error);
    }
  }, []);

  // Função para alternar o campo de constelação
  const handleCampo = useCallback(() => {
    const sessionId = getSessionId();
    console.log('Alternando Campo de Constelação para sessão:', sessionId);
    
    // Inverter o estado de exibição
    const newShowFieldState = !showField;
    
    if (newShowFieldState) {
      // Primeiro ajustamos a classe para o layout dividido
      if (videoContainerRef.current) {
        videoContainerRef.current.classList.add('with-field');
      }
      
      // Atualizamos o estado para mostrar o container e montar o componente imediatamente
      setShowField(true);
      setFieldMounted(true);
      
      console.log('Campo montado e visível');
        } else {
      // Para esconder, removemos a classe de layout primeiro
      if (videoContainerRef.current) {
        videoContainerRef.current.classList.remove('with-field');
      }
      
      // Escondemos o campo imediatamente
      setShowField(false);
      
      // Desmontamos o componente após um delay para permitir a animação de saída
        setTimeout(() => {
        setFieldMounted(false);
        console.log('Campo desmontado');
      }, 500);
      
      // Se estiver em tela cheia, também sair
      if (isFullScreen) {
        toggleFullScreen();
      }
      
      // Fechar o modal de representantes se estiver aberto
      if (showRepresentativesModal) {
        setShowRepresentativesModal(false);
      }
    }
  }, [showField, isFullScreen, toggleFullScreen, showRepresentativesModal]);
  
  // Função para tentar entrar em modo PiP
  const requestPiP = useCallback(() => {
    try {
      const iframeElement = document.querySelector('.daily-iframe');
      if (iframeElement && document.pictureInPictureEnabled) {
        // Verificar se o dispositivo suporta PiP
        if (iframeElement.requestPictureInPicture) {
          iframeElement.requestPictureInPicture()
            .then(() => {
              console.log('Entrou em modo PiP');
            })
            .catch(err => {
              console.error('Erro ao entrar em PiP:', err);
              // Fallback - apenas mostrar um alerta para o usuário
              console.log('Não foi possível ativar o modo picture-in-picture. Este recurso pode não ser suportado pelo seu navegador ou configurações.');
          });
        } else {
          console.warn('PiP não suportado por este navegador');
          console.log('Picture-in-Picture não é suportado pelo seu navegador.');
        }
      }
    } catch (error) {
      console.error('Erro ao tentar PiP:', error);
    }
  }, []);
  
  // Criar ou obter uma sala do Daily
  const createOrGetDailyRoom = async (roomName) => {
    try {
      // Tentar criar a sala via API backend
      const cleanedRoomName = roomName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      
      // Usar o endpoint correto que existe no backend
      const response = await api.get(`/api/meetings/validate-room/${cleanedRoomName}`);
      
      if (response.data && response.data.data && response.data.data.url) {
        console.log('Sala validada/criada com sucesso:', response.data);
        return response.data.data.url;
      }
      
      // Fallback: URL direta
      return `https://teraconect.daily.co/${cleanedRoomName}`;
    } catch (err) {
      console.error('Erro ao criar sala no Daily:', err);
      
      // Fallback: URL direta
      const fallbackRoomName = roomName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      return `https://teraconect.daily.co/${fallbackRoomName}`;
    }
  };
  
  // Adicionar suporte ao PiP nativo quando disponível
  useEffect(() => {
    const setupPiPSupport = () => {
      const iframeElement = document.querySelector('.daily-iframe');
      if (iframeElement) {
        // Adicionar atributos que permitem PiP diretamente no elemento
        iframeElement.setAttribute('allowPictureInPicture', 'true');
        iframeElement.setAttribute('allowFullScreen', 'true');
      }
    };
    
    if (!loading && !error) {
      setupPiPSupport();
    }
  }, [loading, error]);
  
  // Monitorar mudanças no estado de tela cheia
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);
  
  // Preparar a URL do Daily
  useEffect(() => {
    const setupDailyRoom = async () => {
      try {
        setLoading(true);
        // Configurar a URL do Daily com os parâmetros necessários
        const userName = userInfo?.displayName || 'Usuário';
        
        // Obter URL da sala (criar se necessário)
        const roomUrl = await createOrGetDailyRoom(roomName);
        
        // Adicionar parâmetros do usuário à URL
        const fullUrl = `${roomUrl}?name=${encodeURIComponent(userName)}&camera=${isVideoEnabled ? 'on' : 'off'}&audio=${isAudioEnabled ? 'on' : 'off'}&pip=true`;
        
        console.log('URL Daily configurada:', fullUrl);
        
        setDailyUrl(fullUrl);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao configurar Daily:', err);
        setError('Não foi possível iniciar a videochamada. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    setupDailyRoom();
  }, [roomName, userInfo, isVideoEnabled, isAudioEnabled]);
  
  // Montar o campo de constelação mesmo quando não estiver visível
  // para garantir que ele esteja pronto quando o modal for aberto
    useEffect(() => {
    if (!fieldMounted) {
      setFieldMounted(true);
    }
  }, [fieldMounted]);
  
  // Limpar efeitos ao desmontar o componente
  useEffect(() => {
      return () => {
      // Limpar quaisquer timeouts/eventos quando o componente for desmontado
      setShowField(false);
      setFieldMounted(false);
      
      // Sair do modo tela cheia se estiver ativo
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
        }
      };
    }, []);
    
  // Função para alternar a transcrição
  const handleTranscription = useCallback(() => {
    const newTranscribingState = !isTranscribing;
    setIsTranscribing(newTranscribingState);
    
    // Aqui você adiciona a lógica para iniciar ou parar a transcrição
    console.log(`Transcrição ${newTranscribingState ? 'iniciada' : 'parada'}`);
    
    // Exemplo de onde você integraria com uma API de transcrição
    // if (newTranscribingState) {
    //   startTranscriptionService();
    // } else {
    //   stopTranscriptionService();
    // }
  }, [isTranscribing]);
  
  // Função para exibir/ocultar o modal de representantes
  const toggleRepresentativesModal = useCallback(() => {
    setShowRepresentativesModal(!showRepresentativesModal);
  }, [showRepresentativesModal]);
  
  // Função para adicionar um representante
  const addRepresentative = () => {
    if (representativeName.trim() === '') return;
    
    const newRepresentative = {
      id: `rep-${Date.now()}`,
      name: representativeName,
      type: selectedType,
      color: selectedColor
    };
    
    setRepresentatives(prev => [...prev, newRepresentative]);
    setRepresentativeName('');
    setSelectedColor('#4CAF50'); // Resetar para a cor padrão (verde)
    
    console.log('Representante adicionado:', newRepresentative);
  };
  
  // Função para remover um representante
  const removeRepresentative = (id) => {
    setRepresentatives(prev => prev.filter(rep => rep.id !== id));
    console.log('Representante removido:', id);
  };
  
  // Função para iniciar a edição de um representante
  const startEditing = (id) => {
    const representative = representatives.find(rep => rep.id === id);
    if (representative) {
      setEditingId(id);
      setEditName(representative.name);
      setEditColor(representative.color);
      console.log('Iniciando edição do representante:', id);
    }
  };
  
  // Função para salvar a edição
  const saveEdit = () => {
    if (editName.trim() === '') return;
    
    setRepresentatives(prev => prev.map(rep => 
      rep.id === editingId ? 
      { ...rep, name: editName, color: editColor } : 
      rep
    ));
    
    // Resetar estado de edição
    setEditingId(null);
    setEditName('');
    setEditColor('');
    console.log('Edição salva para representante:', editingId);
  };
  
  // Função para cancelar a edição
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
    console.log('Edição cancelada');
  };
  
  // Função para passar o controle
  const passFocus = () => {
    // Em um ambiente real, implementaria a lógica para passar o controle para outro usuário
    console.log('Passar controle para outro usuário');
    console.log('Funcionalidade para passar controle em desenvolvimento');
  };
  
  // Função para salvar configuração
  const saveConfiguration = () => {
    // Em um ambiente real, salvaria no banco de dados
    console.log('Configuração salva:', representatives);
    console.log('Representantes salvos com sucesso!');
    setShowRepresentativesModal(false);
  };
  
  // Função para ocultar a configuração
  const hideConfiguration = () => {
    setShowRepresentativesModal(false);
    console.log('Configuração ocultada');
  };
  
    return (
    <div className="fallback-meeting-container">
      {console.log("Renderizando FallbackMeeting - showField:", showField, "fieldMounted:", fieldMounted, "isFullScreen:", isFullScreen, "showRepresentativesModal:", showRepresentativesModal)}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Iniciando videochamada...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">❌</div>
          <p>{error}</p>
      <button 
            className="retry-button"
            onClick={() => window.location.reload()}
      >
            Tentar novamente
      </button>
        </div>
      ) : (
        <div className="video-container" ref={videoContainerRef}>
          <DailyFrame 
            roomUrl={dailyUrl}
            userName={userInfo?.displayName || 'Usuário'}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
          />
          
          {/* Campo de Constelação */}
          {showField && (
            <div 
              className="constellation-field-wrapper custom-clicable" 
              ref={constellationRef}
              style={{
                pointerEvents: 'auto !important',
                touchAction: 'auto !important',
                userSelect: 'auto !important',
                zIndex: 1500,
                background: 'transparent'
              }}
            >
              {fieldMounted && (
                <div 
                  className="constellation-container-outer custom-clicable"
                  style={{
          width: '100%', 
          height: '100%',
          position: 'relative',
                    pointerEvents: 'auto !important',
                    touchAction: 'auto !important',
                    userSelect: 'auto !important'
                  }}
                >
                  <ConstellationField 
                    isHost={userInfo?.isTherapist} 
                    sessionId={getSessionId()}
                    optimized={true}
                    className="custom-clicable fixed-panel"
                    panelVisible={false}
                  />
            </div>
          )}
              <div className="constellation-buttons custom-clicable" style={{
                position: 'fixed',
                top: '25px',
                right: '25px',
                display: 'flex',
                gap: '15px',
                zIndex: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                padding: '12px',
                borderRadius: '10px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
              }}>
                <button 
                  className={`fullscreen-button custom-clicable ${isFullScreen ? 'active' : ''}`} 
                  onClick={toggleFullScreen}
                  title={isFullScreen ? "Sair da tela cheia" : "Modo tela cheia"}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: isFullScreen ? '#006e3c' : '#2a2a2a',
                    color: 'white',
                    border: '3px solid rgba(255, 255, 255, 0.9)',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isFullScreen ? 
                      '0 0 20px rgba(0, 110, 60, 0.9)' : 
                      '0 5px 10px rgba(0, 0, 0, 0.6)'
                  }}
                >
                  <span style={{ fontSize: '30px' }}>{isFullScreen ? '⤓' : '⤒'}</span>
                </button>
                <button 
                  className="close-field-btn custom-clicable" 
                  onClick={handleCampo}
                  title="Fechar campo"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#aa2222',
                    color: 'white',
                    border: '3px solid rgba(255, 255, 255, 0.9)',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 5px 10px rgba(0, 0, 0, 0.6)'
                  }}
                >
                  <span style={{ fontSize: '30px' }}>✕</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Botões de IA */}
          <div className="ai-buttons">
            <button className="ai-button" onClick={handleSuggest}>
              <span>💡</span>
              <span>Sugestões</span>
            </button>
            <button className="ai-button" onClick={handleAnalyze}>
              <span>🧠</span>
              <span>Analisar</span>
            </button>
            <button className="ai-button" onClick={handleReport}>
              <span>📝</span>
              <span>Relatório</span>
            </button>
            <button 
              className={`ai-button ${showField ? 'active' : ''}`} 
              onClick={handleCampo}
            >
              <span>📋</span>
              <span>Campo</span>
            </button>
            <button 
              className={`ai-button ${isTranscribing ? 'active' : ''}`} 
              onClick={handleTranscription}
            >
              <span>🎙️</span>
              <span>Transcrição</span>
            </button>
          </div>
          
          {/* Botão adicionar representante independente do campo - sempre visível quando o campo está ativo */}
          {showField && (
            <div 
              className="add-representative-floating-button" 
              style={{
                position: 'fixed',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              {console.log("Renderizando botão flutuante de adicionar representante")}
              <button 
                className={`add-representative-btn ${showRepresentativesModal ? 'active' : ''}`} 
                onClick={toggleRepresentativesModal}
                style={{
                  width: 'auto',
                  minWidth: '250px',
                  height: '60px',
                  borderRadius: '30px',
                  backgroundColor: showRepresentativesModal ? '#00a389' : '#035d50',
                  color: 'white',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.6)',
                  padding: '0 25px',
                  fontWeight: 'bold'
                }}
              >
                <span style={{ fontSize: '24px', marginRight: '10px' }}>👥</span>
                Adicionar Representante
              </button>
            </div>
          )}
          
          {/* Modal de Representantes */}
          {showRepresentativesModal && (
            <div className="representatives-modal-overlay">
              <div className="representatives-modal">
                <div className="modal-header">
                  <h3>Gerenciar Representantes</h3>
                  <button 
                    className="close-modal-btn" 
                    onClick={toggleRepresentativesModal}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-content">
                  <div className="modal-representatives-container">
                    {/* Renderização direta do formulário de adição de representantes */}
                    <div className="control-panel custom-clicable modal-panel" style={{
                      padding: '25px',
                      backgroundColor: '#252525',
                      borderRadius: '10px',
                      width: '100%',
                      boxShadow: '0 0 20px rgba(0, 0, 0, 0.4)',
                    }}>
                      <h3 className="panel-title custom-clicable" style={{
                        fontSize: '20px',
                        marginBottom: '20px',
                        color: 'white',
                        fontWeight: '500',
                        textAlign: 'center'
                      }}>Representantes</h3>
                      
                      {/* Adicionar um novo representante */}
                      <div className="add-representative custom-clicable">
                        <input
                          type="text"
                          value={representativeName}
                          onChange={(e) => setRepresentativeName(e.target.value)}
                          placeholder="Nome do representante"
                          className="name-input custom-clicable"
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '16px',
                            marginBottom: '15px',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            color: '#333333',
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        
                        <div className="type-selection custom-clicable">
                          <select 
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="type-dropdown custom-clicable"
                            style={{
                              width: '100%',
                              padding: '12px 15px',
                              fontSize: '16px',
                              marginBottom: '15px',
                              borderRadius: '8px',
                              backgroundColor: '#ffffff',
                              color: '#333333',
                              border: '1px solid rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {Object.values(REPRESENTATIVE_TYPES).map((type) => (
                              <option key={type.id} value={type.id} className="custom-clicable">
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="color-selection custom-clicable" style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '10px',
                          margin: '15px 0',
                          justifyContent: 'center'
                        }}>
                          {REPRESENTATIVE_COLORS.map((color, index) => {
                            const isWhite = color === '#FFFFFF';
                            const isBlack = color === '#000000';
                            
                            const specialStyle = {};
                            if (isWhite) {
                              specialStyle.border = '2px solid #aaa';
                              specialStyle.boxShadow = '0 0 4px rgba(0,0,0,0.2)';
                            } else if (isBlack) {
                              specialStyle.border = '2px solid #666';
                              specialStyle.boxShadow = '0 0 4px rgba(255,255,255,0.2)';
                            } else if (selectedColor === color) {
                              specialStyle.border = '2px solid #333';
                            } else {
                              specialStyle.border = '2px solid transparent';
                            }
                            
                            return (
                              <div 
                                key={index}
                                className={`color-option custom-clicable ${selectedColor === color ? 'selected' : ''}`}
                                style={{ 
                                  backgroundColor: color,
                                  width: '35px',
                                  height: '35px',
                                  borderRadius: '50%',
                                  cursor: 'pointer',
                                  ...specialStyle
                                }}
                                onClick={() => setSelectedColor(color)}
                                title={isWhite ? 'Branco' : isBlack ? 'Preto' : color}
                              />
                            );
                          })}
                        </div>
                        
                        <button 
                          onClick={addRepresentative}
                          className="add-btn custom-clicable"
                          disabled={representativeName.trim() === ''}
                          style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '16px',
                            marginTop: '20px',
                            borderRadius: '8px',
                            backgroundColor: '#035d50',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            border: 'none'
                          }}
                        >
                          + Adicionar
                        </button>
                      </div>
                      
                      {/* Lista de representantes */}
                      <div className="representatives-list custom-clicable" style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        marginTop: '25px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                        paddingTop: '15px'
                      }}>
                        {representatives.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#999', padding: '10px' }}>
                            Nenhum representante adicionado
                          </div>
                        ) : (
                          representatives.map((rep) => (
                            <div key={rep.id} className="representative-item custom-clicable" style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              padding: '12px',
                              marginBottom: '10px',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              {editingId === rep.id ? (
                                // Interface de edição
                                <div className="edit-mode custom-clicable" style={{
                                  width: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px'
                                }}>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="edit-name-input custom-clicable"
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      fontSize: '14px',
                                      borderRadius: '4px',
                                      backgroundColor: '#fff',
                                      color: '#333',
                                      border: 'none'
                                    }}
                                  />
                                  
                                  <div className="edit-color-selection custom-clicable" style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '6px',
                                    justifyContent: 'center',
                                    margin: '5px 0'
                                  }}>
                                    {REPRESENTATIVE_COLORS.map((color, index) => (
                                      <div
                                        key={index}
                                        className={`color-option mini custom-clicable ${editColor === color ? 'selected' : ''}`}
                                        style={{
                                          backgroundColor: color,
                                          width: '22px',
                                          height: '22px',
                                          borderRadius: '50%',
                                          cursor: 'pointer',
                                          border: editColor === color ? '2px solid white' : '2px solid transparent'
                                        }}
                                        onClick={() => setEditColor(color)}
                                      />
                                    ))}
                                  </div>
                                  
                                  <div className="edit-actions custom-clicable" style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px'
                                  }}>
                                    <button
                                      className="save-edit-btn custom-clicable"
                                      onClick={saveEdit}
                                      style={{
                                        backgroundColor: '#035d50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '5px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      className="cancel-edit-btn custom-clicable"
                                      onClick={cancelEdit}
                                      style={{
                                        backgroundColor: '#555',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '5px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Visualização normal
                                <>
                                  <div 
                                    className="color-indicator" 
                                    style={{ 
                                      backgroundColor: rep.color,
                                      width: '25px',
                                      height: '25px',
                                      borderRadius: '50%',
                                      marginRight: '12px',
                                      border: '1px solid rgba(255, 255, 255, 0.3)'
                                    }}
                                  />
                                  <div className="name" style={{
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    color: 'white',
                                    flex: '1'
                                  }}>
                                    {rep.name}
                                  </div>
                                  <div className="type-indicator" style={{
                                    fontSize: '12px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    marginRight: '10px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    padding: '2px 6px',
                                    borderRadius: '3px'
                                  }}>
                                    {REPRESENTATIVE_TYPES[rep.type].name}
                                  </div>
                                  <div className="item-actions" style={{
                                    display: 'flex',
                                    gap: '5px'
                                  }}>
                                    <button 
                                      className="edit-btn custom-clicable"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(rep.id);
                                      }}
                                      style={{
                                        width: '30px',
                                        height: '30px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ✎
                                    </button>
                                    <button 
                                      className="remove-btn custom-clicable"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeRepresentative(rep.id);
                                      }}
                                      style={{
                                        width: '30px',
                                        height: '30px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ⨯
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Botões de controle */}
                      <div className="control-buttons custom-clicable" style={{
                        marginTop: '25px',
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'center',
                        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                        paddingTop: '20px'
                      }}>
                        <button 
                          className="control-button custom-clicable" 
                          onClick={passFocus}
                          disabled={!hasControl}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            backgroundColor: '#333333',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Passar
                        </button>
                        <button 
                          className="control-button custom-clicable" 
                          onClick={saveConfiguration}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            backgroundColor: '#333333',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Salvar
                        </button>
                        <button 
                          className="control-button custom-clicable" 
                          onClick={hideConfiguration}
                          style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            backgroundColor: '#333333',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Ocultar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FallbackMeeting;