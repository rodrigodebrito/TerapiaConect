import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllTherapists } from '../services/therapistService';
import { getFullImageUrl } from '../utils/constants';
import './TherapistDirectory.css';

const TherapistDirectory = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    attendanceMode: 'ALL',
    maxPrice: Infinity,
    offersFreeSession: false
  });
  const [favorites, setFavorites] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState(false);
  const [noMaxPrice, setNoMaxPrice] = useState(true);
  const navigate = useNavigate();

  // Valores para filtros
  const priceRanges = [
    { label: 'Até R$ 100', value: '0-100' },
    { label: 'R$ 100 - R$ 150', value: '100-150' },
    { label: 'R$ 150 - R$ 200', value: '150-200' },
    { label: 'Acima de R$ 200', value: '200-1000' }
  ];

  const targetAudienceOptions = [
    'Adultos',
    'Adolescentes',
    'Crianças',
    'Idosos',
    'Casais',
    'Famílias',
    'LGBTQIA+',
    'Grupos'
  ];

  const attendanceModeOptions = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Online', value: 'ONLINE' },
    { label: 'Presencial', value: 'PRESENTIAL' },
    { label: 'Ambos', value: 'BOTH' }
  ];

  useEffect(() => {
    fetchTherapists();
  }, [filters, searchTerm]);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Extrair os valores min e max do preço selecionado
      let minPrice = null;
      let maxPrice = filters.maxPrice;
      
      if (typeof filters.maxPrice === 'string' && filters.maxPrice.includes('-')) {
        [minPrice, maxPrice] = filters.maxPrice.split('-').map(Number);
      }
      
      // Garantir que maxPrice seja um número válido para a API
      // Se for Infinity ou não for um número válido, não envie para a API
      const maxPriceParam = maxPrice === Infinity ? undefined : (parseInt(maxPrice) || undefined);
      
      const data = await getAllTherapists({
        attendanceMode: filters.attendanceMode,
        maxPrice: maxPriceParam,
        minPrice: minPrice || undefined,
        offersFreeSession: filters.offersFreeSession,
        searchTerm: searchTerm.trim() // Remove espaços em branco
      });
      
      // Garantir que os dados retornados são válidos
      if (Array.isArray(data)) {
        setTherapists(data);
      } else {
        console.error('Dados inválidos recebidos:', data);
        setError('Formato de dados inválido recebido do servidor.');
      }
    } catch (err) {
      console.error('Erro ao buscar terapeutas:', err);
      setError('Não foi possível carregar a lista de terapeutas. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleFavorite = (therapistId) => {
    setFavorites(prev => {
      if (prev.includes(therapistId)) {
        return prev.filter(id => id !== therapistId);
      } else {
        return [...prev, therapistId];
      }
    });
  };

  const resetFilters = () => {
    setFilters({
      attendanceMode: 'ALL',
      maxPrice: Infinity,
      offersFreeSession: false
    });
  };

  const getPriceLabel = (value) => {
    if (value >= 5000) {
      return "Sem limite de preço";
    }
    return `Até R$ ${value}`;
  };

  const handlePriceFilterChange = (value) => {
    if (noMaxPrice) {
      setNoMaxPrice(false);
    }
    handleFilterChange('maxPrice', parseInt(value));
  };

  const toggleUnlimitedPrice = () => {
    const newNoMaxPrice = !noMaxPrice;
    setNoMaxPrice(newNoMaxPrice);
    
    if (newNoMaxPrice) {
      handleFilterChange('maxPrice', Infinity);
    } else {
      handleFilterChange('maxPrice', 2500);
    }
  };

  const handleDirectPriceInput = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      value = '0';
    }
    const numValue = parseInt(value);
    
    if (numValue > 10000) {
      value = '10000';
    }
    
    handlePriceFilterChange(value);
  };

  const filteredTherapists = therapists.filter(therapist => {
    try {
      // Filtrar por termo de busca (incluindo público alvo)
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        const nameMatch = therapist.name?.toLowerCase().includes(searchTermLower);
        const bioMatch = therapist.shortBio?.toLowerCase().includes(searchTermLower);
        const targetAudienceMatch = therapist.targetAudience?.toLowerCase().includes(searchTermLower);
        
        let nichesMatch = false;
        try {
          const niches = typeof therapist.niches === 'string' ? 
            JSON.parse(therapist.niches) : 
            (Array.isArray(therapist.niches) ? therapist.niches : []);
          nichesMatch = niches.some(niche => 
            niche.toLowerCase().includes(searchTermLower)
          );
        } catch (e) {
          console.warn('Erro ao processar niches:', e);
        }

        if (!nameMatch && !bioMatch && !targetAudienceMatch && !nichesMatch) {
          return false;
        }
      }
      
      // Filtrar por modalidade de atendimento
      if (filters.attendanceMode !== 'ALL') {
        if (filters.attendanceMode === 'ONLINE' && 
            therapist.attendanceMode !== 'ONLINE' && 
            therapist.attendanceMode !== 'BOTH') {
          return false;
        }
        if (filters.attendanceMode === 'PRESENTIAL' && 
            therapist.attendanceMode !== 'PRESENTIAL' && 
            therapist.attendanceMode !== 'BOTH') {
          return false;
        }
      }
      
      // Filtrar por preço - apenas se não estiver no modo "sem limite"
      if (!noMaxPrice && filters.maxPrice !== Infinity) {
        const price = parseInt(therapist.baseSessionPrice) || 0;
        if (price > filters.maxPrice) {
          return false;
        }
      }
      
      // Filtrar por sessão gratuita
      if (filters.offersFreeSession && !therapist.offersFreeSession) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Erro ao filtrar terapeuta:', error);
      return false;
    }
  });

  // Ordenar por preço (mais barato primeiro)
  const sortedTherapists = [...filteredTherapists].sort((a, b) => 
    (a.baseSessionPrice || 0) - (b.baseSessionPrice || 0)
  );

  const viewProfile = (therapistId) => {
    navigate(`/therapist-profile/${therapistId}`);
  };

  const scheduleSession = (therapistId, isFreeSession = false) => {
    navigate(`/schedule/${therapistId}${isFreeSession ? '?free=true' : ''}`);
  };

  return (
    <div className="therapist-directory-container">
      <div className="directory-header">
        <h1>Encontre o terapeuta ideal para você</h1>
        <p className="subtitle">Nossos terapeutas são qualificados e estão prontos para ajudar você em sua jornada.</p>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nome, especialidade, público-alvo ou palavra-chave..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button className="search-button">Buscar</button>
        </div>
        
        <div className="filter-toggle">
          <button 
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="filter-toggle-button"
          >
            {filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros'} ▼
          </button>
          <button 
            onClick={() => setDebugInfo(!debugInfo)}
            className="debug-button"
            style={{ marginLeft: '10px', background: '#f1f1f1', color: '#333' }}
          >
            {debugInfo ? 'Ocultar Dados' : 'Ver Dados'}
          </button>
        </div>
      </div>

      {debugInfo && (
        <div className="debug-info" style={{ padding: '20px', background: '#f9f9f9', border: '1px solid #ddd', margin: '10px 0', borderRadius: '4px' }}>
          <h3>Informações de Depuração</h3>
          <p>Total de terapeutas carregados: {therapists.length}</p>
          <p>Terapeutas filtrados: {filteredTherapists.length}</p>
          <p>Filtros aplicados: {JSON.stringify(filters)}</p>
          <p>Termo de busca: "{searchTerm}"</p>
          <p>Detalhes dos terapeutas:</p>
          <pre style={{ overflow: 'auto', maxHeight: '300px', background: '#eee', padding: '10px' }}>
            {JSON.stringify(therapists, null, 2)}
          </pre>
        </div>
      )}

      <div className="directory-content">
        <div className={`filters-sidebar ${filtersVisible ? 'visible' : ''}`}>
          <div className="filter-section">
            <h3>Modalidade</h3>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="attendanceMode"
                  value="ALL"
                  checked={filters.attendanceMode === 'ALL'}
                  onChange={() => handleFilterChange('attendanceMode', 'ALL')}
                />
                Todos
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="attendanceMode"
                  value="ONLINE"
                  checked={filters.attendanceMode === 'ONLINE'}
                  onChange={() => handleFilterChange('attendanceMode', 'ONLINE')}
                />
                Online
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="attendanceMode"
                  value="PRESENTIAL"
                  checked={filters.attendanceMode === 'PRESENTIAL'}
                  onChange={() => handleFilterChange('attendanceMode', 'PRESENTIAL')}
                />
                Presencial
              </label>
            </div>
          </div>
          
          <div className="filter-section">
            <h3>Preço</h3>
            <div className="filter-options">
              <div className="price-filter-container">
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  disabled={noMaxPrice}
                  value={noMaxPrice ? 5000 : filters.maxPrice}
                  onChange={(e) => handlePriceFilterChange(e.target.value)}
                  className="price-slider"
                />
                
                <div className="price-filter-controls">
                  <div className="price-range">
                    {noMaxPrice ? "Sem limite de preço" : `Até R$ ${filters.maxPrice}`}
                  </div>
                </div>
                
                <label className="unlimited-price-option">
                  <input
                    type="checkbox"
                    checked={noMaxPrice}
                    onChange={toggleUnlimitedPrice}
                  />
                  Sem limite de preço
                </label>
              </div>
            </div>
          </div>
          
          <div className="filter-section">
            <h3>Outros</h3>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.offersFreeSession}
                  onChange={() => handleFilterChange('offersFreeSession', !filters.offersFreeSession)}
                />
                Oferece sessão gratuita
              </label>
            </div>
          </div>
          
          <button 
            onClick={resetFilters} 
            className="reset-filters-button"
          >
            Limpar filtros
          </button>
        </div>
        
        <div className="therapists-list">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Carregando terapeutas...</p>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredTherapists.length === 0 ? (
            <div className="no-results">
              <h3>Nenhum terapeuta encontrado</h3>
              <p>Tente ajustar seus filtros para encontrar mais opções.</p>
              <button 
                onClick={resetFilters} 
                className="reset-filters-button"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            filteredTherapists.map(therapist => (
              <div key={therapist.id} className="therapist-card">
                <div className="therapist-image-container">
                  {therapist.profilePicture ? (
                    <img 
                      src={getFullImageUrl(therapist.profilePicture)}
                      alt={therapist.name} 
                      className="therapist-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default-profile.png'; // Imagem padrão alternativa
                      }}
                    />
                  ) : (
                    <div className="therapist-image-placeholder">
                      {therapist.name ? therapist.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                
                <div className="therapist-info">
                  <div className="therapist-header">
                    <h2 className="therapist-name">
                      {therapist.name}
                      {therapist.isApproved && (
                        <span className="verified-badge" title="Profissional verificado">✓</span>
                      )}
                    </h2>
                    <button 
                      className={`favorite-button ${favorites.includes(therapist.id) ? 'favorited' : ''}`}
                      onClick={() => toggleFavorite(therapist.id)}
                      aria-label={favorites.includes(therapist.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      {favorites.includes(therapist.id) ? '★' : '☆'}
                    </button>
                  </div>
                  
                  <div className="therapist-tags">
                    <span className="therapist-tag mode">
                      {therapist.attendanceMode === 'ONLINE' ? 'Online' : 
                      therapist.attendanceMode === 'PRESENTIAL' ? 'Presencial' :
                      'Online e Presencial'}
                    </span>
                    <span className="therapist-tag location">
                      {therapist.city}, {therapist.state}
                    </span>
                  </div>
                  
                  <div className="therapist-specialties">
                    {(typeof therapist.niches === 'string' ? 
                      JSON.parse(therapist.niches || '[]') : 
                      therapist.niches || []
                    ).map((niche, index) => (
                      <span key={`${niche}-${index}`} className="specialty-item">{niche}</span>
                    ))}
                  </div>
                  
                  <p className="therapist-bio">
                    {(therapist.shortBio || '').length > 120 
                      ? `${therapist.shortBio.substring(0, 120)}...` 
                      : therapist.shortBio || 'Sem descrição disponível'}
                  </p>
                  
                  {(therapist.shortBio || '').length > 120 && (
                    <button className="read-more-button" onClick={() => viewProfile(therapist.id)}>
                      Ler mais
                    </button>
                  )}
                </div>
                
                <div className="therapist-price-info">
                  <div className="ratings">
                    <span className="rating-stars">★ {(therapist.rating || 0).toFixed(1)}</span>
                    <span className="rating-count">{therapist.reviewCount || 0} avaliações</span>
                  </div>
                  
                  <div className="price">
                    <span className="price-value">R$ {therapist.baseSessionPrice || 0}</span>
                    <span className="price-unit">Sessão de {therapist.sessionDuration || 60} minutos</span>
                  </div>
                  
                  <div className="therapist-actions">
                    {therapist.offersFreeSession && (
                      <button 
                        className="book-free-button"
                        onClick={() => scheduleSession(therapist.id, true)}
                      >
                        Agendar sessão experimental
                      </button>
                    )}
                    <button 
                      className="view-profile-button"
                      onClick={() => viewProfile(therapist.id)}
                    >
                      Ver perfil
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistDirectory; 