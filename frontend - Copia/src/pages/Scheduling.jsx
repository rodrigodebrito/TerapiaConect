import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import api from '../services/api';

const Scheduling = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [therapist, setTherapist] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadTherapist = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/therapists/${therapistId}`);
        setTherapist(response.data);
      } catch (error) {
        console.error('Erro ao carregar dados do terapeuta:', error);
        setError('Não foi possível carregar os dados do terapeuta.');
      } finally {
        setLoading(false);
      }
    };

    loadTherapist();
  }, [therapistId]);

  const handleSchedule = async () => {
    try {
      if (!selectedDate || !selectedTime) {
        toast.error('Por favor, selecione uma data e horário para a sessão.');
        return;
      }

      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointmentData = {
        therapistId,
        date: appointmentDateTime.toISOString(),
        duration: therapist.sessionDuration,
        price: therapist.baseSessionPrice
      };

      await api.post('/appointments', appointmentData);
      setSuccess(true);
      toast.success('Sessão agendada com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar sessão:', error);
      toast.error('Erro ao agendar sessão. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (success) {
    return (
      <div className="success-message">
        <h2>Agendamento realizado com sucesso!</h2>
        <p>Você receberá um e-mail com os detalhes da sua sessão.</p>
        <Link to="/appointments" className="btn btn-primary">
          Ver minhas sessões
        </Link>
      </div>
    );
  }

  return (
    <div className="scheduling-container">
      <h1>Agendar Sessão</h1>
      
      <div className="therapist-info">
        <h2>Terapeuta: {therapist.user.name}</h2>
        <p>Valor da sessão: R$ {therapist.baseSessionPrice}</p>
        <p>Duração: {therapist.sessionDuration} minutos</p>
      </div>

      <div className="scheduling-form">
        <div className="form-group">
          <label>Data da Sessão</label>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            placeholderText="Selecione uma data"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Horário da Sessão</label>
          <select
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
            className="form-control"
          >
            <option value="">Selecione um horário</option>
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
            <option value="17:00">17:00</option>
          </select>
        </div>

        <button
          onClick={handleSchedule}
          className="btn btn-primary"
          disabled={!selectedDate || !selectedTime}
        >
          Agendar Sessão
        </button>
      </div>
    </div>
  );
};

export default Scheduling; 