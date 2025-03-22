import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTherapistDetails, createAppointment, getAvailableTimeSlots } from '../services/appointmentService';
import './AppointmentScheduling.css';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

// Função auxiliar para validar se uma data é futura
const isValidFutureDate = (date, time) => {
  const now = new Date();
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const appointmentDate = new Date(year, month - 1, day, hours, minutes);
  
  // Retorna true se a data/hora é futura
  return appointmentDate > now;
};

const formatDateToIso = (date) => {
  if (!date) return '';
  
  // Se a data já estiver em formato ISO (yyyy-MM-dd), retorna como está
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
  
  // Se estiver no formato brasileiro (dd/MM/yyyy), converte para ISO
  if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = date.split('/').map(Number);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // Se for um objeto Date, formata para ISO
  if (date instanceof Date) {
    return format(date, 'yyyy-MM-dd');
  }
  
  return '';
};

const AppointmentScheduling = () => {
  const { id: therapistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [therapist, setTherapist] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('ONLINE');
  const [summary, setSummary] = useState(null);

  // Obter os dados da seleção prévia (se disponíveis)
  const locationState = location.state || {};
  const preSelectedDate = locationState.selectedDate || '';
  const preSelectedTime = locationState.selectedTime || '';
  const isFreeSession = locationState.isFreeSession || false;
  
  // Gerar data mínima (hoje) e máxima (3 meses à frente)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  const minDateStr = today.toISOString().split('T')[0];
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Formatação para exibição
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    try {
      // Tentar converter para objeto Date
      const date = typeof dateStr === 'string' ? parseISO(formatDateToIso(dateStr)) : dateStr;
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (err) {
      console.error('Erro ao formatar data:', err);
      return dateStr;
    }
  };

  // Buscar dados do terapeuta
  useEffect(() => {
    const fetchTherapist = async () => {
      try {
        setLoading(true);
        console.log('Buscando terapeuta com ID:', therapistId);
        
        // Se temos os dados do terapeuta no state da navegação
        if (locationState.therapist) {
          console.log('Usando dados do terapeuta do state:', locationState.therapist);
          setTherapist(locationState.therapist);
          
          // Se temos apenas uma ferramenta, seleciona automaticamente
          if (locationState.therapist.tools && locationState.therapist.tools.length === 1) {
            setSelectedTool(locationState.therapist.tools[0].id);
          }
          
          // Definir modo padrão baseado nas opções disponíveis
          if (locationState.therapist.availableModes && locationState.therapist.availableModes.length === 1) {
            setMode(locationState.therapist.availableModes[0]);
          }
        } else {
          // Caso contrário, busca do servidor
          const response = await getTherapistDetails(therapistId);
          console.log('Dados do terapeuta recebidos:', response);
          setTherapist(response);
          
          // Se houver apenas uma ferramenta, seleciona automaticamente
          if (response.tools && response.tools.length === 1) {
            setSelectedTool(response.tools[0].id);
          }
          
          // Definir modo padrão baseado nas opções disponíveis
          if (response.availableModes && response.availableModes.length === 1) {
            setMode(response.availableModes[0]);
          }
        }
        
        // Processar seleções prévias (se houver)
        if (preSelectedDate) {
          const formattedDate = formatDateToIso(preSelectedDate);
          console.log('Data pré-selecionada:', preSelectedDate, 'formatada:', formattedDate);
          setSelectedDate(formattedDate);
        }
        
        if (preSelectedTime) {
          console.log('Horário pré-selecionado:', preSelectedTime);
          setSelectedTime(preSelectedTime);
        }
        
      } catch (error) {
        console.error('Erro ao buscar dados do terapeuta:', error);
        setError('Erro ao carregar dados do terapeuta');
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [therapistId, locationState, preSelectedDate, preSelectedTime]);

  // Buscar horários disponíveis quando a data é selecionada
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate) return;

      try {
        setLoading(true);
        console.log('Buscando horários para a data:', selectedDate);
        const slots = await getAvailableTimeSlots(therapistId, selectedDate);
        console.log('Horários disponíveis:', slots);
        setAvailableTimeSlots(slots);
        
        // Se temos um horário pré-selecionado, verificar se está disponível
        if (preSelectedTime && !slots.includes(preSelectedTime)) {
          toast.warning(`O horário pré-selecionado (${preSelectedTime}) não está mais disponível.`);
          setSelectedTime('');
        }
        
        setError('');
      } catch (error) {
        console.error('Erro ao buscar horários:', error);
        setError('Erro ao carregar horários disponíveis');
        setAvailableTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [therapistId, selectedDate, preSelectedTime]);

  // Efeito para atualizar o resumo da consulta
  useEffect(() => {
    if (therapist && selectedDate && selectedTime && selectedTool) {
      const selectedToolData = therapist.tools?.find(t => t.id === selectedTool);
      
      if (selectedToolData) {
        setSummary({
          therapist: `${therapist.firstName} ${therapist.lastName}`,
          date: formatDate(selectedDate),
          time: selectedTime,
          tool: selectedToolData.name,
          duration: selectedToolData.duration,
          price: isFreeSession ? 0 : selectedToolData.price,
          isFreeSession
        });
      }
    } else {
      setSummary(null);
    }
  }, [therapist, selectedDate, selectedTime, selectedTool, isFreeSession]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setSelectedTime(''); // Resetar horário ao mudar a data
    setError('');
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    if (!selectedDate) {
      setError('Por favor, selecione uma data primeiro.');
      return;
    }
    
    if (!isValidFutureDate(selectedDate, newTime)) {
      setError('Este horário já passou. Por favor, selecione um horário futuro.');
      setSelectedTime('');
      return;
    }

    setSelectedTime(newTime);
    setError('');
  };

  const handleModeChange = (e) => {
    setMode(e.target.value);
    setError('');
  };

  const handleToolChange = (e) => {
    setSelectedTool(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime || !selectedTool) {
      setError('Por favor, selecione data, horário e ferramenta');
      return;
    }

    try {
      setLoading(true);
      const selectedToolData = therapist.tools.find(t => t.id === selectedTool);
      
      const appointmentData = {
        therapistId,
        clientId: user.id,
        date: selectedDate,
        time: selectedTime,
        toolId: selectedTool,
        duration: selectedToolData.duration,
        price: isFreeSession ? 0 : selectedToolData.price,
        mode,
        isFreeSession
      };

      console.log('Criando agendamento:', appointmentData);
      await createAppointment(appointmentData);
      toast.success('Consulta agendada com sucesso!');
      navigate('/client/appointments');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setError('Erro ao criar agendamento. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !therapist) {
    return (
      <div className="appointment-scheduling">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados do terapeuta...</p>
        </div>
      </div>
    );
  }

  if (error && !therapist) {
    return (
      <div className="appointment-scheduling">
        <div className="error-container">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-scheduling">
      <div className="scheduling-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Voltar
        </button>
        <h2>Agendar Consulta</h2>
      </div>

      <div className="therapist-card">
        <div className="therapist-info">
          <div className="therapist-avatar">
            <img 
              src={therapist?.avatarUrl || '/assets/default-avatar.png'} 
              alt={`${therapist?.firstName} ${therapist?.lastName}`} 
            />
          </div>
          <div className="therapist-details">
            <h3>{`${therapist?.firstName} ${therapist?.lastName}`}</h3>
            <p className="therapist-title">{therapist?.title || 'Psicoterapeuta'}</p>
            <div className="therapist-tags">
              <span className="tag"><i className="fas fa-map-marker-alt"></i> {therapist?.city}, {therapist?.state}</span>
              <span className="tag"><i className="fas fa-clock"></i> Sessões de {therapist?.sessionDuration || 50} min</span>
            </div>
          </div>
          <div className="therapist-price">
            <span className="price">{isFreeSession ? 'Gratuito' : `R$ ${therapist?.price || 0}`}</span>
            {isFreeSession && <span className="free-badge">Sessão Experimental</span>}
          </div>
        </div>
      </div>

      <div className="scheduling-form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Detalhes da Consulta</h3>
            
            <div className="form-group">
              <label>Tipo de Consulta:</label>
              <select
                value={selectedTool}
                onChange={handleToolChange}
                required
                className="form-control"
              >
                <option value="">Selecione o tipo de consulta</option>
                {therapist?.tools?.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name} ({tool.duration}min) - {isFreeSession ? 'Gratuito' : `R$ ${tool.price.toFixed(2)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Modalidade:</label>
              <div className="mode-selector">
                <label className={`mode-option ${mode === 'ONLINE' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="mode" 
                    value="ONLINE" 
                    checked={mode === 'ONLINE'} 
                    onChange={handleModeChange} 
                  />
                  <span className="mode-icon"><i className="fas fa-video"></i></span>
                  <span className="mode-label">Online</span>
                </label>
                <label className={`mode-option ${mode === 'PRESENTIAL' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="mode" 
                    value="PRESENTIAL" 
                    checked={mode === 'PRESENTIAL'} 
                    onChange={handleModeChange} 
                  />
                  <span className="mode-icon"><i className="fas fa-building"></i></span>
                  <span className="mode-label">Presencial</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Data e Horário</h3>
            
            <div className="date-time-container">
              <div className="form-group date-group">
                <label>Data:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={minDateStr}
                  max={maxDateStr}
                  required
                  className="form-control"
                />
              </div>

              {selectedDate && (
                <div className="form-group time-group">
                  <label>Horário:</label>
                  {loading ? (
                    <div className="loading-slots">
                      <div className="loading-spinner small"></div>
                      <span>Carregando horários...</span>
                    </div>
                  ) : availableTimeSlots.length > 0 ? (
                    <div className="time-slots-grid">
                      {availableTimeSlots.map((slot) => (
                        <label 
                          key={slot} 
                          className={`time-slot-option ${selectedTime === slot ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="timeSlot"
                            value={slot}
                            checked={selectedTime === slot}
                            onChange={() => setSelectedTime(slot)}
                          />
                          <span>{slot}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="no-slots-message">
                      <i className="fas fa-exclamation-circle"></i>
                      Nenhum horário disponível para esta data
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {summary && (
            <div className="appointment-summary">
              <h3>Resumo da Consulta</h3>
              <div className="summary-details">
                <div className="summary-item">
                  <span className="summary-label">Profissional:</span>
                  <span className="summary-value">{summary.therapist}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Data:</span>
                  <span className="summary-value">{summary.date}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Horário:</span>
                  <span className="summary-value">{summary.time}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Modalidade:</span>
                  <span className="summary-value">{mode === 'ONLINE' ? 'Online' : 'Presencial'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Duração:</span>
                  <span className="summary-value">{summary.duration} minutos</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Valor:</span>
                  <span className="summary-value">
                    {summary.isFreeSession ? 'Gratuito' : `R$ ${summary.price.toFixed(2)}`}
                    {summary.isFreeSession && <span className="free-tag">Sessão Experimental</span>}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="confirm-button"
              disabled={loading || !selectedDate || !selectedTime || !selectedTool}
            >
              {loading ? (
                <>
                  <span className="loading-spinner small white"></span>
                  <span>Processando...</span>
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduling; 