import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se há um token no localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  // Função para atualizar o token de autenticação
  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Tentando login com:', { email });
      const response = await api.post('/auth', { email, password });
      console.log('Resposta do login:', response.data);
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return user;
    } catch (err) {
      console.error('Erro no login:', err.message, err.response?.data);
      setError(err.response?.data?.message || 'Erro ao fazer login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Tentando registro com:', userData.email);
      const response = await api.post('/auth/register', userData);
      console.log('Resposta do registro:', response.data);
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return user;
    } catch (err) {
      console.error('Erro no registro:', err.message, err.response?.data);
      setError(err.response?.data?.message || 'Erro ao registrar usuário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setAuthToken,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 