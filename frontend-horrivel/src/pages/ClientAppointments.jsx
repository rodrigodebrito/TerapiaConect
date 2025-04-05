import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ClientAppointments.css';

// Dados mockados para demonstração
const mockAppointments = [
  {
    id: 1,
    therapistId: '1',
    therapistName: 'Dra. Amanda Silva',
    date: '2024-03-20',
    time: '14:00',
    duration: 50,
    price: 150,
    status: 'SCHEDULED', // SCHEDULED, COMPLETED, CANCELLED
    isFreeSession: false,
    mode: 'ONLINE'
  },
  {
    id: 2,
    therapistId: '3',
    therapistName: 'Dra. Juliana Costa',
    date: '2024-03-22',
    time: '10:00',
    duration: 20,
    price: 0,
    status: 'SCHEDULED',
    isFreeSession: true,
    mode: 'PRESENTIAL'
  }
];

function ClientAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, cancelled

  useEffect(() => {
    // Simulando chamada à API
    setTimeout(() => {
      setAppointments(mockAppointments);
      setLoading(false);
    }, 1000);
  }, []);

  const filterAppointments = (status) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);

      if (status === 'upcoming') {
        return appointmentDate >= today && appointment.status === 'SCHEDULED';
      } else if (status === 'past') {
        return appointmentDate < today || appointment.status === 'COMPLETED';
      } else {
        return appointment.status === 'CANCELLED';
      }
    });
  };

  const handleViewTherapist = (therapistId) => {
    navigate(`/therapist-profile/${therapistId}`);
  };

  const handleCancelAppointment = (appointmentId) => {
    // Aqui você implementaria a lógica real de cancelamento
    const updatedAppointments = appointments.map(app => 
      app.id === appointmentId ? { ...app, status: 'CANCELLED' } : app
    );
    setAppointments(updatedAppointments);
  };

  if (loading) {
    return <div className="loading">Carregando suas sessões...</div>;
  }

  return (
    <div className="client-appointments-container">
      <div className="appointments-header">
        <h1>Minhas Sessões</h1>
        <button 
          className="schedule-new-button"
          onClick={() => navigate('/directory')}
        >
          Agendar Nova Sessão
        </button>
      </div>

      <div className="appointments-tabs">
        <button 
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Próximas Sessões
        </button>
        <button 
          className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Sessões Anteriores
        </button>
        <button 
          className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Canceladas
        </button>
      </div>

      <div className="appointments-list">
        {filterAppointments(activeTab).length === 0 ? (
          <div className="no-appointments">
            <p>Nenhuma sessão {activeTab === 'upcoming' ? 'agendada' : 
               activeTab === 'past' ? 'realizada' : 'cancelada'}.</p>
            {activeTab === 'upcoming' && (
              <button 
                className="schedule-button"
                onClick={() => navigate('/directory')}
              >
                Agendar uma sessão
              </button>
            )}
          </div>
        ) : (
          filterAppointments(activeTab).map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-main-info">
                <div className="appointment-header">
                  <h3>{appointment.therapistName}</h3>
                  <span className={`appointment-status ${appointment.status.toLowerCase()}`}>
                    {appointment.status === 'SCHEDULED' ? 'Agendada' :
                     appointment.status === 'COMPLETED' ? 'Realizada' : 'Cancelada'}
                  </span>
                </div>
                
                <div className="appointment-details">
                  <p>
                    <strong>Data:</strong> {new Date(appointment.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p>
                    <strong>Horário:</strong> {appointment.time}
                  </p>
                  <p>
                    <strong>Duração:</strong> {appointment.duration} minutos
                  </p>
                  <p>
                    <strong>Modalidade:</strong> {appointment.mode === 'ONLINE' ? 'Online' : 'Presencial'}
                  </p>
                  <p>
                    <strong>Valor:</strong> {appointment.price === 0 ? 'Gratuita' : `R$ ${appointment.price},00`}
                  </p>
                  {appointment.isFreeSession && (
                    <span className="free-session-badge">Sessão Experimental</span>
                  )}
                </div>
              </div>

              <div className="appointment-actions">
                <button
                  className="view-therapist-button"
                  onClick={() => handleViewTherapist(appointment.therapistId)}
                >
                  Ver Terapeuta
                </button>
                {appointment.status === 'SCHEDULED' && (
                  <button
                    className="cancel-button"
                    onClick={() => handleCancelAppointment(appointment.id)}
                  >
                    Cancelar Sessão
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ClientAppointments; 