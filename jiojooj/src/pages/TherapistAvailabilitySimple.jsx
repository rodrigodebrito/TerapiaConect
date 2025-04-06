import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faPlus, faClock, faCalendarAlt, faCalendarDay, faCalendarWeek, faCalendar, faCheckCircle, faInfoCircle, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import './TherapistAvailabilitySimple.css';
import { useAuth } from '../contexts/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, isBefore, startOfMonth, endOfMonth, format, parseISO, parse, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [viewMode, setViewMode] = useState('calendar'); // 'table' ou 'calendar'
  const [calendarView, setCalendarView] = useState('timeGridWeek'); // timeGridDay, timeGridWeek, dayGridMonth
  const [maxPlanningDate, setMaxPlanningDate] = useState(addMonths(new Date(), 3));
  const [selectionEnabled, setSelectionEnabled] = useState(true);
  
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
  
  // Efeito para atualizar a data máxima de planejamento no início de cada mês
  useEffect(() => {
    const today = new Date();
    const maxPlanningDate = addMonths(today, 3);
    setMaxPlanningDate(maxPlanningDate);
    
    // Atualizar o máximo no primeiro dia de cada mês
    const checkForNewMonth = () => {
      const now = new Date();
      if (now.getDate() === 1) {
        const newMaxPlanningDate = addMonths(now, 3);
        setMaxPlanningDate(newMaxPlanningDate);
      }
    };
    
    // Verificar diariamente
    const dailyCheck = setInterval(checkForNewMonth, 86400000); // 24 horas
    
    // Limpar intervalo
    return () => clearInterval(dailyCheck);
  }, []);
  
  // Função para adicionar horário
  const handleAddTimeSlot = () => {
    try {
      // Validar entrada
      if (!selectedDate) {
        setError('Selecione uma data para adicionar horário');
        return;
      }
      
      // Verificar se a data está dentro do período permitido
      const selDate = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isBefore(selDate, today)) {
        setError('Não é possível adicionar horários para datas passadas');
        return;
      }
      
      if (selDate > maxPlanningDate) {
        setError(`Só é permitido adicionar horários até ${format(maxPlanningDate, 'dd/MM/yyyy', { locale: ptBR })}`);
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
      
      // Forçar a mudança para a visualização de calendário e para a data selecionada
      if (calendarRef.current) {
        calendarRef.current.getApi().gotoDate(selectedDate);
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
        
        // Verificar se temos um perfil de terapeuta
        console.log('Buscando perfil de terapeuta para o usuário:', user.id);
        const response = await api.get(`/api/therapists/user/${user.id}`);
        
        if (response.data && response.data.id) {
          console.log('Perfil de terapeuta encontrado:', response.data.id);
          setTherapistId(response.data.id);
        } else {
          console.error('Perfil de terapeuta não encontrado');
          toast.error('Perfil de terapeuta não encontrado');
          navigate('/therapist/dashboard');
        }
      } catch (error) {
        console.error('Erro ao buscar perfil de terapeuta:', error);
        toast.error('Erro ao carregar dados do terapeuta');
        navigate('/therapist/dashboard');
      }
    };
    
    getTherapistId();
  }, [user, navigate]);
  
  // Função para alternar entre os modos de visualização
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };
  
  // Função para alterar a visualização do calendário
  const changeCalendarView = (view) => {
    setCalendarView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };
  
  // Formatar eventos para o calendário
  const formatEventsForCalendar = () => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: `${event.date}T${event.startTime}`,
      end: `${event.date}T${event.endTime}`,
      backgroundColor: event.isHighlighted ? '#4caf50' : '#3788d8',
      borderColor: event.isHighlighted ? '#2e7d32' : '#2c6fdb',
      classNames: event.isHighlighted ? 'highlighted-event' : ''
    }));
  };
  
  // Função para lidar com clique em evento
  const handleEventClick = (clickInfo) => {
    const eventId = clickInfo.event.id;
    handleRemoveTimeSlot(eventId);
  };
  
  // Função para lidar com clique em data
  const handleCalendarDateClick = (info) => {
    const clickedDate = new Date(info.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Verificar se a data está dentro do período permitido
    if (isBefore(clickedDate, today)) {
      toast.warning('Não é possível adicionar horários para datas passadas');
      return;
    }
    
    if (clickedDate > maxPlanningDate) {
      toast.warning(`Só é permitido adicionar horários até ${format(maxPlanningDate, 'dd/MM/yyyy', { locale: ptBR })}`);
      return;
    }
    
    // Formatar a data no formato YYYY-MM-DD
    const formattedDate = info.dateStr.split('T')[0];
    setSelectedDate(formattedDate);
    
    // Abrir modal
    openModal();
  };
  
  // Nova função para lidar com seleção por arrastar
  const handleSelect = (selectInfo) => {
    if (!selectionEnabled) return;
    
    try {
      // Extrair os dados da seleção
      const startDate = new Date(selectInfo.start);
      const endDate = new Date(selectInfo.end);
      
      // Verificar se a data está dentro do período permitido
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isBefore(startDate, today)) {
        toast.warning('Não é possível adicionar horários para datas passadas');
        return;
      }
      
      if (startDate > maxPlanningDate) {
        toast.warning(`Só é permitido adicionar horários até ${format(maxPlanningDate, 'dd/MM/yyyy', { locale: ptBR })}`);
        return;
      }
      
      // Formatar a data no formato YYYY-MM-DD
      const formattedDate = startDate.toISOString().split('T')[0];
      
      // Extrair os horários
      const formatTime = (date) => {
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      };
      
      const startTimeStr = formatTime(startDate);
      const endTimeStr = formatTime(endDate);
      
      // Criar ID único
      const uniqueId = `specific-${formattedDate}-${startTimeStr}-${endTimeStr}-${Date.now()}`;
      
      // Criar evento
      const newEvent = {
        id: uniqueId,
        title: `Disponível: ${startTimeStr} - ${endTimeStr}`,
        date: formattedDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
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
      
      // Notificar usuário
      toast.success(`Horário adicionado para ${new Date(formattedDate).toLocaleDateString('pt-BR')}`);
      
    } catch (error) {
      console.error('Erro ao adicionar horário por seleção:', error);
      toast.error('Erro ao adicionar horário');
    } finally {
      // Limpar a seleção
      if (calendarRef.current) {
        calendarRef.current.getApi().unselect();
      }
    }
  };
  
  // Nova função para lidar com seleção permitida
  const handleSelectAllow = (selectInfo) => {
    // Verificar se a data está dentro do período permitido
    const start = new Date(selectInfo.start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(start, today)) {
      return false;
    }
    
    if (start > maxPlanningDate) {
      return false;
    }
    
    return true;
  };
  
  // Renderizar informações de restrição de data
  const renderDateRestrictionInfo = () => {
    return (
      <div className="date-restriction-info">
        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
        <span>
          Você pode programar sua disponibilidade até {format(maxPlanningDate, 'dd/MM/yyyy', { locale: ptBR })}. 
          No início de cada mês, um novo mês é liberado para programação.
        </span>
      </div>
    );
  };
  
  return (
    <div className="availability-container">
      <div className="page-header">
        <button className="back-button" onClick={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <h1>Minha Disponibilidade</h1>
      </div>
      
      {error && (
        <div className="error-alert">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="help-section">
        <h3>Como gerenciar sua disponibilidade</h3>
        <p>
          <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
          Clique e arraste no calendário para adicionar rapidamente horários disponíveis. Você também pode clicar em uma data para adicionar um horário específico.
        </p>
        {renderDateRestrictionInfo()}
        <div className="selection-tip">
          <FontAwesomeIcon icon={faCheckCircle} className="tip-icon" />
          <span>Dica: Para melhor precisão, use a visualização de dia ou semana ao adicionar horários.</span>
        </div>
      </div>
      
      <div className="view-toggle">
        <button 
          className={`view-btn ${calendarView === 'timeGridDay' ? 'active' : ''}`}
          onClick={() => changeCalendarView('timeGridDay')}
        >
          <FontAwesomeIcon icon={faCalendarDay} /> Dia
        </button>
        <button 
          className={`view-btn ${calendarView === 'timeGridWeek' ? 'active' : ''}`}
          onClick={() => changeCalendarView('timeGridWeek')}
        >
          <FontAwesomeIcon icon={faCalendarWeek} /> Semana
        </button>
        <button 
          className={`view-btn ${calendarView === 'dayGridMonth' ? 'active' : ''}`}
          onClick={() => changeCalendarView('dayGridMonth')}
        >
          <FontAwesomeIcon icon={faCalendar} /> Mês
        </button>
      </div>
      
      <div className="calendar-container">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Carregando disponibilidade...</p>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '' // removidos os botões de visualização, já que temos nossos próprios botões
            }}
            events={formatEventsForCalendar()}
            eventClick={handleEventClick}
            dateClick={handleCalendarDateClick}
            selectable={true}
            selectMirror={true}
            select={handleSelect}
            selectAllow={handleSelectAllow}
            height="auto"
            locale={ptBrLocale}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5], // Seg a Sex
              startTime: '08:00',
              endTime: '20:00',
            }}
            slotMinTime="06:00"
            slotMaxTime="23:00"
            slotDuration="00:30:00"
            snapDuration="00:15:00"
            allDaySlot={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            validRange={{
              start: new Date().toISOString().split('T')[0],
              end: format(addMonths(maxPlanningDate, 1), 'yyyy-MM-dd') // para mostrar o mês completo
            }}
          />
        )}
      </div>
      
      <div className="button-container">
        <button 
          className="save-button"
          onClick={handleSaveAvailability}
          disabled={isLoading || events.length === 0}
        >
          <FontAwesomeIcon icon={faSave} /> Salvar Disponibilidade
        </button>
      </div>
      
      {/* Modal para adicionar horário */}
      {showModal && (
        <div className="time-slot-modal">
          <div className="modal-content">
            <h3>Adicionar Horário Disponível</h3>
            <p>Data: {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
            
            {error && (
              <div className="modal-error">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>{error}</span>
              </div>
            )}
            
            <div className="time-inputs">
              <div className="input-group">
                <label htmlFor="startTime">Horário de Início:</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="endTime">Horário de Fim:</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="modal-cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button className="modal-save" onClick={handleAddTimeSlot}>
                <FontAwesomeIcon icon={faPlus} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistAvailabilitySimple; 