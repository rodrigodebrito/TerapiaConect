/**
 * Script de diagnóstico e reparo para botões de IA
 * 
 * Este script pode ser executado diretamente no console para 
 * resolver problemas com os botões de IA que não aparecem
 */

(function() {
  console.log('🔍 Iniciando diagnóstico de botões de IA');
  
  // Registrar todos os possíveis contêineres de botões existentes
  const allButtons = document.querySelectorAll('button');
  const aiButtons = Array.from(allButtons).filter(btn => {
    const text = btn.textContent || '';
    return text.includes('Analisar') || 
           text.includes('Sugestões') || 
           text.includes('Relatório');
  });
  
  console.log(`🔍 Encontrados ${aiButtons.length} botões de IA existentes`);
  aiButtons.forEach((btn, index) => {
    console.log(`  Botão #${index + 1}: "${btn.textContent}" - Visível: ${isVisible(btn)}`);
    console.log(`    Classe: ${btn.className}`);
    console.log(`    Pai: ${btn.parentElement?.tagName} com classe ${btn.parentElement?.className}`);
    console.log(`    Z-index computado: ${getComputedStyle(btn).zIndex}`);
    console.log(`    Visibilidade: ${getComputedStyle(btn).visibility}`);
    console.log(`    Display: ${getComputedStyle(btn).display}`);
  });
  
  // Verificar containers que podem estar escondendo os botões
  const containers = document.querySelectorAll('.ai-tools-container, .ai-buttons-container, .ai-toolbar');
  console.log(`🔍 Encontrados ${containers.length} contêineres de botões de IA`);
  containers.forEach((container, index) => {
    console.log(`  Container #${index + 1}: Classe "${container.className}" - Visível: ${isVisible(container)}`);
    console.log(`    Z-index: ${getComputedStyle(container).zIndex}`);
    console.log(`    Position: ${getComputedStyle(container).position}`);
  });
  
  // Verificar iframe do Jitsi
  const iframes = document.querySelectorAll('iframe');
  console.log(`🔍 Encontrados ${iframes.length} iframes na página`);
  iframes.forEach((iframe, index) => {
    console.log(`  Iframe #${index + 1}:`);
    console.log(`    Z-index: ${getComputedStyle(iframe).zIndex}`);
    console.log(`    Dimensões: ${iframe.offsetWidth}x${iframe.offsetHeight}`);
  });
  
  // Função para verificar se um elemento está visível
  function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none') return false;
    if (style.visibility !== 'visible') return false;
    if (style.opacity === '0') return false;
    
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    
    return true;
  }
  
  console.log('🛠️ Executando reparos...');
  
  // Remover qualquer botão ou contêiner existente
  aiButtons.forEach(btn => {
    try {
      console.log(`  Removendo botão "${btn.textContent}"`);
      if (btn.parentElement && btn.parentElement.children.length <= 3) {
        btn.parentElement.remove();
      } else {
        btn.remove();
      }
    } catch (err) {
      console.error(`  Erro ao remover botão:`, err);
    }
  });
  
  containers.forEach(container => {
    try {
      console.log(`  Removendo container "${container.className}"`);
      container.remove();
    } catch (err) {
      console.error(`  Erro ao remover container:`, err);
    }
  });
  
  // Criar novos botões direto no DOM (abordagem de último recurso)
  console.log('🏗️ Criando novos botões com abordagem direta...');
  
  // Obter funções do contexto de AI, se disponível
  let aiContext = null;
  if (window.__AI_CONTEXT) {
    console.log('  Usando contexto de AI global');
    aiContext = window.__AI_CONTEXT;
  }
  
  // Obter o ID da sessão da URL
  function getSessionId() {
    try {
      const path = window.location.pathname;
      
      // Verificar formato /sessions/ID
      const sessionMatch = path.match(/\/sessions\/([a-zA-Z0-9-]+)/);
      if (sessionMatch && sessionMatch[1]) {
        return sessionMatch[1];
      }
      
      // Verificar formato /room/session-ID
      const roomMatch = path.match(/\/room\/session-([a-zA-Z0-9-]+)/);
      if (roomMatch && roomMatch[1]) {
        return roomMatch[1];
      }
      
      // Verificar formato genérico
      const genericMatch = path.match(/\/room\/([a-zA-Z0-9-]+)/);
      if (genericMatch && genericMatch[1]) {
        return genericMatch[1];
      }
    } catch (err) {
      console.error('  Erro ao extrair ID da sessão:', err);
    }
    return 'unknown-session';
  }
  
  // Handlers para os botões
  function handleAnalyze() {
    console.log('Clique em Analisar');
    if (aiContext && aiContext.analyze) {
      aiContext.analyze(getSessionId());
    } else {
      alert('Função de análise não está disponível');
    }
  }
  
  function handleSuggest() {
    console.log('Clique em Sugestões');
    if (aiContext && aiContext.suggest) {
      aiContext.suggest(getSessionId());
    } else {
      alert('Função de sugestões não está disponível');
    }
  }
  
  function handleReport() {
    console.log('Clique em Relatório');
    if (aiContext && aiContext.report) {
      aiContext.report(getSessionId());
    } else {
      alert('Função de relatório não está disponível');
    }
  }
  
  // Criar e injetar botões
  createAndInjectButtons();
  
  function createAndInjectButtons() {
    try {
      // Criar container
      const container = document.createElement('div');
      container.id = 'emergency-ai-buttons';
      container.style.cssText = `
        position: fixed !important;
        bottom: 80px !important;
        left: 0 !important;
        width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
      `;
      
      // Criar toolbar
      const toolbar = document.createElement('div');
      toolbar.style.cssText = `
        display: flex !important;
        gap: 10px !important;
        background-color: rgba(0, 0, 0, 0.8) !important;
        border-radius: 50px !important;
        padding: 8px 16px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        pointer-events: all !important;
      `;
      
      // Função para criar um botão
      function createButton(emoji, text, clickHandler) {
        const button = document.createElement('button');
        button.style.cssText = `
          background-color: #2a3e4c !important;
          color: white !important;
          border: none !important;
          border-radius: 50px !important;
          padding: 8px 16px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          cursor: pointer !important;
          font-size: 14px !important;
          font-family: sans-serif !important;
        `;
        
        const emojiSpan = document.createElement('span');
        emojiSpan.style.fontSize = '18px';
        emojiSpan.textContent = emoji;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        
        button.appendChild(emojiSpan);
        button.appendChild(textSpan);
        button.addEventListener('click', clickHandler);
        
        return button;
      }
      
      // Criar os botões
      const analyzeBtn = createButton('🧠', 'Analisar', handleAnalyze);
      const suggestBtn = createButton('💡', 'Sugestões', handleSuggest);
      const reportBtn = createButton('📝', 'Relatório', handleReport);
      
      // Montar a UI
      toolbar.appendChild(analyzeBtn);
      toolbar.appendChild(suggestBtn);
      toolbar.appendChild(reportBtn);
      container.appendChild(toolbar);
      
      // Adicionar ao body
      document.body.appendChild(container);
      
      console.log('✅ Botões de emergência criados com sucesso');
      return container;
    } catch (err) {
      console.error('❌ Erro ao criar botões de emergência:', err);
      return null;
    }
  }
  
  // Verificar se os botões foram criados corretamente
  setTimeout(() => {
    const emergencyButtons = document.getElementById('emergency-ai-buttons');
    if (emergencyButtons) {
      console.log('✅ Diagnóstico concluído - Botões criados e visíveis');
    } else {
      console.error('❌ Diagnóstico concluído - Falha ao injetar botões');
    }
  }, 1000);
})(); 