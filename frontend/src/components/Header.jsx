import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFullImageUrl } from '../utils/constants';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Fechar o menu quando o usuário clica fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    // Adicionar event listener quando o menu está aberto
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup: remover event listener quando o componente é desmontado ou o menu é fechado
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  
  return (
    <header className="main-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            Terapeuta<span className="highlight">+</span>
          </Link>
          
          {user && user.role === 'THERAPIST' && (
            <nav className="nav-links">
              <Link to="/therapist/dashboard" className={isActive('/therapist/dashboard') ? 'active' : ''}>
                Início
              </Link>
              <Link to="/therapist/appointments" className={isActive('/therapist/appointments') ? 'active' : ''}>
                Minha Agenda
              </Link>
              <Link to="/therapist/availability" className={isActive('/therapist/availability') ? 'active' : ''}>
                Disponibilidade
              </Link>
            </nav>
          )}
          
          {user && user.role === 'CLIENT' && (
            <nav className="nav-links">
              <Link to="/client/dashboard" className={isActive('/client/dashboard') ? 'active' : ''}>
                Início
              </Link>
              <Link to="/client/appointments" className={isActive('/client/appointments') ? 'active' : ''}>
                Minhas Consultas
              </Link>
              <Link to="/directory" className={isActive('/directory') ? 'active' : ''}>
                Encontrar Terapeuta
              </Link>
            </nav>
          )}
        </div>
        
        <div className="header-right">
          {user ? (
            <>
              <button className="language-selector">
                Português, BRL
                <span className="language-selector-icon">▼</span>
              </button>
            
              <Link to="/notifications" className="notifications-button">
                <i className="notification-icon">🔔</i>
              </Link>
            
              <div className="user-menu-container" ref={menuRef}>
                <button className="user-menu-button" onClick={toggleMenu}>
                  {user.profilePicture ? (
                    <img 
                      src={getFullImageUrl(user.profilePicture)} 
                      alt={user.name} 
                      className="user-avatar" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/default-profile.png';
                      }}
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <span>{user.name.charAt(0)}</span>
                    </div>
                  )}
                </button>
                
                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <p className="user-greeting">Olá, {user.name.split(' ')[0]}</p>
                      {user.role === 'THERAPIST' && (
                        <p className="user-info">{user.name.split(' ').slice(1).join(' ')}</p>
                      )}
                    </div>
                    
                    {user.role === 'THERAPIST' && (
                      <>
                        <Link to="/therapist/profile" className="dropdown-item">
                          Meu Perfil
                        </Link>
                        <Link to="/therapist/profile/view" className="dropdown-item">
                          Visualizar Meu Perfil
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'CLIENT' && (
                      <Link to="/client/profile" className="dropdown-item">
                        Meu Perfil
                      </Link>
                    )}
                    
                    <Link to="/settings" className="dropdown-item">
                      Configurações
                    </Link>
                    
                    <button onClick={handleLogout} className="logout-button">
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="language-selector">
                Português, BRL
                <span className="language-selector-icon">▼</span>
              </button>
              
              <div className="auth-buttons">
                <Link to="/login" className="login-button">
                  Entrar
                </Link>
                <Link to="/register" className="register-button">
                  Cadastrar
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 