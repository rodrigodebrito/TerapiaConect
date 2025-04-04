import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTherapistByUserId, getTherapistById } from '../services/therapistService';
import { THERAPY_NICHES, THERAPY_TOOLS, formatCurrency } from '../utils/constants';
import './TherapistProfileView.css';

const TherapistProfileView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [therapist, setTherapist] = useState(null);
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState(Date.now());

  // Função para obter URL completa da imagem
  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // O backend está rodando na porta 3000
    const baseUrl = window.location.origin.replace('3001', '3000');
    
    // Garantir que o caminho comece com /
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${formattedPath}`;
  };

  useEffect(() => {
    const fetchTherapistData = async () => {
      try {
        setLoading(true);
        
        if (user?.id) {
          // Primeiro, obter o ID do terapeuta
          const therapistData = await getTherapistByUserId(user.id);
          console.log('Dados iniciais do terapeuta:', therapistData);
          
          if (therapistData) {
            // Depois, buscar os detalhes completos usando o ID do terapeuta
            const fullProfile = await getTherapistById(therapistData.id);
            console.log('Perfil completo carregado:', fullProfile);
            console.log('Ferramentas do terapeuta:', fullProfile.tools);
            
            // Garantir que as ferramentas estejam no formato correto
            const processedProfile = {
              ...fullProfile,
              tools: Array.isArray(fullProfile.tools) ? fullProfile.tools : [],
              customTools: Array.isArray(fullProfile.customTools) ? 
                fullProfile.customTools : 
                (typeof fullProfile.customTools === 'string' ? 
                  JSON.parse(fullProfile.customTools || '[]') : 
                  [])
            };
            
            console.log('Perfil processado:', processedProfile);
            setTherapist(processedProfile);
          } else {
            setError('Perfil de terapeuta não encontrado. Você precisa criar seu perfil primeiro.');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados do terapeuta. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchTherapistData();
  }, [user]);
  
  // Atualizar timestamp quando o perfil for carregado
  useEffect(() => {
    if (therapist) {
      setTimestamp(Date.now());
    }
  }, [therapist]);

  const handleGoBack = () => {
    navigate('/therapist/dashboard');
  };

  const handleEditProfile = () => {
    navigate('/therapist/profile');
  };
  
  // Função para obter o rótulo de um nicho pelo ID
  const getNicheLabel = (nicheId) => {
    const niche = THERAPY_NICHES.find(n => n.id === nicheId);
    return niche ? niche.label : nicheId;
  };
  
  // Função para obter o rótulo de uma ferramenta pelo ID
  const getToolLabel = (toolId) => {
    const tool = THERAPY_TOOLS.find(t => t.id === toolId);
    return tool ? tool.label : toolId;
  };

  return (
    <div className="therapist-profile-view-container">
      <header className="profile-view-header">
        <button onClick={handleGoBack} className="back-button">
          &larr; Voltar
        </button>
        <div className="header-actions">
          <span className="preview-badge">Pré-visualização</span>
          <button onClick={handleEditProfile} className="edit-profile-button">
            Editar Perfil
          </button>
        </div>
      </header>
      
      {loading ? (
        <div className="loading">Carregando perfil...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : therapist ? (
        <div className="profile-view-content">
          <div className="profile-header-section">
            <div className="profile-image-container">
              {therapist.profilePicture ? (
                <img 
                  src={`${getFullImageUrl(therapist.profilePicture)}?t=${timestamp}`}
                  alt={user.name} 
                  className="profile-image" 
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span>{user?.name?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            
            <div className="profile-header-info">
              <h1 className="therapist-name">{therapist.name || user.name}</h1>
              
              {therapist.differential && (
                <div className="therapist-differential">
                  {therapist.differential}
                </div>
              )}
              
              <div className="therapist-pricing">
                <span className="price-label">A partir de</span>
                <span className="price-value">{formatCurrency(therapist.baseSessionPrice)}</span>
                <span className="session-duration">/ {therapist.sessionDuration} minutos</span>
              </div>
              
              <div className="attendance-mode">
                <span className="attendance-label">
                  {therapist.attendanceMode === 'ONLINE' ? 'Atendimento Online' : 
                   therapist.attendanceMode === 'PRESENTIAL' ? 'Atendimento Presencial' :
                   'Atendimento Online e Presencial'}
                </span>
              </div>
              
              <button className="schedule-button">
                Agendar Consulta
              </button>
            </div>
          </div>
          
          <div className="profile-section">
            <h2 className="section-title">Sobre</h2>
            <p className="therapist-bio">{therapist.shortBio}</p>
          </div>

          {((therapist.niches && (typeof therapist.niches === 'string' ? JSON.parse(therapist.niches || '[]') : therapist.niches).length > 0) || 
           (therapist.customNiches && (typeof therapist.customNiches === 'string' ? JSON.parse(therapist.customNiches || '[]') : therapist.customNiches).length > 0)) && (
            <div className="profile-section">
              <h2 className="section-title">Especialidades</h2>
              <div className="tags-container">
                {therapist.niches && (typeof therapist.niches === 'string' ? 
                  JSON.parse(therapist.niches || '[]') : 
                  therapist.niches
                ).map(nicheId => (
                  <span key={nicheId} className="tag">
                    {getNicheLabel(nicheId)}
                  </span>
                ))}
                
                {therapist.customNiches && (typeof therapist.customNiches === 'string' ? 
                  JSON.parse(therapist.customNiches || '[]') : 
                  therapist.customNiches
                ).map((niche, index) => (
                  niche && <span key={`custom-niche-${index}`} className="tag">{niche}</span>
                ))}
              </div>
            </div>
          )}
          
          {/* Seção de Ferramentas e Técnicas */}
          {(therapist.tools?.length > 0 || therapist.customTools?.length > 0) && (
            <div className="profile-section">
              <h2 className="section-title">Ferramentas e Técnicas</h2>
              <div className="tags-container">
                {/* Ferramentas predefinidas */}
                {therapist.tools?.map(tool => {
                  const toolInfo = THERAPY_TOOLS.find(t => t.id === tool.id);
                  return toolInfo && (
                    <span key={`tool-${tool.id}`} className="tag">
                      {toolInfo.label} ({tool.duration}min - {formatCurrency(tool.price)})
                    </span>
                  );
                })}
                
                {/* Ferramentas personalizadas */}
                {therapist.customTools?.map((tool, index) => (
                  tool.name && (
                    <span key={`custom-tool-${index}`} className="tag">
                      {tool.name} ({tool.duration}min - {formatCurrency(tool.price)})
                    </span>
                  )
                ))}
              </div>
            </div>
          )}
          
          <div className="profile-section">
            <h2 className="section-title">Formação e Experiência</h2>
            {therapist.education && (
              <div className="subsection">
                <h3 className="subsection-title">Formação e Credenciais</h3>
                <p>{therapist.education}</p>
              </div>
            )}
            
            {therapist.experience && (
              <div className="subsection">
                <h3 className="subsection-title">Experiência</h3>
                <p>{therapist.experience}</p>
              </div>
            )}
            
            {therapist.targetAudience && (
              <div className="subsection">
                <h3 className="subsection-title">Público-Alvo</h3>
                <p>{therapist.targetAudience}</p>
              </div>
            )}
          </div>
          
          <div className="profile-section">
            <h2 className="section-title">Valores e Serviços</h2>
            <div className="pricing-table">
              <div className="pricing-row pricing-header">
                <div className="pricing-cell">Serviço</div>
                <div className="pricing-cell">Valor</div>
                <div className="pricing-cell">Duração</div>
              </div>
              
              <div className="pricing-row">
                <div className="pricing-cell">Sessão Padrão</div>
                <div className="pricing-cell">{formatCurrency(therapist.baseSessionPrice)}</div>
                <div className="pricing-cell">{therapist.sessionDuration} minutos</div>
              </div>
              
              {therapist.servicePrices && (typeof therapist.servicePrices === 'string' ? 
                JSON.parse(therapist.servicePrices || '[]') : 
                therapist.servicePrices
              ).map((service, index) => (
                <div key={`service-${index}`} className="pricing-row">
                  <div className="pricing-cell">{service.name}</div>
                  <div className="pricing-cell">{formatCurrency(service.price)}</div>
                  <div className="pricing-cell">{service.duration || therapist.sessionDuration} minutos</div>
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar seção de endereço quando o atendimento for presencial ou híbrido */}
          {(therapist.attendanceMode === 'PRESENTIAL' || therapist.attendanceMode === 'HYBRID') && 
            therapist.address && (
            <div className="profile-section">
              <h2 className="section-title">Localização do Consultório</h2>
              <div className="address-info">
                <p className="address-line">
                  {therapist.address}
                  {therapist.complement && `, ${therapist.complement}`}
                </p>
                <p className="address-line">
                  {therapist.neighborhood && `${therapist.neighborhood}, `}
                  {therapist.city} - {therapist.state}
                </p>
                <p className="address-line">{therapist.zipCode}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-profile">
          <p>Você ainda não tem um perfil de terapeuta.</p>
          <button onClick={handleEditProfile} className="create-profile-button">
            Criar Perfil
          </button>
        </div>
      )}
    </div>
  );
};

export default TherapistProfileView; 