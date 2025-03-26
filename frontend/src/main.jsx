import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import App from './App'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

// Script para limpeza e botões diretos
const cleanupAIButtons = () => {
  // Encontrar e remover todas as implementações antigas
  document.querySelectorAll('[id*="ai-tools"], [class*="ai-tools"]').forEach(el => {
    if (el.id !== 'direct-ai-buttons') {
      console.log('Removendo container antigo de AI: ', el.id || el.className);
      el.remove();
    }
  });
};

// Iniciar limpeza periódica
if (typeof window !== 'undefined') {
  setTimeout(cleanupAIButtons, 2000);
  setInterval(cleanupAIButtons, 10000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer />
  </React.StrictMode>,
)
