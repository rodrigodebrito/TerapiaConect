/**
 * AIToolsLoader.js
 * Script para injetar botões de IA diretamente no DOM, independente do React
 */

function loadAITools() {
  // Remover qualquer botão existente para evitar duplicados
  const existingButtons = document.getElementById('ai-buttons-final');
  if (existingButtons) {
    console.log('Removendo botões de IA existentes');
    existingButtons.remove();
  }

  // Limpar também quaisquer outros botões de IA que possam existir
  function cleanupOldButtons() {
    // Seletores para containers de botões antigos
    const selectors = [
      '.ai-tools-container', 
      '.ai-buttons-container', 
      '.ai-toolbar',
      '.ai-tools-wrapper',
      '.ai-buttons-wrapper',
      '.ai-tools',
      '#ai-tools-final',
      '[id*="ai-tools"]',
      '[class*="ai-tools"]'
    ];
    
    // Remover todos os containers antigos
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el && el.id !== 'ai-buttons-final') {
          console.log(`Removendo container antigo: ${el.className || el.id}`);
          el.remove();
        }
      });
    });
    
    // Procurar e remover botões específicos pelo texto
    document.querySelectorAll('button').forEach(button => {
      const text = button.textContent || '';
      if (
        (text.includes('Analisar') || 
         text.includes('Sugestões') || 
         text.includes('Relatório')) && 
        !button.closest('#ai-buttons-final')
      ) {
        console.log(`Removendo botão antigo: ${text}`);
        const parent = button.parentElement;
        if (parent && parent.children.length <= 3) {
          parent.remove(); // Remover o container inteiro se tiver poucos filhos
        } else {
          button.remove(); // Remover só o botão
        }
      }
    });
  }
  
  // Limpar botões antigos antes de criar novos
  cleanupOldButtons();

  // Criar um script inline para garantir que tudo seja executado no contexto global do navegador
  const script = document.createElement("script");
  script.textContent = `
  (function() {
    console.log("Injetando botões de IA...");
    
    // Limpar botões antigos
    function cleanupOldButtons() {
      const selectors = [
        '.ai-tools-container', 
        '.ai-buttons-container', 
        '.ai-toolbar',
        '.ai-tools-wrapper',
        '.ai-buttons-wrapper',
        '.ai-tools',
        '#ai-tools-final',
        '[id*="ai-tools"]',
        '[class*="ai-tools"]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.id !== 'ai-buttons-final') {
            el.remove();
          }
        });
      });
      
      document.querySelectorAll('button').forEach(button => {
        const text = button.textContent || '';
        if (
          (text.includes('Analisar') || 
           text.includes('Sugestões') || 
           text.includes('Relatório')) && 
          !button.closest('#ai-buttons-final')
        ) {
          const parent = button.parentElement;
          if (parent && parent.children.length <= 3) {
            parent.remove();
          } else {
            button.remove();
          }
        }
      });
    }
    
    // Limpar qualquer botão existente
    cleanupOldButtons();
    
    // Verificar se já existe um container com esse ID
    const existingContainer = document.getElementById('ai-buttons-final');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Criar container principal
    const container = document.createElement("div");
    container.id = "ai-buttons-final";
    container.style.cssText = "position: fixed !important; bottom: 80px !important; left: 0 !important; width: 100% !important; display: flex !important; justify-content: center !important; align-items: center !important; pointer-events: none !important; z-index: 2147483647 !important;";
    
    // Criar toolbar
    const toolbar = document.createElement("div");
    toolbar.style.cssText = "display: flex !important; gap: 10px !important; background-color: rgba(0, 0, 0, 0.8) !important; border-radius: 50px !important; padding: 8px 16px !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important; pointer-events: all !important;";
    
    // Função para criar um botão
    function createButton(emoji, text, clickHandler) {
      const button = document.createElement("button");
      button.style.cssText = "background-color: #2a3e4c !important; color: white !important; border: none !important; border-radius: 50px !important; padding: 8px 16px !important; display: flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important; font-size: 14px !important; font-family: sans-serif !important;";
      
      const emojiSpan = document.createElement("span");
      emojiSpan.style.fontSize = "18px";
      emojiSpan.textContent = emoji;
      
      const textSpan = document.createElement("span");
      textSpan.textContent = text;
      
      button.appendChild(emojiSpan);
      button.appendChild(textSpan);
      button.onclick = clickHandler;
      
      return button;
    }
    
    // Obter ID da sessão da URL
    function getSessionId() {
      try {
        const path = window.location.pathname;
        
        // Verificar formato /sessions/ID
        const sessionMatch = path.match(/\\/sessions\\/([a-zA-Z0-9-]+)/);
        if (sessionMatch && sessionMatch[1]) {
          return sessionMatch[1];
        }
        
        // Verificar formato /room/session-ID
        const roomMatch = path.match(/\\/room\\/([a-zA-Z0-9-]+)/);
        if (roomMatch && roomMatch[1]) {
          const parts = roomMatch[1].split("-");
          return parts.length > 1 ? parts[1] : roomMatch[1];
        }
        
        // Verificar formato /session/ID
        const sessionDirectMatch = path.match(/\\/session\\/([a-zA-Z0-9-]+)/);
        if (sessionDirectMatch && sessionDirectMatch[1]) {
          return sessionDirectMatch[1];
        }
      } catch (err) {
        console.error("Erro ao extrair ID da sessão:", err);
      }
      return "unknown-session";
    }
    
    // Handlers para os botões
    const analyzeBtn = createButton("🧠", "Analisar", function() {
      if (window.__AI_CONTEXT && window.__AI_CONTEXT.analyze) {
        console.log("Executando análise para sessão:", getSessionId());
        window.__AI_CONTEXT.analyze(getSessionId());
      } else {
        alert("Função de análise não disponível");
        console.error("Contexto AI não disponível", window.__AI_CONTEXT);
      }
    });
    
    const suggestBtn = createButton("💡", "Sugestões", function() {
      if (window.__AI_CONTEXT && window.__AI_CONTEXT.suggest) {
        console.log("Executando sugestões para sessão:", getSessionId());
        window.__AI_CONTEXT.suggest(getSessionId());
      } else {
        alert("Função de sugestões não disponível");
      }
    });
    
    const reportBtn = createButton("📝", "Relatório", function() {
      if (window.__AI_CONTEXT && window.__AI_CONTEXT.report) {
        console.log("Executando relatório para sessão:", getSessionId());
        window.__AI_CONTEXT.report(getSessionId());
      } else {
        alert("Função de relatório não disponível");
      }
    });
    
    // Montar a UI
    toolbar.appendChild(analyzeBtn);
    toolbar.appendChild(suggestBtn);
    toolbar.appendChild(reportBtn);
    container.appendChild(toolbar);
    
    // Adicionar ao body
    document.body.appendChild(container);
    console.log("Botões de IA criados com sucesso");
  })();
  `;
  
  // Adicionar o script ao documento
  document.head.appendChild(script);
}

export { loadAITools };
export default { loadAITools }; 