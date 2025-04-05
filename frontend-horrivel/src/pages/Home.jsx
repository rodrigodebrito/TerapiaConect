import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirecionamento baseado no papel do usuário logado
  const redirectToDashboard = () => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'THERAPIST') {
        navigate('/therapist/dashboard');
      } else if (user.role === 'CLIENT') {
        navigate('/client/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">
          <h1>TherapistConnect</h1>
        </div>
        <nav className="nav-links">
          <a href="#about">Sobre</a>
          <a href="#features">Funcionalidades</a>
          <a href="#testimonials">Depoimentos</a>
          {user ? (
            <button onClick={redirectToDashboard} className="dashboard-btn">
              Meu Painel
            </button>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="login-btn">Entrar</Link>
              <Link to="/register" className="register-btn">Cadastrar</Link>
            </div>
          )}
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Conectando Terapeutas e Pacientes</h1>
          <p>
            Uma plataforma completa para gerenciamento de atendimentos, agendamentos e 
            acompanhamento terapêutico.
          </p>
          <button onClick={redirectToDashboard} className="cta-button">
            {user ? 'Acessar meu painel' : 'Começar agora'}
          </button>
        </div>
        <div className="hero-image">
          <div className="image-placeholder"></div>
        </div>
      </section>

      <section id="about" className="about-section">
        <h2>Sobre a plataforma</h2>
        <div className="about-content">
          <p>
            TherapistConnect é uma plataforma desenvolvida para facilitar a conexão entre 
            terapeutas e pacientes. Nossa missão é proporcionar uma experiência fluida 
            para agendamentos, gerenciamento de sessões e acompanhamento terapêutico.
          </p>
          <p>
            Desenvolvida com as mais modernas tecnologias web, a plataforma oferece 
            segurança, praticidade e um design intuitivo para todos os usuários.
          </p>
        </div>
      </section>

      <section id="features" className="features-section">
        <h2>Funcionalidades</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon therapist-icon"></div>
            <h3>Para Terapeutas</h3>
            <ul>
              <li>Gerenciamento de perfil profissional</li>
              <li>Controle de disponibilidade e agenda</li>
              <li>Histórico de atendimentos</li>
              <li>Visão financeira das sessões</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon client-icon"></div>
            <h3>Para Pacientes</h3>
            <ul>
              <li>Busca de terapeutas por especialidade</li>
              <li>Agendamento online de consultas</li>
              <li>Histórico de sessões</li>
              <li>Acompanhamento da evolução</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon admin-icon"></div>
            <h3>Para Administradores</h3>
            <ul>
              <li>Dashboard de métricas da plataforma</li>
              <li>Gestão de usuários</li>
              <li>Relatórios de utilização</li>
              <li>Suporte às operações</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <h2>Depoimentos</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-text">
              "Como terapeuta, essa plataforma revolucionou a forma como organizo minha agenda e 
              me comunico com meus pacientes. Recomendo a todos os profissionais!"
            </p>
            <div className="testimonial-author">
              <div className="author-initial">M</div>
              <div className="author-info">
                <p className="author-name">Maria Silva</p>
                <p className="author-role">Psicóloga</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <p className="testimonial-text">
              "Encontrar um terapeuta nunca foi tão fácil. A plataforma me ajudou a encontrar o 
              profissional ideal para minhas necessidades. Estou muito satisfeito!"
            </p>
            <div className="testimonial-author">
              <div className="author-initial">P</div>
              <div className="author-info">
                <p className="author-name">Paulo Mendes</p>
                <p className="author-role">Paciente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>TherapistConnect</h2>
            <p>Conectando pessoas para uma vida melhor</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-section">
              <h3>Plataforma</h3>
              <a href="#about">Sobre</a>
              <a href="#features">Funcionalidades</a>
              <a href="#testimonials">Depoimentos</a>
            </div>
            
            <div className="footer-section">
              <h3>Legal</h3>
              <a href="#">Termos de Uso</a>
              <a href="#">Política de Privacidade</a>
            </div>
            
            <div className="footer-section">
              <h3>Contato</h3>
              <a href="mailto:contato@therapistconnect.com">contato@therapistconnect.com</a>
              <a href="tel:+551199999999">(11) 9999-9999</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} TherapistConnect. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 