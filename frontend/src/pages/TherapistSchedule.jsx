import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import api from '../services/api';
import './TherapistSchedule.css';

const TherapistSchedule = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [therapistId, setTherapistId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    fetchTherapistProfile();
  }, []);

  useEffect(() => {
    if (therapistId) {
      fetchAppointments();
    }
  }, [therapistId]);
  
  const handleError = (error) => {
    console.error('Erro:', error);
    
    if (error.response) {
      // Erro com resposta do servidor
      if (error.response.status === 401) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        logout();
        navigate('/login');
      } else if (error.response.status === 403) {
        toast.error('Você não tem permissão para acessar estes dados.');
        navigate('/therapist/dashboard');
      } else if (error.response.status === 404) {
        toast.error('Perfil de terapeuta não encontrado.');
        navigate('/therapist/dashboard');
      } else {
        toast.error(error.response.data?.message || 'Ocorreu um erro. Tente novamente.');
      }
    } else if (error.request) {
      // Erro de conexão
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
    } else {
      // Outros erros
      toast.error('Ocorreu um erro inesperado. Tente novamente.');
    }
  };
  
  const fetchTherapistProfile = async () => {
    try {
      // Primeiro, buscar o perfil do terapeuta pelo ID do usuário logado
      const response = await api.get(`/therapists/profile`);
      
      if (response.data) {
        setTherapistId(response.data.id);
      } else {
        toast.error('Perfil de terapeuta não encontrado.');
        navigate('/therapist/dashboard');
      }
    } catch (error) {
      handleError(error);
    }
  };
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/therapist/${therapistId}`);
      
      // Converter os agendamentos para o formato do FullCalendar
      const formattedEvents = response.data.map(appointment => ({
        id: appointment.id,
        title: `${appointment.client?.name || 'Cliente'} - ${appointment.toolName || 'Consulta'}`,
        start: new Date(appointment.date),
        end: new Date(appointment.endDate),
        backgroundColor: getStatusColor(appointment.status),
        borderColor: getStatusColor(appointment.status),
        extendedProps: {
          status: appointment.status,
          clientName: appointment.client?.name || 'Cliente',
          toolName: appointment.toolName || 'Consulta',
          duration: appointment.duration,
          notes: appointment.notes || ''
        }
      }));
      
      setEvents(formattedEvents);
      setLoading(false);
    } catch (error) {
      handleError(error);
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '#4CAF50'; // Verde
      case 'PENDING':
        return '#FFA726'; // Laranja
      case 'CANCELLED':
        return '#EF5350'; // Vermelho
      case 'COMPLETED':
        return '#78909C'; // Cinza
      default:
        return '#90A4AE';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PENDING':
        return 'Pendente';
      case 'CANCELLED':
        return 'Cancelado';
      case 'COMPLETED':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  };
  
  const handleGoBack = () => {
    navigate('/therapist/dashboard');
  };
  
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const props = event.extendedProps;
    
    setSelectedAppointment({
      id: event.id,
      clientName: props.clientName,
      toolName: props.toolName,
      duration: props.duration,
      status: props.status,
      notes: props.notes,
      date: event.start,
      endDate: event.end
    });
    
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };
  
  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.put(`/appointments/${selectedAppointment.id}/status`, { status: newStatus });
      
      toast.success('Status do agendamento atualizado com sucesso!');
      fetchAppointments();
      handleCloseModal();
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <div className="therapist-schedule-container">
      <header className="page-header">
        <button onClick={handleGoBack} className="back-button">
          &larr; Voltar
        </button>
        <h1>Minha Agenda</h1>
      </header>
      
      <div className="schedule-content">
        <div className="help-section">
          <h3>Legenda</h3>
          <div className="status-legend">
            <div className="legend-item">
              <span className="status-dot confirmed"></span>
              <span>Confirmado</span>
            </div>
            <div className="legend-item">
              <span className="status-dot pending"></span>
              <span>Pendente</span>
            </div>
            <div className="legend-item">
              <span className="status-dot cancelled"></span>
              <span>Cancelado</span>
            </div>
            <div className="legend-item">
              <span className="status-dot completed"></span>
              <span>Concluído</span>
            </div>
          </div>
        </div>

        <div className="calendar-container">
          {loading ? (
            <div className="loading">Carregando agendamentos...</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={currentView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridDay,timeGridWeek,dayGridMonth'
              }}
              locale={ptBrLocale}
              editable={false}
              selectable={false}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:30:00"
              slotLabelInterval="01:00:00"
              height="auto"
              events={events}
              eventClick={handleEventClick}
              datesSet={(dateInfo) => setCurrentView(dateInfo.view.type)}
            />
          )}
        </div>
      </div>
      
      {showModal && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Detalhes do Agendamento</h2>
              <button onClick={handleCloseModal} className="close-button">&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="appointment-info">
                <p><strong>Cliente:</strong> {selectedAppointment.clientName}</p>
                <p><strong>Ferramenta:</strong> {selectedAppointment.toolName}</p>
                <p><strong>Data:</strong> {selectedAppointment.date.toLocaleString()}</p>
                <p><strong>Duração:</strong> {selectedAppointment.duration} minutos</p>
                <p><strong>Status:</strong> {getStatusText(selectedAppointment.status)}</p>
                {selectedAppointment.notes && (
                  <p><strong>Observações:</strong> {selectedAppointment.notes}</p>
                )}
              </div>
              
              <div className="appointment-actions">
                {selectedAppointment.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('CONFIRMED')}
                      className="action-button confirm"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('CANCELLED')}
                      className="action-button cancel"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {selectedAppointment.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('COMPLETED')}
                      className="action-button complete"
                    >
                      Marcar como Concluído
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('CANCELLED')}
                      className="action-button cancel"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistSchedule; 