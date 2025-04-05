import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import App from './App'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import { HelmetProvider } from 'react-helmet-async'
import './refresh-app.css' // Arquivo para forçar recarga da aplicação

// Script para limpeza e botões diretos
const cleanupAIButtons = () => {
  // Encontrar e remover todas as implementações antigas
  document.querySelectorAll('[id*="ai-tools"], [class*="ai-tools"]').forEach(el => {
    // Verificar se este elemento deve ser mantido
    const shouldKeep = (
      el.id === 'direct-ai-buttons' || // ID principal do container
      el.id === 'persistent-ai-tools' || // ID do container dos botões
      el.getAttribute('data-keep') === 'true' || // Atributo data-keep
      el.closest('#direct-ai-buttons') || // Dentro do container principal
      el.closest('[data-keep="true"]') // Dentro de um elemento para manter
    );
    
    if (!shouldKeep) {
      console.log('Removendo container antigo de AI: ', el.id || el.className);
      el.remove();
    } else {
      console.log('Mantendo container de AI válido: ', el.id || el.className);
    }
  });
};

// Iniciar limpeza periódica
if (typeof window !== 'undefined') {
  setTimeout(cleanupAIButtons, 2000);
  setInterval(cleanupAIButtons, 10000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <App />
    <ToastContainer />
  </HelmetProvider>
)
