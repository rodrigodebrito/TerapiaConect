import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CLIENT', // valor padrão
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role === 'THERAPIST' ? 'THERAPIST' : 'CLIENT'
      };

      const user = await register(userData);

      // Redireciona com base no tipo de usuário
      if (user.role === 'THERAPIST') {
        navigate('/therapist/dashboard');
      } else if (user.role === 'CLIENT') {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="register-container">
      <div className="register-form-container">
        <h2>Criar Nova Conta</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Digite seu nome completo"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Digite seu email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Digite sua senha"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirme sua senha"
            />
          </div>
          
          <div className="form-group">
            <label>Tipo de Conta</label>
            <div className="role-options">
              <label className={`role-option ${formData.role === 'CLIENT' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="CLIENT"
                  checked={formData.role === 'CLIENT'}
                  onChange={handleChange}
                />
                <div className="role-icon">👤</div>
                <div className="role-title">Cliente</div>
                <div className="role-description">
                  Busco encontrar um terapeuta para agendar sessões
                </div>
              </label>
              
              <label className={`role-option ${formData.role === 'THERAPIST' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="THERAPIST"
                  checked={formData.role === 'THERAPIST'}
                  onChange={handleChange}
                />
                <div className="role-icon">🧠</div>
                <div className="role-title">Terapeuta</div>
                <div className="role-description">
                  Sou um profissional e quero oferecer meus serviços
                </div>
              </label>
            </div>
          </div>
          
          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
        
        <div className="login-link">
          Já tem uma conta? <Link to="/login">Faça login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 