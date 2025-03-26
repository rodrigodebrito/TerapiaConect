/**
 * Serviço para injetar botões de IA diretamente no DOM
 * Este serviço é independente do React para garantir que os botões sempre apareçam
 */

let toolbarInstance = null;
let handlers = {};

/**
 * Cria e adiciona os botões de IA no DOM
 * @param {Object} options - Configurações para os botões
 * @param {Function} options.onAnalyze - Função para analisar a sessão
 * @param {Function} options.onSuggest - Função para gerar sugestões
 * @param {Function} options.onReport - Função para gerar relatório
 * @param {boolean} options.isProcessing - Estado de processamento 
 */
export function createAIToolbar(options = {}) {
  const { onAnalyze, onSuggest, onReport, isProcessing = false } = options;
  
  // Armazenar os manipuladores de eventos
  handlers = {
    onAnalyze: onAnalyze || function() { console.log('Analisar: Função não definida'); },
    onSuggest: onSuggest || function() { console.log('Sugerir: Função não definida'); },
    onReport: onReport || function() { console.log('Relatório: Função não definida'); }
  };
  
  // Remover qualquer toolbar existente
  removeAIToolbar();
  
  // Criar os elementos HTML
  const container = document.createElement('div');
  container.className = 'ai-tools-container-direct';
  
  const toolbar = document.createElement('div');
  toolbar.className = 'ai-simple-toolbar';
  
  // Botão Analisar
  const analyzeBtn = document.createElement('button');
  analyzeBtn.className = 'ai-simple-button';
  analyzeBtn.setAttribute('data-action', 'analyze');
  analyzeBtn.title = 'Analisar a sessão atual';
  analyzeBtn.innerHTML = '<span role="img" aria-label="Analisar">🧠</span><span class="simple-button-text">Analisar</span>';
  analyzeBtn.addEventListener('click', handleAnalyzeClick);
  
  // Botão Sugestões
  const suggestBtn = document.createElement('button');
  suggestBtn.className = 'ai-simple-button';
  suggestBtn.setAttribute('data-action', 'suggest');
  suggestBtn.title = 'Obter sugestões para a sessão';
  suggestBtn.innerHTML = '<span role="img" aria-label="Sugerir">💡</span><span class="simple-button-text">Sugestões</span>';
  suggestBtn.addEventListener('click', handleSuggestClick);
  
  // Botão Relatório
  const reportBtn = document.createElement('button');
  reportBtn.className = 'ai-simple-button';
  reportBtn.setAttribute('data-action', 'report');
  reportBtn.title = 'Gerar relatório da sessão';
  reportBtn.innerHTML = '<span role="img" aria-label="Relatório">📝</span><span class="simple-button-text">Relatório</span>';
  reportBtn.addEventListener('click', handleReportClick);
  
  // Adicionar botões na toolbar
  toolbar.appendChild(analyzeBtn);
  toolbar.appendChild(suggestBtn);
  toolbar.appendChild(reportBtn);
  
  // Adicionar toolbar no container
  container.appendChild(toolbar);
  
  // Adicionar ao body do documento
  document.body.appendChild(container);
  
  // Atualizar estado dos botões
  updateButtonsState(isProcessing);
  
  // Armazenar a instância para uso futuro
  toolbarInstance = {
    container,
    toolbar,
    buttons: {
      analyze: analyzeBtn,
      suggest: suggestBtn,
      report: reportBtn
    }
  };
  
  console.log('Botões de IA injetados com sucesso!');
  
  return toolbarInstance;
}

/**
 * Remove a toolbar de botões de IA do DOM
 */
