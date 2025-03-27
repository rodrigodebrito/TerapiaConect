import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    
    setError('');
    setLoading(true);
    
    try {
      const user = await login(formData.email, formData.password);
      
      // Redirecionar baseado no papel
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'THERAPIST') {
        navigate('/therapist/dashboard');
      } else if (user.role === 'CLIENT') {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="register-link">
          Não tem uma conta? <Link to="/register">Registre-se</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 