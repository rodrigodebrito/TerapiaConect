import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import api from '../services/api';
import { getFullImageUrl } from '../utils/constants';
import './TherapistPublicProfile.css';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTherapistAvailability } from '../services/appointmentService';

function TherapistPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Inicializar com a semana atual
  const getCurrentWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ...
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajusta para semana começar na segunda
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };
  
  // Estados
  const [therapist, setTherapist] = useState({
    name: '',
    shortBio: '',
    bio: '',
    profilePicture: '',
    niches: [],
    tools: [],
    education: '',
    experience: '',
    targetAudience: '',
    differential: '',
    baseSessionPrice: 0,
    sessionDuration: 60,
    attendanceMode: '',
    city: '',
    state: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStartDate());
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Efeito para carregar os dados do terapeuta
  useEffect(() => {
    const fetchTherapistData = async () => {
      try {
        setLoading(true);
        console.log('Buscando dados do terapeuta:', id);
        
        // Log para debugging da URL base
        console.log('URL base da API:', api.defaults.baseURL);
        
        // Corrigir a chamada para a API - usar o endpoint correto
        const response = await api.get(`/therapists/${id}`, {
          params: {
            includeDetails: true
          }
        });
        
        console.log('Dados do terapeuta recebidos:', response.data);
        
        if (response.data) {
          // Log detalhado de todos os campos importantes
          console.log('Detalhes do terapeuta recebido:');
          console.log('- ID:', response.data.id);
          console.log('- Nome:', response.data.name);
          console.log('- Bio Curta:', response.data.shortBio);
          console.log('- Bio Completa:', response.data.bio);
          console.log('- Nichos:', response.data.niches);
          console.log('- Experiência:', response.data.experience);
          console.log('- Ferramentas:', response.data.tools?.length || 0, 'ferramentas encontradas');
          
          // Processar os dados recebidos da API
          const processedData = {
            ...response.data,
            // Processar os nichos se forem uma string JSON
            niches: parseJsonField(response.data.niches, []),
            // Processar ferramentas
            tools: Array.isArray(response.data.tools) ? response.data.tools : [],
            // Processar outros campos
            bio: response.data.bio || '',
            shortBio: response.data.shortBio || '',
            education: response.data.education || '',
            experience: response.data.experience || '',
            targetAudience: response.data.targetAudience || '',
            baseSessionPrice: Number(response.data.baseSessionPrice) || 0,
            sessionDuration: Number(response.data.sessionDuration) || 60,
            profilePicture: response.data.profilePicture || ''
          };
          
          console.log('Dados processados para exibição:', processedData);
          setTherapist(processedData);
        } else {
          console.error('Resposta da API não contém dados do terapeuta');
          setError('Dados do terapeuta não encontrados');
        }
        
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dados do terapeuta:', err);
        setError(`Não foi possível carregar os dados do terapeuta: ${err.message || 'Erro desconhecido'}`);
        
        // Tentar novamente caso haja erro (max 3 tentativas)
        if (retryCount < 2) {
          console.log(`Tentando novamente (${retryCount + 1}/3)...`);
          setTimeout(() => {
            setRetryCount(retryCount + 1);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTherapistData();
    }
  }, [id, retryCount]);

  // Função auxiliar para processar campos JSON
  const parseJsonField = (field, defaultValue) => {
    if (!field) return defaultValue;
    
    try {
      if (typeof field === 'string') {
        return JSON.parse(field);
      }
      if (Array.isArray(field)) {
        return field;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Erro ao processar campo JSON:`, error);
      return defaultValue;
    }
  };

  // Efeito para carregar a disponibilidade ao mudar a semana
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setAvailabilityLoading(true);
        
        if (!id) return;
        
        console.log('Buscando disponibilidade para a semana de:', formatCurrentWeek());
        
        // Obter o mês e ano da semana atual
        const month = currentWeek.getMonth() + 1; // getMonth() retorna 0-11
        const year = currentWeek.getFullYear();
        
        // Buscar disponibilidade
        const availabilityData = await getTherapistAvailability(id);
        console.log('Disponibilidade do terapeuta:', availabilityData);
        
        if (availabilityData && Array.isArray(availabilityData)) {
          // Criar mapa de disponibilidade a partir dos dados reais
          const map = createAvailabilityMapFromData(availabilityData);
          setAvailabilityMap(map);
        } else {
          setAvailabilityMap({});
        }
      } catch (err) {
        console.error('Erro ao carregar disponibilidade:', err);
        toast.error('Não foi possível carregar os horários disponíveis.');
      } finally {
        setAvailabilityLoading(false);
      }
    };
    
    if (!loading && therapist) {
      fetchAvailability();
    }
  }, [id, currentWeek, therapist, loading]);
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
  };
  
  const navigateToScheduling = (timeSlot = null, toolId = null) => {
    if (!timeSlot || !toolId) return;
    
    const selectedToolInfo = therapist.tools?.find(tool => tool.id === toolId) || {
      id: 'default',
      name: 'Terapia Individual',
      price: therapist.price || 150
    };
    
    // Navegar para o agendamento com o horário e ferramenta selecionados
    navigate(`/schedule/${id}`, { 
      state: { 
        therapist, 
        selectedDate: timeSlot.date,
        selectedTime: timeSlot.time,
        selectedTool: selectedToolInfo
      } 
    });
  };
  
  const getFormattedDate = (date) => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const getISOFormattedDate = (date) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };
  
  // Lidar com a seleção de dia
  const handleDaySelect = (day) => {
    // Permitir seleção apenas para dias não passados
    if (day && !day.isPast) {
      setSelectedDay(day);
      setSelectedTimeSlot(null); // Limpar horário selecionado anteriormente
      setSelectedTool(null); // Limpar ferramenta selecionada quando muda o dia
    }
  };
  
  // Lidar com a seleção de horário
  const handleTimeSlotSelect = (time, date) => {
    if (!time || !date) {
      console.log('Erro: time ou date indefinidos');
      return;
    }
    
    console.log('Tentando selecionar horário:', time, 'data:', date);
    
    // Verificar se o horário já passou
    const day = weekDays.find(d => d.full.toDateString() === date.toDateString());
    if (day && isTimeSlotPast(day, time)) {
      console.log('Horário já passou, não pode ser selecionado');
      return;
    }
    
    const formattedDate = getFormattedDate(date);
    console.log('Selecionando horário:', time, 'data formatada:', formattedDate);
    
    setSelectedTimeSlot({ time, date: formattedDate });
    
    // Mostra toast confirmando a seleção
    toast.info(`Horário selecionado: ${time} em ${formattedDate}`);
  };
  
  // Manipular a seleção de ferramenta terapêutica
  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
  };
  
  // Função para navegar para o agendamento com os parâmetros selecionados
  const handleContinueToScheduling = () => {
    if (!selectedTimeSlot || !selectedTool) return;
    navigateToScheduling(selectedTimeSlot, selectedTool);
  };
  
  // Formatar a semana atual para exibição
  const formatCurrentWeek = () => {
    const startDate = new Date(currentWeek);
    const endDate = new Date(currentWeek);
    endDate.setDate(endDate.getDate() + 6);
    
    const startMonth = format(startDate, 'MMM', { locale: ptBR });
    const endMonth = format(endDate, 'MMM', { locale: ptBR });
    
    // Se a semana estiver dentro do mesmo mês
    if (startMonth === endMonth) {
      return `${format(startDate, 'dd', { locale: ptBR })} - ${format(endDate, 'dd', { locale: ptBR })} de ${startMonth} de ${format(startDate, 'yyyy', { locale: ptBR })}`;
    }
    
    // Se a semana abranger dois meses
    return `${format(startDate, 'dd MMM', { locale: ptBR })} - ${format(endDate, 'dd MMM', { locale: ptBR })} de ${format(startDate, 'yyyy', { locale: ptBR })}`;
  };
  
  // Navegar para a semana anterior
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    
    // Verifica se a semana anterior não é uma semana passada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (prevWeek >= today) {
      setCurrentWeek(prevWeek);
    } else {
      // Limitar a semanas a partir de hoje
      toast.info('Não é possível visualizar semanas passadas.');
    }
  };
  
  // Navegar para a próxima semana
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };
  
  // Criar um mapa de disponibilidade a partir dos dados reais recebidos da API
  const createAvailabilityMapFromData = (availabilityData) => {
    const map = {};
    
    availabilityData.forEach(slot => {
      // Assegurar que a data está no formato ISO YYYY-MM-DD
      const dateKey = slot.date;
      
      // Inicializar o array para esta data se ainda não existir
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      
      // Adicionar o horário ao array desta data
      map[dateKey].push(slot.startTime);
    });
    
    return map;
  };
  
  // Função para gerar os dias da semana
  const generateWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentWeek);
    
    // Nomes abreviados dos dias em português
    const dayNames = ['Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.', 'Dom.'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      
      // Verificar se é o dia atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();
      
      days.push({
        name: dayNames[i],
        date: date.getDate(),
        full: date,
        isPast: date < new Date().setHours(0, 0, 0, 0), // Verifica se o dia já passou
        isToday
      });
    }
    
    return days;
  };
  
  // Verificar se um horário é passado
  const isTimeSlotPast = (day, time) => {
    if (!day || !time) return false;
    
    // Se o dia já passou, o horário também passou
    if (day.isPast) return true;
    
    // Se for hoje, verifica se o horário já passou
    if (day.isToday) {
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const dateTime = new Date(day.full);
      dateTime.setHours(hours, minutes, 0, 0);
      
      return dateTime < now;
    }
    
    return false;
  };

  // Agrupamento de horários por período do dia
  const groupTimeSlotsByPeriod = (timeSlotsArray) => {
    const periods = {
      'Manhã': [],
      'Tarde': [],
      'Noite': []
    };

    timeSlotsArray.forEach(time => {
      const hour = parseInt(time.split(':')[0]);
      
      if (hour < 12) {
        periods['Manhã'].push(time);
      } else if (hour < 18) {
        periods['Tarde'].push(time);
      } else {
        periods['Noite'].push(time);
      }
    });

    return periods;
  };
  
  // Adicionar essa função de tradução em algum lugar no arquivo
  const translateAttendanceMode = (mode) => {
    const modes = {
      'ONLINE': 'Apenas Online',
      'IN_PERSON': 'Apenas Presencial',
      'HYBRID': 'Online e Presencial'
    };
    return modes[mode] || 'Não especificado';
  };
  
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (loading) {
    return (
      <div className="therapist-profile-public-container">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando perfil do terapeuta...</p>
        </div>
      </div>
    );
  }
  
  if (error || !therapist) {
    return (
      <div className="therapist-profile-public-container">
        <Header />
        <div className="error-container">
          <div className="error-card">
            <div className="error-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h2>Oops! Ocorreu um problema</h2>
            <p>{error || 'Não foi possível carregar os dados do terapeuta'}</p>
            <div className="error-actions">
              <button 
                className="btn-retry" 
                onClick={() => setRetryCount(retryCount + 1)}
              >
                <i className="fas fa-sync-alt"></i> Tentar novamente
              </button>
              <button 
                className="btn-directory" 
                onClick={() => navigate('/directory')}
              >
                <i className="fas fa-arrow-left"></i> Voltar ao Diretório
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dias da semana para a visualização de disponibilidade
  const weekDays = generateWeekDays();
  
  return (
    <div className="therapist-profile-public-container">
      <Header />
      
      <div className="profile-content">
        {/* Cabeçalho do perfil */}
        <div className="profile-header card">
          <div className="profile-image-container">
            {therapist.profilePicture ? (
              <img 
                src={getFullImageUrl(therapist.profilePicture)} 
                alt={`${therapist.name}`} 
                className="profile-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=' + getInitials(therapist.name);
                }}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {getInitials(therapist.name)}
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <div className="profile-name-container">
              <h2 className="profile-name">{`${therapist.firstName || ''} ${therapist.lastName || ''}`}</h2>
              <button 
                className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                onClick={toggleFavorite}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <i className={`fas fa-heart ${isFavorite ? 'fas' : 'far'}`}></i>
              </button>
            </div>
            
            <p className="profile-title">{therapist.title || 'Psicoterapeuta'}</p>
            
            <div className="tags-container">
              <span className="status-tag">
                <i className="fas fa-circle"></i> {therapist.status === 'ACTIVE' ? 'Em verificação' : 'Verificado'}
              </span>
              <span className="location-tag">
                <i className="fas fa-map-marker-alt"></i> {therapist.city || 'Local não informado'}, {therapist.state || ''}
              </span>
              <span className="session-tag">
                <i className="fas fa-video"></i> Online e Presencial
              </span>
            </div>
            
            <div className="specialties-container">
              {therapist.niches && therapist.niches.length > 0 ? (
                therapist.niches.slice(0, 5).map((niche, index) => (
                  <span key={index} className="specialty-tag">{niche}</span>
                ))
              ) : (
                <span className="specialty-tag">Terapia Geral</span>
              )}
              {therapist.niches && therapist.niches.length > 5 && (
                <span className="specialty-tag more-tag">+{therapist.niches.length - 5}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Navegação por abas */}
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            Sobre
          </button>
          <button 
            className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Serviços e Preços
          </button>
          <button 
            className={`tab-button ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            Agendar Sessão
          </button>
          <button 
            className={`tab-button ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            Localização
          </button>
        </div>
        
        {/* Conteúdo da aba selecionada */}
        <div className="tab-content card">
          {/* Sobre */}
          {activeTab === 'about' && (
            <div className="about-section">
              <div className="section-content">
                <h3>Sobre</h3>
                {loading ? (
                  <div className="loading-placeholder">Carregando informações...</div>
                ) : (
                  <>
                    {therapist.bio ? (
                      <div className="bio">
                        {therapist.bio.split('\n').map((paragraph, idx) => (
                          <p key={idx}>{paragraph}</p>
                        ))}
                      </div>
                    ) : therapist.shortBio ? (
                      <div className="bio">
                        <p>{therapist.shortBio}</p>
                      </div>
                    ) : (
                      <div className="empty-content">
                        Este terapeuta ainda não adicionou informações sobre sua biografia.
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {!loading && (
                <div className="section-content">
                  <h3>Experiência Profissional</h3>
                  {therapist.experience ? (
                    <div className="experience">
                      {therapist.experience.split('\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-content">
                      Este terapeuta ainda não adicionou informações sobre sua experiência profissional.
                    </div>
                  )}
                </div>
              )}
              
              {!loading && (
                <div className="section-content">
                  <h3>Formação</h3>
                  {therapist.education ? (
                    <div className="education">
                      {therapist.education.split('\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-content">
                      Este terapeuta ainda não adicionou informações sobre sua formação.
                    </div>
                  )}
                </div>
              )}
              
              {!loading && therapist.targetAudience && (
                <div className="section-content">
                  <h3>Público-Alvo</h3>
                  <div className="target-audience">
                    <p>{therapist.targetAudience}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Serviços e Preços */}
          {activeTab === 'services' && (
            <div className="services-tab">
              <h3>Serviços e Preços</h3>
              
              {loading ? (
                <div className="loading-placeholder">Carregando serviços...</div>
              ) : (
                <>
                  <div className="services-list">
                    {therapist.tools && therapist.tools.length > 0 ? (
                      therapist.tools.map((tool, index) => (
                        <div key={index} className="service-item" onClick={() => handleToolSelect(tool.id)}>
                          <div className="service-header">
                            <div className="service-name">{tool.name}</div>
                            <div className="service-price">
                              R$ {tool.price || therapist.baseSessionPrice || 0}
                              <span className="price-duration">/{tool.duration || therapist.sessionDuration || 60} min</span>
                            </div>
                          </div>
                          {tool.description && (
                            <div className="service-description">{tool.description}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="empty-content">
                        Este terapeuta ainda não adicionou informações sobre seus serviços.
                      </div>
                    )}
                  </div>

                  {therapist.offersFreeSession && (
                    <div className="free-session-info">
                      <div className="info-icon">🎁</div>
                      <div className="info-content">
                        <h4>Sessão Experimental Gratuita</h4>
                        <p>Este terapeuta oferece uma primeira sessão gratuita de {therapist.freeSessionDuration || 30} minutos para novos clientes.</p>
                      </div>
                    </div>
                  )}

                  <div className="additional-info">
                    <h4>Informações Adicionais</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <div className="info-icon">🏠</div>
                        <div className="info-content">
                          <h5>Modalidade de Atendimento</h5>
                          <p>{translateAttendanceMode(therapist.attendanceMode)}</p>
                        </div>
                      </div>
                      
                      {therapist.city && therapist.state && (
                        <div className="info-item">
                          <div className="info-icon">📍</div>
                          <div className="info-content">
                            <h5>Localização</h5>
                            <p>{therapist.city}, {therapist.state}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="info-item">
                        <div className="info-icon">⏱️</div>
                        <div className="info-content">
                          <h5>Duração Padrão das Sessões</h5>
                          <p>{therapist.sessionDuration || 60} minutos</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Agendar Sessão */}
          {activeTab === 'booking' && (
            <div className="booking-tab">
              <h3>Agendar Sessão</h3>
              <p className="booking-subtitle">Selecione uma data e horário para sua sessão terapêutica</p>
              
              <div className="booking-content">
                <div className="week-navigation">
                  <button className="nav-button prev" onClick={goToPreviousWeek}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="current-week">{formatCurrentWeek()}</span>
                  <button className="nav-button next" onClick={goToNextWeek}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                
                <div className="calendar-days">
                  {weekDays.map((day, index) => (
                    <div 
                      key={index} 
                      className={`calendar-day ${day.isToday ? 'today' : ''} ${day.isPast ? 'past' : ''} ${selectedDay && day.full.toDateString() === selectedDay.full.toDateString() ? 'selected' : ''}`}
                      onClick={() => handleDaySelect(day)}
                    >
                      <div className="day-name">{day.name}</div>
                      <div className="day-number">{day.date}</div>
                    </div>
                  ))}
                </div>
                
                {availabilityLoading ? (
                  <div className="loading-container small">
                    <div className="loading-spinner"></div>
                    <p>Carregando horários...</p>
                  </div>
                ) : selectedDay ? (
                  <div className="time-slots-container">
                    {(() => {
                      const dateKey = getISOFormattedDate(selectedDay.full);
                      const timeSlotsForDay = availabilityMap[dateKey] || [];
                      
                      if (timeSlotsForDay.length > 0) {
                        const periodGroups = groupTimeSlotsByPeriod(timeSlotsForDay);
                        
                        return (
                          <>
                            <div className="time-slots-wrapper">
                              {Object.entries(periodGroups).map(([period, slots], periodIndex) => (
                                slots.length > 0 && (
                                  <div key={periodIndex} className="time-period">
                                    <h4 className="period-title">
                                      <i className={`fas ${period === 'Manhã' ? 'fa-sun' : period === 'Tarde' ? 'fa-cloud-sun' : 'fa-moon'}`}></i> 
                                      {period}
                                    </h4>
                                    <div className="period-slots">
                                      {slots.map((time, timeIndex) => {
                                        const isPastTime = isTimeSlotPast(selectedDay, time);
                                        const isSelected = selectedTimeSlot && selectedTimeSlot.time === time;
                                        
                                        return (
                                          <button
                                            key={timeIndex}
                                            className={`time-slot-btn ${isSelected ? 'selected' : ''} ${isPastTime ? 'disabled' : ''}`}
                                            onClick={() => handleTimeSlotSelect(time, selectedDay.full)}
                                            disabled={isPastTime}
                                            type="button"
                                          >
                                            {time}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                            
                            {selectedTimeSlot && (
                              <div className="tools-selection fade-in">
                                <h4>Selecione uma Ferramenta Terapêutica</h4>
                                <div className="tools-list">
                                  {therapist.tools && therapist.tools.map((tool, index) => (
                                    <div 
                                      key={index}
                                      className={`tool-card ${selectedTool === tool.id ? 'selected' : ''}`}
                                      onClick={() => handleToolSelect(tool.id)}
                                      role="button"
                                      tabIndex={0}
                                    >
                                      <div className="tool-info">
                                        <h5>{tool.name}</h5>
                                        <p>{tool.description || 'Sessão de terapia utilizando essa abordagem específica.'}</p>
                                        <div className="tool-details">
                                          <span className="tool-duration"><i className="far fa-clock"></i> 50 minutos</span>
                                          <span className="tool-price">R$ {tool.price || therapist.price || 150}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {(!therapist.tools || therapist.tools.length === 0) && (
                                    <div 
                                      className={`tool-card ${selectedTool === 'default' ? 'selected' : ''}`}
                                      onClick={() => handleToolSelect('default')}
                                      role="button"
                                      tabIndex={0}
                                    >
                                      <div className="tool-info">
                                        <h5>Terapia Individual</h5>
                                        <p>Sessão de terapia individual padrão.</p>
                                        <div className="tool-details">
                                          <span className="tool-duration"><i className="far fa-clock"></i> 50 minutos</span>
                                          <span className="tool-price">R$ {therapist.price || 150}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="timezone-info">
                              Em seu fuso horário: America/Sao_Paulo (GMT -3:00)
                            </div>
                            
                            <div className="booking-actions">
                              <button 
                                className="btn-continue"
                                disabled={!selectedTimeSlot || !selectedTool}
                                onClick={handleContinueToScheduling}
                                type="button"
                              >
                                Continuar
                              </button>
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <div className="no-slots-message">
                            <i className="fas fa-calendar-times"></i>
                            <p>Não há horários disponíveis para esta data.</p>
                            <p>Por favor, selecione outra data ou entre em contato com o terapeuta.</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  <div className="select-day-message">
                    <i className="fas fa-calendar-day"></i>
                    <p>Selecione um dia para ver os horários disponíveis</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Localização */}
          {activeTab === 'location' && (
            <div className="location-tab">
              <h3>Localização</h3>
              
              <div className="address-container">
                <p>
                  <i className="fas fa-map-marker-alt"></i> 
                  {therapist.street}, {therapist.number} - {therapist.neighborhood}
                </p>
                <p>{therapist.city}, {therapist.state} - CEP {therapist.zipcode}</p>
              </div>
              
              <div className="map-container">
                <img src="/assets/map-placeholder.png" alt="Mapa do local" className="map-image" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TherapistPublicProfile; 