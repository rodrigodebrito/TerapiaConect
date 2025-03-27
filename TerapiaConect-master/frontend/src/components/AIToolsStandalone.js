/**
 * AIToolsStandalone.js
 * Componente independente para botões de IA que podem ser injetados em qualquer lugar
 */

// Configuração inicial
const AIToolsStandalone = {
  config: {
    onAnalyze: null,
    onSuggest: null,
    onReport: null,
    isProcessing: false,
    zIndex: 2147483647, // Máximo z-index possível
    position: 'bottom', // 'bottom', 'top', 'left', 'right'
    emotions: {} // Para exibir as emoções detectadas
  },
  
  // IDs e referências para controle
  elements: {
    container: null,
    toolbar: null,
    buttons: {
      analyze: null,
      suggest: null,
      report: null
    },
    emotions: null
  },
  
  /**
   * Inicializa o componente com as configurações fornecidas
   * @param {Object} config Configurações para os botões
   */
  init(config = {}) {
    console.log('AIToolsStandalone: Inicializando');
    
    // Mesclar configurações padrão com as fornecidas
    this.config = { ...this.config, ...config };
    
    // Verificar se o contexto AI está disponível globalmente
    if (window.__AI_CONTEXT) {
      console.log('AIToolsStandalone: Conectado ao contexto AI do React');
      this.config.onAnalyze = this.config.onAnalyze || window.__AI_CONTEXT.analyze;
      this.config.onSuggest = this.config.onSuggest || window.__AI_CONTEXT.suggest;
      this.config.onReport = this.config.onReport || window.__AI_CONTEXT.report;
      
      // Escutar mudanças no contexto
      window.addEventListener('ai-context-updated', this.handleContextUpdated.bind(this));
    }
    
    // Iniciar verificação periódica para garantir que os botões estejam presentes
    this.startButtonsCheck();
    
    // Criar botões
    this.createButtons();
    
    return this;
  },
  
  /**
   * Manipulador para eventos do contexto AI
   * @param {Event} event O evento disparado
   */
  handleContextUpdated(event) {
    if (event.detail && event.detail.hasOwnProperty('isProcessing')) {
      this.setProcessing(event.detail.isProcessing);
    }
    if (event.detail && event.detail.hasOwnProperty('emotions')) {
      this.updateEmotions(event.detail.emotions);
    }
  },
  
  /**
   * Inicia verificação periódica da existência dos botões
   */
  startButtonsCheck() {
    // Limpar qualquer verificador existente
    if (this._buttonsCheckInterval) {
      clearInterval(this._buttonsCheckInterval);
    }
    
    // Verificar a cada 5 segundos se os botões existem
    this._buttonsCheckInterval = setInterval(() => {
      const container = document.getElementById('ai-tools-container');
      
      if (!container) {
        console.log('AIToolsStandalone: Botões não encontrados, recriando...');
        this.createButtons();
      }
    }, 5000);
  },
  
  /**
   * Configura o estado de processamento nos botões
   * @param {boolean} isProcessing Indica se está processando
   */
  setProcessing(isProcessing) {
    this.config.isProcessing = isProcessing;
    
    // Atualizar visual dos botões
    if (this.elements.buttons.analyze) {
      this.elements.buttons.analyze.disabled = isProcessing;
    }
    if (this.elements.buttons.suggest) {
      this.elements.buttons.suggest.disabled = isProcessing;
    }
    if (this.elements.buttons.report) {
      this.elements.buttons.report.disabled = isProcessing;
    }
    
    // Adicionar ou remover classe de processamento
    const container = document.getElementById('ai-tools-container');
    if (container) {
      if (isProcessing) {
        container.classList.add('processing');
      } else {
        container.classList.remove('processing');
      }
    }
  },
  
  /**
   * Atualiza as emoções exibidas
   * @param {Object} emotions Objeto com emoções e seus valores
   */
  updateEmotions(emotions) {
    this.config.emotions = emotions;
    
    // Se tiver um elemento de emoções, atualizar
    if (this.elements.emotions) {
      // Limpar emoções anteriores
      this.elements.emotions.innerHTML = '';
      
      // Adicionar emoções detectadas
      if (emotions && Object.keys(emotions).length > 0) {
        // Ordenar emoções por intensidade
        const sortedEmotions = Object.entries(emotions)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3); // Mostrar apenas as 3 mais intensas
        
        sortedEmotions.forEach(([emotion, intensity]) => {
          if (intensity >= 0.1) { // Mostrar apenas se tiver intensidade significativa
            const emotionEl = document.createElement('div');
            emotionEl.className = 'emotion-indicator';
            
            // Mapear emoção para emoji
            const emoji = this.getEmotionEmoji(emotion);
            
            emotionEl.innerHTML = `<span class="emotion-emoji">${emoji}</span>`;
            emotionEl.style.opacity = Math.min(1, intensity);
            
            this.elements.emotions.appendChild(emotionEl);
          }
        });
      }
    }
  },
  
  /**
   * Mapeia uma emoção para um emoji correspondente
   * @param {string} emotion Nome da emoção em inglês
   * @returns {string} Emoji correspondente
   */
  getEmotionEmoji(emotion) {
    const emotionMap = {
      happiness: '😊',
      sadness: '😢',
      anger: '😠',
      surprise: '😲',
      fear: '😨',
      disgust: '🤢',
      neutral: '😐',
      joy: '😄',
      trust: '🤝',
      anticipation: '🤔',
      love: '❤️',
      optimism: '🌞',
      pessimism: '☁️',
      anxiety: '😰'
    };
    
    return emotionMap[emotion.toLowerCase()] || '❓';
  },
  
  /**
   * Limpa elementos antigos para evitar duplicação
   */
  cleanup() {
    // Remover botões antigos
    const oldContainer = document.getElementById('ai-tools-container');
    if (oldContainer) {
      console.log('AIToolsStandalone: Removendo container antigo');
      oldContainer.remove();
    }
    
    // Limpar verificador periódico
    if (this._buttonsCheckInterval) {
      clearInterval(this._buttonsCheckInterval);
    }
    
    // Remover listeners
    window.removeEventListener('ai-context-updated', this.handleContextUpdated);
    
    // Procurar por botões específicos que possam estar perdidos
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const text = button.textContent?.trim() || '';
      if (text.includes('Analisar') || text.includes('Sugestões') || text.includes('Relatório')) {
        console.log(`AIToolsStandalone: Removendo botão antigo: ${text}`);
        button.remove();
      }
    });
  },
  
  /**
   * Cria os botões de ferramentas IA no DOM
   */
  createButtons() {
    // Limpar botões anteriores
    this.cleanup();
    
    // Criar container principal
    const container = document.createElement('div');
    container.id = 'ai-tools-container';
    container.className = 'ai-tools-container';
    container.style.cssText = `
      position: fixed !important;
      bottom: 80px !important;
      left: 0 !important;
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      pointer-events: none !important;
      z-index: ${this.config.zIndex} !important;
    `;
    
    // Criar toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'ai-toolbar';
    toolbar.style.cssText = `
      display: flex !important;
      gap: 10px !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
      border-radius: 50px !important;
      padding: 8px 16px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
      pointer-events: all !important;
      position: relative !important;
    `;
    
    // Criar contenedor de emoções
    const emotionsContainer = document.createElement('div');
    emotionsContainer.className = 'ai-emotions-container';
    emotionsContainer.style.cssText = `
      position: absolute !important;
      top: -30px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      display: flex !important;
      gap: 5px !important;
      justify-content: center !important;
    `;
    
    // Criar botões
    const analyzeBtn = this.createButton('🧠', 'Analisar', () => {
      if (this.config.onAnalyze) {
        this.config.onAnalyze();
      } else {
        console.error('AIToolsStandalone: Callback de análise não configurado');
      }
    });
    
    const suggestBtn = this.createButton('💡', 'Sugestões', () => {
      if (this.config.onSuggest) {
        this.config.onSuggest();
      } else {
        console.error('AIToolsStandalone: Callback de sugestões não configurado');
      }
    });
    
    const reportBtn = this.createButton('📝', 'Relatório', () => {
      if (this.config.onReport) {
        this.config.onReport();
      } else {
        console.error('AIToolsStandalone: Callback de relatório não configurado');
      }
    });
    
    // Desabilitar botões se estiver processando
    if (this.config.isProcessing) {
      analyzeBtn.disabled = true;
      suggestBtn.disabled = true;
      reportBtn.disabled = true;
      container.classList.add('processing');
    }
    
    // Guardar referências
    this.elements.container = container;
    this.elements.toolbar = toolbar;
    this.elements.emotions = emotionsContainer;
    this.elements.buttons.analyze = analyzeBtn;
    this.elements.buttons.suggest = suggestBtn;
    this.elements.buttons.report = reportBtn;
    
    // Montar componentes
    toolbar.appendChild(analyzeBtn);
    toolbar.appendChild(suggestBtn);
    toolbar.appendChild(reportBtn);
    toolbar.appendChild(emotionsContainer);
    container.appendChild(toolbar);
    
    // Adicionar ao DOM
    document.body.appendChild(container);
    
    // Atualizar emoções iniciais
    this.updateEmotions(this.config.emotions);
    
    console.log('AIToolsStandalone: Botões criados com sucesso');
    
    return container;
  },
  
  /**
   * Cria um botão com ícone e texto
   * @param {string} emoji O emoji para o botão
   * @param {string} text O texto do botão
   * @param {Function} clickHandler A função de clique
   * @returns {HTMLButtonElement}
   */
  createButton(emoji, text, clickHandler) {
    const button = document.createElement('button');
    button.className = 'ai-button';
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
      transition: all 0.2s ease !important;
    `;
    
    const emojiSpan = document.createElement('span');
    emojiSpan.style.fontSize = '18px';
    emojiSpan.style.display = 'inline-block';
    emojiSpan.textContent = emoji;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    // Adicionar state style
    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.backgroundColor = '#3a5268 !important';
        button.style.transform = 'translateY(-2px)';
      }
    });
    
    button.addEventListener('mouseleave', () => {
      if (!button.disabled) {
        button.style.backgroundColor = '#2a3e4c !important';
        button.style.transform = 'translateY(0)';
      }
    });
    
    button.addEventListener('click', clickHandler);
    
    button.appendChild(emojiSpan);
    button.appendChild(textSpan);
    
    return button;
  }
};

export default AIToolsStandalone; 