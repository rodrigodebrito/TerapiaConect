import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faPlus, faClock, faCalendarAlt, faListAlt, faCalendarDay, faCalendarWeek, faCalendar, faCheckCircle, faInfoCircle, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import './TherapistAvailabilitySimple.css';
import { useAuth } from '../contexts/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { v4 as uuidv4 } from 'uuid';

const TherapistAvailabilitySimple = () => {
  // Estados
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [therapistId, setTherapistId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'calendar'
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  
  // Referência para o calendário
  const calendarRef = useRef(null);
  
  // Contexto de autenticação
  const { user } = useAuth();
  
  // Navegação
  const navigate = useNavigate();
  
  // Função para voltar
  const handleGoBack = () => {
    navigate('/therapist/dashboard');
  };
  
  // Função para adicionar horário
  const handleAddTimeSlot = () => {
    try {
      // Validar entrada
      if (!selectedDate) {
        setError('Selecione uma data para adicionar horário');
        return;
      }
      
      if (!startTime || !endTime) {
        setError('Horários de início e fim são obrigatórios');
        return;
      }
      
      // Validar horários
      if (startTime >= endTime) {
        setError('O horário de início deve ser anterior ao horário de fim');
        return;
      }
      
      // Criar ID único
      const uniqueId = `specific-${selectedDate}-${startTime}-${endTime}-${Date.now()}`;
      
      // Criar evento
      const newEvent = {
        id: uniqueId,
        title: `Disponível: ${startTime} - ${endTime}`,
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        isHighlighted: true // Marcar como destacado para efeito visual
      };
      
      // Adicionar ao estado
      setEvents(prevEvents => {
        // Remover destaque de todos os eventos
        const resetEvents = prevEvents.map(event => ({
          ...event,
          isHighlighted: false
        }));
        return [...resetEvents, newEvent];
      });
      
      // Fechar modal
      setShowModal(false);
      
      // Limpar campos
      setStartTime('');
      setEndTime('');
      setError(null);
      
      // Notificar usuário
      toast.success(`Horário adicionado para ${new Date(selectedDate).toLocaleDateString('pt-BR')}`);
      
      // Forçar a mudança para a visualização de tabela e para a data selecionada
      if (viewMode !== 'table') {
        toggleViewMode('table');
        // Um pequeno atraso para garantir que a transição ocorra após a mudança de modo
        setTimeout(() => {
          if (calendarRef.current) {
            calendarRef.current.getApi().gotoDate(selectedDate);
          }
        }, 300);
      }
      
    } catch (error) {
      console.error('Erro ao adicionar horário:', error);
      setError('Erro ao adicionar horário');
    }
  };
  
  // Função para remover horário
  const handleRemoveTimeSlot = (eventId) => {
    // Confirmação
    if (window.confirm('Deseja remover este horário?')) {
      // Remover evento
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      toast.success('Horário removido com sucesso');
    }
  };
  
  // Função para salvar disponibilidade
  const handleSaveAvailability = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar se há eventos
      if (events.length === 0) {
        toast.error('Não há horários para salvar');
        setIsLoading(false);
        return;
      }
      
      // Verificar se temos ID do terapeuta
      if (!therapistId) {
        toast.error('ID do terapeuta não encontrado. Tente recarregar a página.');
        setError('ID do terapeuta não encontrado');
        setIsLoading(false);
        return;
      }
      
      // Preparar dados para API
      const availabilityData = events.map(event => ({
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        isRecurring: false
      }));
      
      // Enviar para o servidor
      console.log(`Salvando disponibilidade para terapeuta ${therapistId}`);
      const response = await api.post(`/therapists/${therapistId}/availability`, {
        availability: availabilityData
      });
      
      console.log('Resposta do servidor:', response);
      
      if (response.status === 200) {
        toast.success('Disponibilidade salva com sucesso!');
      } else {
        throw new Error('Erro ao salvar disponibilidade');
      }
    } catch (error) {
      console.error('Erro ao salvar disponibilidade:', error);
      setError(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      toast.error('Erro ao salvar disponibilidade');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para mudar a data
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };
  
  // Função para abrir modal
  const openModal = () => {
    setShowModal(true);
    setError(null);
  };
  
  // Função para fechar modal
  const closeModal = () => {
    setShowModal(false);
    setError(null);
  };
  
  // Adicionar useEffect para carregar disponibilidades existentes
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        
        // Aguardar até que tenhamos o ID do terapeuta
        if (!therapistId) {
          console.log('Aguardando ID do terapeuta para carregar disponibilidade...');
          return;
        }
        
        console.log(`Buscando disponibilidade para terapeuta ID: ${therapistId}`);
        
        // Fazer requisição para a API
        const response = await api.get(`/therapists/${therapistId}/availability`);
        
        console.log('Resposta da API:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Filtrar apenas eventos específicos (não recorrentes)
          const specificSlots = response.data.filter(slot => slot.isRecurring === false);
          
          console.log(`${specificSlots.length} slots específicos encontrados`);
          
          // Converter para o formato de eventos
          const formattedEvents = specificSlots.map(slot => ({
            id: `specific-${slot.date}-${slot.startTime}-${slot.endTime}`,
            title: `Disponível: ${slot.startTime} - ${slot.endTime}`,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime
          }));
          
          // Definir eventos
          setEvents(formattedEvents);
          toast.success(`${formattedEvents.length} horários carregados`);
        }
      } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
        toast.error('Erro ao carregar disponibilidade');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Executar quando o therapistId estiver disponível
    if (therapistId) {
      fetchAvailability();
    }
  }, [therapistId]);
  
  // Efeito para obter o ID do terapeuta
  useEffect(() => {
    const getTherapistId = async () => {
      try {
        if (!user || !user.id) {
          console.error('Usuário não encontrado ou não autenticado');
          toast.error('Por favor, faça login novamente');
          navigate('/login');
          return;
        }
        
        // Se o usuário for terapeuta e já tiver o ID
        if (user.therapistId) {
          setTherapistId(user.therapistId);
          console.log(`ID do terapeuta obtido do usuário: ${user.therapistId}`);
          return;
        }
        
        // Tentar obter do localStorage
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile && profile.id) {
            setTherapistId(profile.id);
            console.log(`ID do terapeuta obtido do localStorage: ${profile.id}`);
            return;
          }
        }
        
        // Se não encontrou, buscar da API
        console.log(`Buscando terapeuta para o usuário ID: ${user.id}`);
        const response = await api.get(`/therapists/user/${user.id}`);
        
        if (response.data && response.data.id) {
          setTherapistId(response.data.id);
          console.log(`ID do terapeuta obtido da API: ${response.data.id}`);
          
          // Salvar no localStorage para uso futuro
          localStorage.setItem('userProfile', JSON.stringify(response.data));
        } else {
          throw new Error('Não foi possível encontrar o perfil de terapeuta');
        }
      } catch (error) {
        console.error('Erro ao obter ID do terapeuta:', error);
        setError('Erro ao obter perfil de terapeuta. Por favor, verifique se você está cadastrado como terapeuta.');
        toast.error('Erro ao carregar perfil de terapeuta');
      }
    };
    
    getTherapistId();
  }, [user, navigate]);
  
  // Função para alternar entre os modos de visualização
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };
  
  // Função para mudar a visualização do calendário
  const changeCalendarView = (view) => {
    setCalendarView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };
  
  // Função para formatar eventos para o FullCalendar
  const formatEventsForCalendar = () => {
    return events.map(event => ({
      id: event.id,
      title: `Disponível: ${event.startTime} - ${event.endTime}`,
      start: `${event.date}T${event.startTime}`,
      end: `${event.date}T${event.endTime}`,
      backgroundColor: '#4caf50',
      borderColor: '#2e7d32',
      textColor: '#ffffff',
      extendedProps: {
        ...event
      }
    }));
  };
  
  // Função para lidar com clique em evento no calendário
  const handleEventClick = (clickInfo) => {
    const eventId = clickInfo.event.id;
    
    if (window.confirm('Deseja remover este horário?')) {
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      toast.success('Horário removido com sucesso');
    }
  };
  
  // Função para lidar com clique em data no calendário
  const handleCalendarDateClick = (info) => {
    const clickedDate = info.dateStr.split('T')[0];
    setSelectedDate(clickedDate);
    openModal();
  };
  
  // Render
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="d-flex align-items-center">
              <div className="icon-bg bg-gradient-primary rounded-circle p-2 me-3 shadow-sm">
                <FontAwesomeIcon icon={faClock} className="text-white" />
              </div>
              <span className="transition-all">Gerenciar Disponibilidade</span>
            </h2>
            <div>
              <button 
                className="btn btn-primary me-2 shadow btn-add" 
                onClick={handleSaveAvailability}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Salvar
                {isLoading && <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>}
              </button>
              <button className="btn btn-secondary shadow btn-add" onClick={handleGoBack}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Voltar
              </button>
            </div>
          </div>
          
          {error && (
            <div className="alert alert-danger shadow-sm">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 fa-lg" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {/* Status Cards */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-gradient-success p-3 me-3">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-white fa-lg" />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Total de Horários</h6>
                    <h3 className="mb-0">{events.length} <small className="text-muted fs-6">horários</small></h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-gradient-primary p-3 me-3">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-white fa-lg" />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Horários Hoje</h6>
                    <h3 className="mb-0">
                      {events.filter(event => event.date === new Date().toISOString().split('T')[0]).length} 
                      <small className="text-muted fs-6">disponíveis</small>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-gradient-info p-3 me-3">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-white fa-lg" />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-bold">Status</h6>
                    <div className="d-flex align-items-center">
                      <span className="status-indicator status-available"></span>
                      <span className="fw-bold text-success">Dados Sincronizados</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Controles de visualização */}
          <div className="card shadow mb-4 border-0">
            <div className="card-header bg-gradient-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Modo de Visualização
                </h5>
                <div className="btn-group shadow-sm" role="group">
                  <button 
                    type="button" 
                    className={`btn ${viewMode === 'table' ? 'btn-light' : 'btn-outline-light'}`}
                    onClick={() => toggleViewMode('table')}
                  >
                    <FontAwesomeIcon icon={faListAlt} className="me-2" />
                    Tabela
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${viewMode === 'calendar' ? 'btn-light' : 'btn-outline-light'}`}
                    onClick={() => toggleViewMode('calendar')}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Calendário
                  </button>
                </div>
              </div>
            </div>
            
            {viewMode === 'calendar' && (
              <div className="card-body p-0">
                <div className="btn-group w-100 shadow-sm">
                  <button 
                    className={`btn ${calendarView === 'timeGridDay' ? 'btn-primary' : 'btn-outline-primary'} btn-add`}
                    onClick={() => changeCalendarView('timeGridDay')}
                  >
                    <FontAwesomeIcon icon={faCalendarDay} className="me-2" />
                    Diário
                  </button>
                  <button 
                    className={`btn ${calendarView === 'timeGridWeek' ? 'btn-primary' : 'btn-outline-primary'} btn-add`}
                    onClick={() => changeCalendarView('timeGridWeek')}
                  >
                    <FontAwesomeIcon icon={faCalendarWeek} className="me-2" />
                    Semanal
                  </button>
                  <button 
                    className={`btn ${calendarView === 'dayGridMonth' ? 'btn-primary' : 'btn-outline-primary'} btn-add`}
                    onClick={() => changeCalendarView('dayGridMonth')}
                  >
                    <FontAwesomeIcon icon={faCalendar} className="me-2" />
                    Mensal
                  </button>
                </div>
              </div>
            )}
            
            {viewMode === 'table' && (
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="dateSelector" className="form-label fw-bold">Data</label>
                      <div className="input-group shadow-sm">
                        <span className="input-group-text bg-light">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                        </span>
                        <input 
                          type="date" 
                          className="form-control" 
                          id="dateSelector"
                          value={selectedDate}
                          onChange={handleDateChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 d-flex align-items-end">
                    <button 
                      className="btn btn-success mb-3 add-time-button shadow btn-add" 
                      onClick={openModal}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Adicionar Horário
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Visualização de Calendário */}
          {viewMode === 'calendar' && (
            <div className="card shadow mb-4 border-0">
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    locale={ptBrLocale}
                    headerToolbar={false}
                    events={formatEventsForCalendar()}
                    eventClick={handleEventClick}
                    dateClick={handleCalendarDateClick}
                    height="auto"
                    allDaySlot={false}
                    slotMinTime="07:00:00"
                    slotMaxTime="22:00:00"
                    slotDuration="00:30:00"
                    nowIndicator={true}
                  />
                )}
                <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center">
                  <div className="date-display">
                    <span className="badge bg-gradient-primary p-2 rounded-pill shadow-sm">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      {new Date(selectedDate).toLocaleDateString('pt-BR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                    </span>
                  </div>
                  <button 
                    className="btn btn-success add-time-button shadow btn-add" 
                    onClick={openModal}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Adicionar Horário
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Visualização em Tabela */}
          {viewMode === 'table' && (
            <div className="card shadow border-0">
              <div className="card-header bg-gradient-success text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  Horários Disponíveis para {new Date(selectedDate).toLocaleDateString('pt-BR')}
                </h5>
              </div>
              <div className="card-body">
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                  </div>
                ) : events.filter(event => event.date === selectedDate).length === 0 ? (
                  <div className="alert alert-info shadow-sm">
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-3 fa-2x text-primary" />
                      <div>
                        <h6 className="fw-bold mb-1">Nenhum horário disponível para esta data</h6>
                        <p className="mb-0">Clique em "Adicionar Horário" para começar.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="table-container">
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Horário de Início</th>
                            <th>Horário de Fim</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events
                            .filter(event => event.date === selectedDate)
                            .map(event => (
                              <tr 
                                key={event.id} 
                                className={`transition-all ${event.isHighlighted ? 'selected-event' : ''}`}
                              >
                                <td>{new Date(event.date).toLocaleDateString('pt-BR')}</td>
                                <td>
                                  <span className="badge bg-gradient-primary text-white rounded-pill">
                                    {event.startTime}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-gradient-info text-white rounded-pill">
                                    {event.endTime}
                                  </span>
                                </td>
                                <td>
                                  <button 
                                    className="btn btn-sm btn-danger shadow-sm btn-add"
                                    onClick={() => handleRemoveTimeSlot(event.id)}
                                  >
                                    <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold mb-3 text-primary">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Todos os Horários Cadastrados:
                  </h6>
                  <div className="table-container">
                    <div className="table-responsive shadow-sm rounded">
                      <table className="table table-sm table-striped mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Data</th>
                            <th>Horário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map(event => (
                            <tr key={event.id} className="transition-all">
                              <td>{new Date(event.date).toLocaleDateString('pt-BR')}</td>
                              <td>
                                <span className="badge bg-gradient-success text-white rounded-pill">
                                  {event.startTime} - {event.endTime}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para adicionar horário */}
      {showModal && (
        <div className="modal-backdrop show" style={{display: 'block'}}></div>
      )}
      
      <div className={`modal fade ${showModal ? 'show' : ''}`} style={{display: showModal ? 'block' : 'none'}} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-gradient-primary text-white">
              <h5 className="modal-title">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Adicionar Horário para {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger shadow-sm">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="startTime" className="form-label fw-bold">Horário de Início</label>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-light">
                    <FontAwesomeIcon icon={faClock} />
                  </span>
                  <input 
                    type="time" 
                    className="form-control" 
                    id="startTime" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="endTime" className="form-label fw-bold">Horário de Fim</label>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-light">
                    <FontAwesomeIcon icon={faClock} />
                  </span>
                  <input 
                    type="time" 
                    className="form-control" 
                    id="endTime" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="alert alert-info shadow-sm mt-4">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Defina os horários em que você estará disponível para atendimentos.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary shadow-sm btn-add" onClick={closeModal}>Cancelar</button>
              <button type="button" className="btn btn-primary shadow add-time-button btn-add" onClick={handleAddTimeSlot}>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistAvailabilitySimple; 