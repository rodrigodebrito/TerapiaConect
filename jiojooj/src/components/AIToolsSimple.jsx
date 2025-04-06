import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './AIToolsSimple.css';

const AIToolsSimple = ({ onAnalyze, onSuggest, onReport, isProcessing }) => {
  const toolbarRef = useRef(null);
  
  useEffect(() => {
    // Função para criar o elemento HTML diretamente
    const createToolbar = () => {
      // Criar o container principal
      const container = document.createElement('div');
      container.className = 'ai-tools-container-direct';
      
      // Criar a barra de ferramentas
      const toolbar = document.createElement('div');
      toolbar.className = 'ai-simple-toolbar';
      
      // Botão Analisar
      const analyzeBtn = document.createElement('button');
      analyzeBtn.className = 'ai-simple-button';
      analyzeBtn.title = 'Analisar a sessão atual';
      analyzeBtn.innerHTML = '<span role="img" aria-label="Analisar">🧠</span><span class="simple-button-text">Analisar</span>';
      analyzeBtn.onclick = onAnalyze;
      
      // Botão Sugestões
      const suggestBtn = document.createElement('button');
      suggestBtn.className = 'ai-simple-button';
      suggestBtn.title = 'Obter sugestões para a sessão';
      suggestBtn.innerHTML = '<span role="img" aria-label="Sugerir">💡</span><span class="simple-button-text">Sugestões</span>';
      suggestBtn.onclick = onSuggest;
      
      // Botão Relatório
      const reportBtn = document.createElement('button');
      reportBtn.className = 'ai-simple-button';
      reportBtn.title = 'Gerar relatório da sessão';
      reportBtn.innerHTML = '<span role="img" aria-label="Relatório">📝</span><span class="simple-button-text">Relatório</span>';
      reportBtn.onclick = onReport;
      
      // Adicionar botões na toolbar
      toolbar.appendChild(analyzeBtn);
      toolbar.appendChild(suggestBtn);
      toolbar.appendChild(reportBtn);
      
      // Adicionar toolbar no container
      container.appendChild(toolbar);
      
      // Guardar referência para remover depois
      toolbarRef.current = container;
      
      // Adicionar ao body do documento
      document.body.appendChild(container);
      
      // Atualizar estado dos botões
      updateButtonsState();
    };
    
    // Função para atualizar estado dos botões
    const updateButtonsState = () => {
      if (!toolbarRef.current) return;
      
      const buttons = toolbarRef.current.querySelectorAll('button');
      buttons.forEach(btn => {
        if (isProcessing) {
          btn.setAttribute('disabled', 'disabled');
        } else {
          btn.removeAttribute('disabled');
        }
      });
      
      // Adicionar ou remover indicador de processamento
      const existingIndicator = toolbarRef.current.querySelector('.simple-processing-indicator');
      if (isProcessing && !existingIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'simple-processing-indicator';
        indicator.innerHTML = '<div class="simple-spinner"></div><span>Processando...</span>';
        toolbarRef.current.querySelector('.ai-simple-toolbar').appendChild(indicator);
      } else if (!isProcessing && existingIndicator) {
        existingIndicator.remove();
      }
    };
    
    // Criar a barra de ferramentas
    createToolbar();
    
    // Cleanup function ao desmontar
    return () => {
      if (toolbarRef.current) {
        document.body.removeChild(toolbarRef.current);
        toolbarRef.current = null;
      }
    };
  }, []); // Executar apenas uma vez na montagem
  
  // Efeito para atualizar o estado dos botões quando isProcessing muda
  useEffect(() => {
    if (toolbarRef.current) {
      const buttons = toolbarRef.current.querySelectorAll('button');
      buttons.forEach(btn => {
        if (isProcessing) {
          btn.setAttribute('disabled', 'disabled');
        } else {
          btn.removeAttribute('disabled');
        }
      });
      
      // Adicionar ou remover indicador de processamento
      const existingIndicator = toolbarRef.current.querySelector('.simple-processing-indicator');
      if (isProcessing && !existingIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'simple-processing-indicator';
        indicator.innerHTML = '<div class="simple-spinner"></div><span>Processando...</span>';
        toolbarRef.current.querySelector('.ai-simple-toolbar').appendChild(indicator);
      } else if (!isProcessing && existingIndicator) {
        existingIndicator.remove();
      }
    }
  }, [isProcessing]);
  
  // Este componente não renderiza nada no DOM normal
  return null;
};

AIToolsSimple.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  onSuggest: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool
};

export default AIToolsSimple; 