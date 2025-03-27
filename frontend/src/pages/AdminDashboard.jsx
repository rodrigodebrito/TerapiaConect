import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const response = await api.get('/therapists/admin/all');
      setTherapists(response.data);
      setError('');
    } catch (err) {
      console.error('Erro ao buscar terapeutas:', err);
      setError('Não foi possível carregar a lista de terapeutas.');
    } finally {
      setLoading(false);
    }
  };

  const approveTherapist = async (id) => {
    try {
      await api.put(`/therapists/admin/approve/${id}`);
      // Atualizar a lista
      setTherapists(therapists.map(t => 
        t.id === id ? { ...t, isApproved: true } : t
      ));
    } catch (err) {
      console.error('Erro ao aprovar terapeuta:', err);
      alert('Erro ao aprovar terapeuta. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return <div className="admin-dashboard-container loading">Carregando...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <h1>Painel Administrativo</h1>
        <div className="admin-user-info">
          <span>Administrador: {user?.name}</span>
        </div>
      </header>

      <main className="admin-content">
        <section className="admin-section">
          <h2>Gerenciamento de Terapeutas</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="therapist-management">
            <h3>Lista de Terapeutas</h3>
            
            <table className="therapist-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Preço Base</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {therapists.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">Nenhum terapeuta encontrado</td>
                  </tr>
                ) : (
                  therapists.map(therapist => (
                    <tr key={therapist.id}>
                      <td>{therapist.name}</td>
                      <td>{therapist.email}</td>
                      <td>R$ {therapist.baseSessionPrice || 0}</td>
                      <td>
                        <span className={`status-badge ${therapist.isApproved ? 'approved' : 'pending'}`}>
                          {therapist.isApproved ? 'Aprovado' : 'Pendente'}
                        </span>
                      </td>
                      <td>
                        {!therapist.isApproved && (
                          <button 
                            className="approve-button" 
                            onClick={() => approveTherapist(therapist.id)}
                          >
                            Aprovar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard; 