export function removeAIToolbar() {
  if (toolbarInstance && toolbarInstance.container) {
    try {
      if (toolbarInstance.buttons) {
        // Remover event listeners
        if (toolbarInstance.buttons.analyze) {
          toolbarInstance.buttons.analyze.removeEventListener('click', handleAnalyzeClick);
        }
        if (toolbarInstance.buttons.suggest) {
          toolbarInstance.buttons.suggest.removeEventListener('click', handleSuggestClick);
        }
        if (toolbarInstance.buttons.report) {
          toolbarInstance.buttons.report.removeEventListener('click', handleReportClick);
        }
      }
      
      // Remover do DOM
      document.body.removeChild(toolbarInstance.container);
      toolbarInstance = null;
    } catch (error) {
      console.error('Erro ao remover botões de IA:', error);
    }
  }
}

/**
 * Atualiza o estado dos botões (ativado/desativado)
 * @param {boolean} isProcessing - Se está processando uma operação
 */
export function updateButtonsState(isProcessing) {
  if (!toolbarInstance) return;
  
  Object.values(toolbarInstance.buttons).forEach(button => {
    if (isProcessing) {
      button.setAttribute('disabled', 'disabled');
    } else {
      button.removeAttribute('disabled');
    }
  });
  
  // Gerenciar o indicador de processamento
  const existingIndicator = toolbarInstance.toolbar.querySelector('.simple-processing-indicator');
  
  if (isProcessing && !existingIndicator) {
    const indicator = document.createElement('div');
    indicator.className = 'simple-processing-indicator';
    indicator.innerHTML = '<div class="simple-spinner"></div><span>Processando...</span>';
    toolbarInstance.toolbar.appendChild(indicator);
  } else if (!isProcessing && existingIndicator) {
    existingIndicator.remove();
  }
}

// Event handlers
function handleAnalyzeClick() {
  if (handlers.onAnalyze) handlers.onAnalyze();
}

function handleSuggestClick() {
  if (handlers.onSuggest) handlers.onSuggest();
}

function handleReportClick() {
  if (handlers.onReport) handlers.onReport();
}

// Inicialização automática quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Criar estilos globais para garantir que os botões sejam visíveis
  injectGlobalStyles();
});

/**
 * Adiciona estilos CSS globais para garantir visibilidade dos botões
 */
function injectGlobalStyles() {
  const styleId = 'ai-tools-global-styles';
  
  // Evitar duplicação
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = `
    .ai-tools-container-direct {
      position: fixed !important;
      bottom: 100px !important;
      left: 0 !important;
      width: 100% !important;
      height: auto !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
    }
    
    .ai-simple-toolbar {
      display: flex !important;
      gap: 10px !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
      border-radius: 50px !important;
      padding: 8px 16px !important;
      backdrop-filter: blur(5px) !important;
      -webkit-backdrop-filter: blur(5px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
      pointer-events: all !important;
    }
    
    .ai-simple-button {
      background-color: #2a3e4c !important;
      color: white !important;
      border: none !important;
      border-radius: 50px !important;
      padding: 8px 16px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      font-size: 14px !important;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
    }
    
    .ai-simple-button:hover:not(:disabled) {
      background-color: #3a5268 !important;
      transform: translateY(-2px) !important;
    }
    
    .ai-simple-button:active:not(:disabled) {
      transform: translateY(0) !important;
    }
    
    .ai-simple-button:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }
    
    .ai-simple-button span[role="img"] {
      font-size: 18px !important;
    }
    
    .simple-processing-indicator {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      color: white !important;
      font-size: 14px !important;
      margin-left: 10px !important;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
    }
    
    .simple-spinner {
      width: 16px !important;
      height: 16px !important;
      border: 2px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 50% !important;
      border-top-color: white !important;
      animation: simpleSpin 1s linear infinite !important;
    }
    
    @keyframes simpleSpin {
      to {
        transform: rotate(360deg) !important;
      }
    }
    
    @media (max-width: 768px) {
      .simple-button-text {
        display: none !important;
      }
      
      .ai-simple-button {
        width: 40px !important;
        height: 40px !important;
        padding: 0 !important;
        justify-content: center !important;
      }
      
      .ai-simple-toolbar {
        padding: 8px !important;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

export default {
  createAIToolbar,
  removeAIToolbar,
  updateButtonsState
}; 