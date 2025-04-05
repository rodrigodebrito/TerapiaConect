import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { createTestSession } from '../services/sessionService';
import './TherapistDashboard.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const TherapistDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [therapistData, setTherapistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchTherapistData = async () => {
      try {
        if (user?.id) {
          const response = await api.get(`/therapists/user/${user.id}`);
          setTherapistData(response.data);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do terapeuta:', err);
        setError('Não foi possível carregar seus dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTherapistData();
  }, [user]);
  
  const handleUpdateProfile = () => {
    navigate('/therapist/profile');
  };
  
  const handleManageSchedule = () => {
    navigate('/therapist/schedule');
  };
  
  const handleSetAvailability = () => {
    navigate('/therapist/availability');
  };
  
  const handleSetAvailabilitySimple = () => {
    navigate('/therapist/availability-simple');
  };
  
  const handleViewAppointments = () => {
    navigate('/therapist/appointments');
  };
  
  const handleCreateTestSession = async () => {
    try {
      toast.loading('Criando sessão de teste...');
      const session = await createTestSession();
      
      if (!session || !session.id) {
        throw new Error('Sessão criada sem ID válido');
      }
      
      toast.dismiss();
      toast.success('Sessão de teste criada com sucesso!');
      navigate(`/session/${session.id}`);
    } catch (error) {
      toast.dismiss();
      console.error('Erro ao criar sessão de teste:', error);
      
      // Verificar tipos específicos de erro
      if (error.response) {
        // Erro de resposta da API
        if (error.response.status === 404) {
          toast.error('Endpoint de sessão de teste não encontrado. Verifique se o servidor está atualizado.');
        } else if (error.response.status === 403) {
          toast.error('Não autorizado. Apenas terapeutas podem criar sessões de teste.');
        } else {
          toast.error(`Erro do servidor: ${error.response.data?.message || 'Erro desconhecido'}`);
        }
      } else if (error.request) {
        // Erro de rede - sem resposta
        toast.error('Erro de conexão. Verifique se o servidor está disponível.');
      } else {
        // Erro desconhecido
        toast.error('Não foi possível criar a sessão de teste. Tente novamente.');
      }
    }
  };
  
  // Verificar se perfil está completo
  const isProfileComplete = () => {
    if (!therapistData) return false;
    
    return !!(
      therapistData.bio && 
      therapistData.specialties && 
      therapistData.education && 
      therapistData.sessionPrice
    );
  };

  return (
    <div className="therapist-dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard do Terapeuta</h1>
        <div className="user-info">
          <span>Olá, {user?.name}</span>
          <button onClick={logout} className="logout-button">Sair</button>
        </div>
      </header>

      <main className="dashboard-content">
        {loading ? (
          <div className="loading-indicator">Carregando...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {!isProfileComplete() && (
              <div className="alert-message">
                <strong>Seu perfil está incompleto!</strong> 
                <p>Complete seu perfil para aumentar suas chances de conseguir clientes.</p>
                <button onClick={handleUpdateProfile} className="alert-action-button">
                  Completar Perfil
                </button>
              </div>
            )}
            
            <section className="welcome-section">
              <h2>Bem-vindo(a) à sua área de terapeuta</h2>
              <p>Gerencie seus agendamentos, disponibilidade e perfil profissional.</p>
            </section>

            <div className="dashboard-grid">
              <section className="upcoming-appointments">
                <h3>Próximos Agendamentos</h3>
                <div className="placeholder-content">
                  <p>Nenhum agendamento próximo no momento.</p>
                  <button 
                    onClick={handleViewAppointments} 
                    className="action-button"
                  >
                    Ver Agenda Completa
                  </button>
                </div>
              </section>

              <section className="quick-actions">
                <h3>Ações Rápidas</h3>
                <div className="action-buttons">
                  <button 
                    onClick={handleManageSchedule} 
                    className="action-button"
                  >
                    Gerenciar Agenda
                  </button>
                  <button 
                    onClick={handleUpdateProfile} 
                    className="action-button"
                  >
                    Atualizar Perfil
                  </button>
                  <button 
                    onClick={handleSetAvailability} 
                    className="action-button"
                  >
                    Definir Horários Disponíveis
                  </button>
                </div>
              </section>

              <section className="statistics">
                <h3>Estatísticas</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>0</h4>
                    <p>Sessões Este Mês</p>
                  </div>
                  <div className="stat-card">
                    <h4>0</h4>
                    <p>Clientes Ativos</p>
                  </div>
                  <div className="stat-card">
                    <h4>0%</h4>
                    <p>Taxa de Ocupação</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Seção de cards de ações */}
            <div className="dashboard-cards">
              <div className="dashboard-card" onClick={handleUpdateProfile}>
                <div className="card-icon">
                  <i className="profile-icon">👤</i>
                </div>
                <h3>Perfil Profissional</h3>
                <p>Edite seu perfil e configure seus serviços</p>
              </div>
              
              <div className="dashboard-card" onClick={handleSetAvailability}>
                <div className="card-icon">
                  <i className="calendar-icon">📅</i>
                </div>
                <h3>Minha Disponibilidade</h3>
                <p>Configure os horários que você está disponível</p>
              </div>
              
              <div className="dashboard-card" onClick={handleManageSchedule}>
                <div className="card-icon">
                  <i className="schedule-icon">🕒</i>
                </div>
                <h3>Agenda</h3>
                <p>Visualize e gerencie seus agendamentos</p>
              </div>
              
              <div className="dashboard-card" onClick={() => navigate('/directory')}>
                <div className="card-icon">
                  <i className="search-icon">🔍</i>
                </div>
                <h3>Diretório de Terapeutas</h3>
                <p>Encontre outros terapeutas na plataforma</p>
              </div>

              <div className="dashboard-card services-card">
                <h3>Serviços e Valores</h3>
                <div className="dashboard-content">
                  <p><strong>Valor base:</strong> R$ {parseFloat(therapistData?.baseSessionPrice || 0).toFixed(2)}</p>
                  <p><strong>Duração da sessão:</strong> {therapistData?.sessionDuration || 60} minutos</p>
                  
                  {/* Ferramentas Terapêuticas */}
                  {therapistData?.tools && therapistData.tools.length > 0 && (
                    <div className="tools-section">
                      <h4>Ferramentas Terapêuticas:</h4>
                      <ul className="tools-list">
                        {therapistData.tools.map((tool, index) => (
                          <li key={index} className="tool-item">
                            <span className="tool-name">{tool.name}</span>
                            <span className="tool-details">
                              {tool.duration} min - R$ {tool.price}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {therapistData?.offersFreeSession && (
                    <p className="free-session-info">
                      <strong>Sessão experimental gratuita:</strong> {therapistData.freeSessionDuration || 30} minutos
                    </p>
                  )}
                  
                  <Link to="/therapist/profile" className="dashboard-btn">
                    Editar Valores e Serviços
                  </Link>
                </div>
              </div>

              {/* Card para gerenciar disponibilidade simples */}
              <div className="dashboard-card" onClick={handleSetAvailabilitySimple}>
                <div className="card-icon">
                  <i className="calendar-icon">📅</i>
                </div>
                <h3>Disponibilidade Simplificada</h3>
                <p>Gerencie horários específicos de forma simples e direta</p>
              </div>
              
              {/* Card para criar sessão de teste */}
              <div className="dashboard-card" onClick={handleCreateTestSession}>
                <div className="card-icon">
                  <i className="test-icon">🧪</i>
                </div>
                <h3>Sessão de Teste</h3>
                <p>Criar uma sessão de teste para avaliar a funcionalidade</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TherapistDashboard; 