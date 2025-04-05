import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleFindTherapists = () => {
    navigate('/directory');
  };
  
  const handleViewAppointments = () => {
    navigate('/client/appointments');
  };
  
  const handleEditProfile = () => {
    navigate('/client/profile');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Meu Painel</h1>
        <div className="user-info">
          <span>Olá, {user?.name}</span>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <h2>Bem-vindo à Plataforma</h2>
          <p>Aqui você pode encontrar terapeutas e agendar suas sessões.</p>
        </section>

        <section className="quick-actions">
          <div className="action-card">
            <h3>Encontrar Terapeutas</h3>
            <p>Busque terapeutas disponíveis por especialidade</p>
            <button className="action-button" onClick={handleFindTherapists}>
              Buscar Terapeutas
            </button>
          </div>

          <div className="action-card">
            <h3>Minhas Consultas</h3>
            <p>Visualize e gerencie suas sessões agendadas</p>
            <button className="action-button" onClick={handleViewAppointments}>
              Ver Consultas
            </button>
          </div>

          <div className="action-card">
            <h3>Meu Perfil</h3>
            <p>Atualize suas informações pessoais</p>
            <button className="action-button" onClick={handleEditProfile}>
              Editar Perfil
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard; 