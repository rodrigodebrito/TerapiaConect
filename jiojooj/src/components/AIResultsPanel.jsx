import React, { useEffect, useState } from 'react';
import { useAI } from '../contexts/AIContext';
import { toast } from 'react-toastify';
import './AIResultsPanel.css';
import { injectDownloadButton } from './DownloadReportButton';

const AIResultsPanel = () => {
  const { lastResult, isProcessing } = useAI();
  const [visible, setVisible] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [pinnedMode, setPinnedMode] = useState(false);
  const [removeButtonFn, setRemoveButtonFn] = useState(null);

  // Função para injetar CSS de alta prioridade para sobrepor todos os elementos
  const injectHighPriorityCSS = () => {
    // Remove estilo antigo se existir
    const oldStyle = document.getElementById('ai-results-priority-styles');
    if (oldStyle) oldStyle.remove();
    
    // Cria novo estilo
    const style = document.createElement('style');
    style.id = 'ai-results-priority-styles';
    style.innerHTML = `
      #ai-results-overlay-panel {
        position: fixed !important;
        z-index: 9999999999 !important;
        pointer-events: auto !important;
      }
      #ai-results-overlay-panel * {
        pointer-events: auto !important;
      }
      
      /* Força o painel acima dos elementos do jitsi */
      .prejitsi-watermark,
      .watermark,
      .tOQNJSLwCYnxUY3bW0zj,
      #new-toolbox,
      #videospace,
      .filmstrip,
      .subject,
      .tOQNJSLwCYnxUY3bW0zj,
      #jitsiConferenceFrame0,
      button[aria-label="Sair da sessão"],
      button[aria-label="Sair da Sessão"],
      button[aria-label="Leave"],
      button[aria-label="Hang up"],
      button[data-testid="hangup-button"],
      .toolbox-button.hangup,
      .toolbox-button-wth-dialog.hangup {
        z-index: auto !important;
        pointer-events: none !important;
      }
      
      /* Hack específico para o botão de fim de chamada */
      .hangup-button {
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Tenta encontrar e desabilitar o botão de sair da sessão por seletor específico
    setTimeout(() => {
      // Tentar diferentes seletores que podem existir para o botão de sair
      const possibleButtonSelectors = [
        'button[aria-label="Sair da sessão"]',
        'button[aria-label="Sair da Sessão"]',
        'button[aria-label="Leave"]',
        'button[aria-label="Hang up"]',
        'button[data-testid="hangup-button"]',
        '.toolbox-button.hangup',
        '.toolbox-button-wth-dialog.hangup',
        // Seletor baseado na cor vermelha comum em botões de fim de chamada
        'button.red',
        'button.hangup'
      ];
      
      // Tenta todos os seletores
      possibleButtonSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(btn => {
          if (btn) {
            btn.style.visibility = 'hidden';
            btn.style.pointerEvents = 'none';
            btn.style.zIndex = '-1';
            console.log('Botão de sair encontrado e desabilitado:', selector);
          }
        });
      });
    }, 200);
  };

  // Listen for changes in lastResult
  useEffect(() => {
    if (lastResult && !isProcessing) {
      console.log('AIResultsPanel: Received result data:', lastResult);
      setResultData(lastResult);
      setVisible(true);
      
      // Injetar CSS de alta prioridade
      injectHighPriorityCSS();
      
      // SOLUÇÃO FINAL: Botões flutuantes usando React Portal
      if (lastResult.type === 'report') {
        // Obter texto do relatório
        const reportText = lastResult.report || lastResult.data?.report || '';
        
        // Injetar botão de download que permanecerá visível
        const removeButton = injectDownloadButton(reportText);
        setRemoveButtonFn(() => removeButton);
      }
      
      // NOVA SOLUÇÃO DE BACKUP - Muito mais simples e garantida
      // Botões flutuantes independentes de qualquer painel
      if (lastResult.type === 'report') {
        // Remover botões antigos se existirem
        const oldButtons = document.getElementById('floating-report-buttons');
        if (oldButtons) oldButtons.remove();
        
        // Criar container flutuante
        const floatingContainer = document.createElement('div');
        floatingContainer.id = 'floating-report-buttons';
        floatingContainer.style.position = 'fixed';
        floatingContainer.style.top = '150px';
        floatingContainer.style.right = '20px';
        floatingContainer.style.zIndex = '2147483647';
        floatingContainer.style.display = 'flex';
        floatingContainer.style.flexDirection = 'column';
        floatingContainer.style.gap = '10px';
        
        // Botão de download
        const downloadButton = document.createElement('button');
        downloadButton.textContent = '⬇️ Baixar';
        downloadButton.style.backgroundColor = '#1e88e5';
        downloadButton.style.color = 'white';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '50%';
        downloadButton.style.width = '60px';
        downloadButton.style.height = '60px';
        downloadButton.style.fontSize = '16px';
        downloadButton.style.cursor = 'pointer';
        downloadButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        
        downloadButton.addEventListener('click', () => {
          const reportText = lastResult.report || lastResult.data?.report || '';
          
          // Método 1: Usando Blob e URL.createObjectURL
          try {
            const blob = new Blob([reportText], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'relatorio-sessao.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Relatório baixado!');
          } catch (e) {
            console.error('Erro ao baixar com método 1:', e);
            
            // Método 2: Usando data URI
            try {
              const a = document.createElement('a');
              a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText);
              a.download = 'relatorio-sessao.txt';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast.success('Relatório baixado!');
            } catch (e2) {
              console.error('Erro ao baixar com método 2:', e2);
              toast.error('Erro ao baixar. Tente outro navegador.');
            }
          }
        });
        
        // Botão de impressão
        const printButton = document.createElement('button');
        printButton.textContent = '🖨️';
        printButton.style.backgroundColor = '#43a047';
        printButton.style.color = 'white';
        printButton.style.border = 'none';
        printButton.style.borderRadius = '50%';
        printButton.style.width = '60px';
        printButton.style.height = '60px';
        printButton.style.fontSize = '24px';
        printButton.style.cursor = 'pointer';
        printButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        
        printButton.addEventListener('click', () => {
          const reportText = lastResult.report || lastResult.data?.report || '';
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Relatório da Sessão</title>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                    h1 { color: #2c3e50; }
                    h3 { color: #3498db; margin-top: 20px; }
                    p { margin-bottom: 10px; }
                    @media print {
                      body { padding: 0; margin: 1cm; }
                      button { display: none; }
                    }
                  </style>
                </head>
                <body>
                  <h1>Relatório da Sessão</h1>
                  ${reportText.split('\n').map(p => 
                    p.trim() ? (
                      p.startsWith('#') || p.startsWith('##') ? 
                        `<h3>${p.replace(/^#+\s+/, '')}</h3>` : 
                        `<p>${p}</p>`
                    ) : '<br>'
                  ).join('')}
                  <hr>
                  <p style="color: #7f8c8d; font-size: 0.8em;">Gerado por TerapiaConect</p>
                  <button onclick="window.print()" style="margin-top: 20px; padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir Relatório</button>
                </body>
              </html>
            `);
            printWindow.document.close();
            toast.success('Preparado para impressão!');
          } else {
            toast.error('Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão permitidos.');
          }
        });
        
        // Adicionar os botões ao container
        floatingContainer.appendChild(downloadButton);
        floatingContainer.appendChild(printButton);
        
        // Adicionar o container ao documento
        document.body.appendChild(floatingContainer);
      }
      
      // Adição de backup: Forçar criação de botões diretamente no corpo da página
      if (lastResult.type === 'report') {
        setTimeout(() => {
          // Verificar se painel está visível mas sem botões
          const container = document.createElement('div');
          container.id = 'backup-report-buttons';
          container.style.position = 'fixed';
          container.style.top = '20px';
          container.style.left = '20px';
          container.style.zIndex = '9999999999';
          container.style.background = 'white';
          container.style.padding = '15px';
          container.style.borderRadius = '8px';
          container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.gap = '10px';
          
          const title = document.createElement('h3');
          title.textContent = 'Ações do Relatório';
          title.style.margin = '0 0 10px 0';
          title.style.fontSize = '16px';
          
          const downloadBtn = document.createElement('button');
          downloadBtn.innerHTML = '⬇️ Baixar Relatório';
          downloadBtn.style.backgroundColor = '#2196f3';
          downloadBtn.style.color = 'white';
          downloadBtn.style.border = 'none';
          downloadBtn.style.padding = '10px 16px';
          downloadBtn.style.borderRadius = '4px';
          downloadBtn.style.cursor = 'pointer';
          downloadBtn.style.fontSize = '14px';
          downloadBtn.style.display = 'flex';
          downloadBtn.style.alignItems = 'center';
          downloadBtn.style.justifyContent = 'center';
          downloadBtn.style.width = '100%';
          
          downloadBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
              console.log('Iniciando download direto do botão de backup');
              
              // Obter o texto do relatório
              const reportText = lastResult.report || lastResult.data?.report || '';
              
              // Método direto de download
              const element = document.createElement('a');
              element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
              element.setAttribute('download', 'relatorio-sessao.txt');
              element.style.display = 'none';
              
              // Adicionar ao DOM e forçar o clique
              document.body.appendChild(element);
              element.click();
              
              // Limpar
              document.body.removeChild(element);
              
              toast.success('Relatório baixado com sucesso!');
            } catch (error) {
              console.error('Erro ao baixar relatório:', error);
              toast.error('Erro ao baixar o relatório. Tente novamente.');
            }
          };
          
          const printBtn = document.createElement('button');
          printBtn.innerHTML = '🖨️ Imprimir Relatório';
          printBtn.style.backgroundColor = '#4caf50';
          printBtn.style.color = 'white';
          printBtn.style.border = 'none';
          printBtn.style.padding = '10px 16px';
          printBtn.style.borderRadius = '4px';
          printBtn.style.cursor = 'pointer';
          printBtn.style.fontSize = '14px';
          printBtn.style.display = 'flex';
          printBtn.style.alignItems = 'center';
          printBtn.style.justifyContent = 'center';
          printBtn.style.width = '100%';
          
          printBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const reportText = lastResult.report || lastResult.data?.report || '';
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
              <html>
                <head>
                  <title>Relatório da Sessão</title>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                    h1 { color: #2c3e50; }
                    h3 { color: #3498db; margin-top: 20px; }
                    p { margin-bottom: 10px; }
                    @media print {
                      body { padding: 0; margin: 1cm; }
                      button { display: none; }
                    }
                  </style>
                </head>
                <body>
                  <h1>Relatório da Sessão</h1>
                  ${reportText.split('\n').map(p => 
                    p.trim() ? (
                      p.startsWith('#') || p.startsWith('##') ? 
                        `<h3>${p.replace(/^#+\s+/, '')}</h3>` : 
                        `<p>${p}</p>`
                    ) : '<br>'
                  ).join('')}
                  <hr>
                  <p style="color: #7f8c8d; font-size: 0.8em;">Gerado por TerapiaConect</p>
                  <button onclick="window.print()" style="margin-top: 20px; padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir Relatório</button>
                </body>
              </html>
            `);
            printWindow.document.close();
            toast.success('Preparado para impressão!');
          };
          
          const closeBtn = document.createElement('button');
          closeBtn.innerHTML = '✖️ Fechar';
          closeBtn.style.backgroundColor = '#f44336';
          closeBtn.style.color = 'white';
          closeBtn.style.border = 'none';
          closeBtn.style.padding = '10px 16px';
          closeBtn.style.borderRadius = '4px';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.fontSize = '14px';
          closeBtn.style.display = 'flex';
          closeBtn.style.alignItems = 'center';
          closeBtn.style.justifyContent = 'center';
          closeBtn.style.width = '100%';
          
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Remover os botões de backup
            const backupButtons = document.getElementById('backup-report-buttons');
            if (backupButtons) {
              backupButtons.remove();
            }
          };
          
          // Adicionar ao container
          container.appendChild(title);
          container.appendChild(downloadBtn);
          container.appendChild(printBtn);
          container.appendChild(closeBtn);
          
          // Verificar se já existe e remover
          const existingBackup = document.getElementById('backup-report-buttons');
          if (existingBackup) {
            existingBackup.remove();
          }
          
          // Adicionar ao corpo do documento
          document.body.appendChild(container);
        }, 1000);
      }
      
      // Solução radical: Mover o painel para fora do iframe
      setTimeout(() => {
        const portalDiv = document.createElement('div');
        portalDiv.id = 'ai-results-portal';
        portalDiv.style.position = 'fixed';
        portalDiv.style.top = '0';
        portalDiv.style.left = '0';
        portalDiv.style.width = '100vw';
        portalDiv.style.height = '100vh';
        portalDiv.style.zIndex = '9999999999';
        portalDiv.style.pointerEvents = 'auto';
        
        // Adicionar estilos inline para o portal
        const portalStyles = document.createElement('style');
        portalStyles.innerHTML = `
          #ai-results-portal {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999999999 !important;
            pointer-events: auto !important;
          }
          
          #ai-results-portal .ai-results-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 9999999999 !important;
            pointer-events: auto !important;
          }
          
          #ai-results-portal .ai-results-panel {
            background-color: #fff !important;
            border-radius: 8px !important;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3) !important;
            width: 90% !important;
            max-width: 800px !important;
            max-height: 90vh !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            position: relative !important;
            z-index: 9999999999 !important;
            pointer-events: auto !important;
          }
          
          #ai-results-portal .close-button,
          #ai-results-portal .pin-button,
          #ai-results-portal .ai-results-button {
            cursor: pointer !important;
            pointer-events: auto !important;
            z-index: 9999999999 !important;
          }
          
          #ai-results-portal .report-actions {
            display: flex !important;
            gap: 10px !important;
            margin-top: 20px !important;
            justify-content: flex-end !important;
            position: relative !important;
            z-index: 9999999999 !important;
          }
          
          #ai-results-portal .report-action-btn {
            background-color: #2196f3 !important;
            color: white !important;
            border: none !important;
            padding: 10px 16px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 1em !important;
            display: flex !important;
            align-items: center !important;
            font-weight: 500 !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
            pointer-events: auto !important;
            position: relative !important;
            z-index: 9999999999 !important;
          }
          
          #ai-results-portal .report-action-btn:nth-child(2) {
            background-color: #4caf50 !important;
          }
        `;
        document.head.appendChild(portalStyles);
        
        // Adicionar ao topo do documento principal (fora de qualquer iframe)
        document.body.appendChild(portalDiv);
        
        // Forçar a remoção do antigo painel e montar um novo
        const oldPanel = document.getElementById('ai-results-overlay-panel');
        if (oldPanel) {
          try {
            // Cria uma cópia visual do painel existente
            portalDiv.innerHTML = oldPanel.outerHTML;
            // Remover o original
            oldPanel.style.display = 'none';
            
            // Adicionar handlers de eventos aos botões copiados
            // Botão de fechar no header
            const closeButtons = portalDiv.querySelectorAll('.close-button');
            closeButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              });
            });
            
            // Botão de fechar no footer
            const footerCloseButtons = portalDiv.querySelectorAll('.ai-results-footer .ai-results-button');
            footerCloseButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              });
            });
            
            // Botão de pin/fixar
            const pinButtons = portalDiv.querySelectorAll('.pin-button');
            pinButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePinMode();
              });
            });
            
            // Botões de relatório
            const reportActionsDiv = portalDiv.querySelectorAll('.report-actions');
            
            // Garantir que os botões estejam visíveis e clicáveis
            const buttons = reportActionsDiv.querySelectorAll('button');
            if (buttons.length === 0) {
              console.log('Recriando botões de relatório');
              
              // Se não existem botões, recria-los
              if (resultData.type === 'report') {
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'report-action-btn';
                downloadBtn.innerHTML = '<span style="margin-right: 8px;">⬇️</span> Baixar Relatório';
                downloadBtn.style.zIndex = "9999999999";
                downloadBtn.style.position = "relative";
                downloadBtn.style.pointerEvents = "auto";
                downloadBtn.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    console.log('Iniciando download direto do relatório recriado');
                    
                    // Obter o texto do relatório
                    const reportText = resultData.report || resultData.data?.report || '';
                    
                    // Criar o elemento para download
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
                    element.setAttribute('download', 'relatorio-sessao.txt');
                    element.style.display = 'none';
                    
                    // Adicionar ao DOM e forçar o clique
                    document.body.appendChild(element);
                    element.click();
                    
                    // Limpar
                    document.body.removeChild(element);
                    
                    toast.success('Relatório baixado com sucesso!');
                  } catch (error) {
                    console.error('Erro ao baixar relatório:', error);
                    toast.error('Erro ao baixar o relatório. Tente novamente.');
                  }
                };
                
                const printBtn = document.createElement('button');
                printBtn.className = 'report-action-btn';
                printBtn.innerHTML = '<span style="margin-right: 8px;">🖨️</span> Imprimir';
                printBtn.style.zIndex = "9999999999";
                printBtn.style.position = "relative";
                printBtn.style.pointerEvents = "auto";
                printBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const reportText = resultData.report || resultData.data?.report || '';
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Relatório da Sessão</title>
                        <style>
                          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                          h1 { color: #2c3e50; }
                          h3 { color: #3498db; margin-top: 20px; }
                          p { margin-bottom: 10px; }
                          @media print {
                            body { padding: 0; margin: 1cm; }
                            button { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        <h1>Relatório da Sessão</h1>
                        ${reportText.split('\n').map(p => 
                          p.trim() ? (
                            p.startsWith('#') || p.startsWith('##') ? 
                              `<h3>${p.replace(/^#+\s+/, '')}</h3>` : 
                              `<p>${p}</p>`
                          ) : '<br>'
                        ).join('')}
                        <hr>
                        <p style="color: #7f8c8d; font-size: 0.8em;">Gerado por TerapiaConect</p>
                        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir Relatório</button>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  toast.success('Preparado para impressão!');
                });
                
                // Adicionar os botões recriados
                reportActionsDiv.appendChild(downloadBtn);
                reportActionsDiv.appendChild(printBtn);
              }
            } else {
              // Se existem botões, garantir que estão acessíveis
              buttons.forEach(btn => {
                btn.style.zIndex = "9999999999";
                btn.style.position = "relative";
                btn.style.display = "flex";
                btn.style.pointerEvents = "auto";
                btn.style.cursor = "pointer";
              });
            }
          } catch (e) {
            console.error('Erro ao mover painel:', e);
          }
        }
      }, 100);
      
      // Notificar o usuário quando um novo resultado chegar
      if (lastResult.type === 'report') {
        toast.success('Relatório gerado com sucesso!', {
          position: "top-center",
          autoClose: 3000
        });
      } else if (lastResult.type === 'analysis') {
        toast.info('Nova análise disponível!', {
          position: "top-center",
          autoClose: 3000
        });
      } else if (lastResult.type === 'suggestions') {
        toast.info('Novas sugestões disponíveis!', {
          position: "top-center",
          autoClose: 3000
        });
      }
    }
  }, [lastResult, isProcessing]);

  // Adicionar um listener para eventos de teclado para fechar com ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && visible && !pinnedMode) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, pinnedMode]);
  
  // Efeito para lidar com a prioridade de camadas
  useEffect(() => {
    if (visible) {
      injectHighPriorityCSS();
      
      // Chamar função para injetar botões diretamente
      setTimeout(() => {
        injectActionButtonsDirectly();
      }, 500);
      
      // Definir temporizador para forçar a restauração da visibilidade do painel
      const forceVisibilityTimerId = setTimeout(() => {
        // Forçar o painel a aparecer mesmo se algo tentar ocultá-lo
        const portal = document.getElementById('ai-results-portal');
        if (portal) {
          portal.style.display = 'block';
          portal.style.visibility = 'visible';
          portal.style.opacity = '1';
          
          // Forçar visibilidade de todos os botões
          const buttons = portal.querySelectorAll('button');
          buttons.forEach(btn => {
            btn.style.display = 'flex';
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
          });
        }
        
        // Buscar e focar novamente em qualquer botão que pode ter perdido o foco
        setTimeout(() => {
          const downloadBtns = document.querySelectorAll('.report-action-btn');
          if (downloadBtns.length > 0) {
            try {
              // Tentar dar foco ao botão de download
              downloadBtns[0].focus();
              
              // Mostrar qual elemento tem o foco atual para debugging
              console.log('Foco atual:', document.activeElement);
            } catch (e) {
              console.error('Erro ao tentar focar botão:', e);
            }
          }
        }, 200);
      }, 500);
      
      // Tenta sobrescrever qualquer z-index aplicado dinamicamente
      const intervalId = setInterval(() => {
        const overlay = document.getElementById('ai-results-overlay-panel');
        if (overlay) {
          overlay.style.zIndex = "9999999999";
          Array.from(overlay.querySelectorAll('*')).forEach(el => {
            el.style.pointerEvents = 'auto';
          });
        }
        
        // Verificar portal para elementos interativos
        const portal = document.getElementById('ai-results-portal');
        if (portal) {
          // Garantir que o portal esteja visível e interativo
          portal.style.zIndex = "9999999999";
          portal.style.pointerEvents = "auto";
          
          // Verificar se os botões do relatório estão presentes no portal
          const reportActionsDiv = portal.querySelector('.report-actions');
          if (reportActionsDiv) {
            reportActionsDiv.style.zIndex = "9999999999";
            reportActionsDiv.style.pointerEvents = "auto";
            reportActionsDiv.style.display = "flex";
            reportActionsDiv.style.gap = "10px";
            reportActionsDiv.style.marginTop = "20px";
            reportActionsDiv.style.justifyContent = "flex-end";
            
            // Garantir que os botões estejam visíveis e clicáveis
            const buttons = reportActionsDiv.querySelectorAll('button');
            if (buttons.length === 0) {
              console.log('Recriando botões de relatório');
              
              // Se não existem botões, recria-los
              if (resultData.type === 'report') {
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'report-action-btn';
                downloadBtn.innerHTML = '<span style="margin-right: 8px;">⬇️</span> Baixar Relatório';
                downloadBtn.style.zIndex = "9999999999";
                downloadBtn.style.position = "relative";
                downloadBtn.style.pointerEvents = "auto";
                downloadBtn.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    console.log('Iniciando download direto do relatório recriado');
                    
                    // Obter o texto do relatório
                    const reportText = resultData.report || resultData.data?.report || '';
                    
                    // Criar o elemento para download
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
                    element.setAttribute('download', 'relatorio-sessao.txt');
                    element.style.display = 'none';
                    
                    // Adicionar ao DOM e forçar o clique
                    document.body.appendChild(element);
                    element.click();
                    
                    // Limpar
                    document.body.removeChild(element);
                    
                    toast.success('Relatório baixado com sucesso!');
                  } catch (error) {
                    console.error('Erro ao baixar relatório:', error);
                    toast.error('Erro ao baixar o relatório. Tente novamente.');
                  }
                };
                
                const printBtn = document.createElement('button');
                printBtn.className = 'report-action-btn';
                printBtn.innerHTML = '<span style="margin-right: 8px;">🖨️</span> Imprimir';
                printBtn.style.zIndex = "9999999999";
                printBtn.style.position = "relative";
                printBtn.style.pointerEvents = "auto";
                printBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const reportText = resultData.report || resultData.data?.report || '';
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Relatório da Sessão</title>
                        <style>
                          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                          h1 { color: #2c3e50; }
                          h3 { color: #3498db; margin-top: 20px; }
                          p { margin-bottom: 10px; }
                          @media print {
                            body { padding: 0; margin: 1cm; }
                            button { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        <h1>Relatório da Sessão</h1>
                        ${reportText.split('\n').map(p => 
                          p.trim() ? (
                            p.startsWith('#') || p.startsWith('##') ? 
                              `<h3>${p.replace(/^#+\s+/, '')}</h3>` : 
                              `<p>${p}</p>`
                          ) : '<br>'
                        ).join('')}
                        <hr>
                        <p style="color: #7f8c8d; font-size: 0.8em;">Gerado por TerapiaConect</p>
                        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir Relatório</button>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  toast.success('Preparado para impressão!');
                });
                
                // Adicionar os botões recriados
                reportActionsDiv.appendChild(downloadBtn);
                reportActionsDiv.appendChild(printBtn);
              }
            } else {
              // Se existem botões, garantir que estão acessíveis
              buttons.forEach(btn => {
                btn.style.zIndex = "9999999999";
                btn.style.position = "relative";
                btn.style.display = "flex";
                btn.style.pointerEvents = "auto";
                btn.style.cursor = "pointer";
              });
            }
          }
        }
        
        // Forçar que os botões do relatório sejam clicáveis
        const reportButtons = document.querySelectorAll('.report-action-btn');
        reportButtons.forEach(btn => {
          btn.style.position = 'relative';
          btn.style.zIndex = '9999999999';
          btn.style.pointerEvents = 'auto';
        });
        
        // No modo não fixado, bloquear elementos do Jitsi
        if (!pinnedMode) {
          // Tenta bloquear os elementos do Jitsi quando o painel está aberto
          const jitsiElements = document.querySelectorAll('#jitsiConferenceFrame0, #new-toolbox, .filmstrip, .subject, .watermark, .tOQNJSLwCYnxUY3bW0zj');
          jitsiElements.forEach(el => {
            if (el) el.style.pointerEvents = 'none';
          });
        }
      }, 100);
      
      return () => {
        clearInterval(intervalId);
        clearTimeout(forceVisibilityTimerId);
      };
    } else {
      // Restaurar interatividade quando o painel está fechado
      const jitsiElements = document.querySelectorAll('#jitsiConferenceFrame0, #new-toolbox, .filmstrip, .subject, .watermark, .tOQNJSLwCYnxUY3bW0zj');
      jitsiElements.forEach(el => {
        if (el) el.style.pointerEvents = 'auto';
      });
    }
  }, [visible, pinnedMode]);

  const handleClose = () => {
    setVisible(false);
    
    // Remover elementos injetados
    // Remover estilo injetado ao fechar o painel
    const oldStyle = document.getElementById('ai-results-priority-styles');
    if (oldStyle) oldStyle.remove();
    
    // Remover o portal e seus elementos
    const portal = document.getElementById('ai-results-portal');
    if (portal) portal.remove();
    
    // Remover os botões de backup
    const backupButtons = document.getElementById('backup-report-buttons');
    if (backupButtons) backupButtons.remove();
    
    // Remover os botões flutuantes
    const floatingButtons = document.getElementById('floating-report-buttons');
    if (floatingButtons) floatingButtons.remove();
    
    // Remover os botões de ação direta
    const directActions = document.getElementById('direct-report-actions');
    if (directActions) directActions.remove();
    
    // Remover os botões de download
    if (removeButtonFn) {
      removeButtonFn();
      setRemoveButtonFn(null);
    }
    
    // Remover estilos do portal
    const portalStyles = document.querySelectorAll('style');
    portalStyles.forEach(style => {
      if (style.innerHTML && style.innerHTML.includes('#ai-results-portal')) {
        style.remove();
      }
    });
    
    // Restaurar interatividade de elementos
    const jitsiElements = document.querySelectorAll('#jitsiConferenceFrame0, #new-toolbox, .filmstrip, .subject, .watermark, .tOQNJSLwCYnxUY3bW0zj');
    jitsiElements.forEach(el => {
      if (el) el.style.pointerEvents = 'auto';
    });
    
    // Restaurar botões do jitsi
    const possibleButtonSelectors = [
      'button[aria-label="Sair da sessão"]',
      'button[aria-label="Sair da Sessão"]',
      'button[aria-label="Leave"]',
      'button[aria-label="Hang up"]',
      'button[data-testid="hangup-button"]',
      '.toolbox-button.hangup',
      '.toolbox-button-wth-dialog.hangup',
      'button.red',
      'button.hangup'
    ];
    
    possibleButtonSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(btn => {
        if (btn) {
          btn.style.visibility = 'visible';
          btn.style.pointerEvents = 'auto';
          btn.style.zIndex = 'auto';
        }
      });
    });
    
    // Limpar o estado do componente
    console.log('Painel fechado e recursos liberados');
  };
  
  const togglePinMode = () => {
    setPinnedMode(!pinnedMode);
    toast.info(
      !pinnedMode 
        ? '📌 Painel fixado na tela' 
        : '🔓 Painel desfixado',
      { autoClose: 2000 }
    );

    // Forçar recriação dos botões quando o modo é alterado
    setTimeout(() => {
      injectActionButtonsDirectly();
    }, 200);
  };

  // Nova função para injetar botões diretamente no corpo do painel
  const injectActionButtonsDirectly = () => {
    if (!resultData || resultData.type !== 'report') return;
    
    // Tentar encontrar o painel primeiro
    const panels = [
      document.getElementById('ai-results-portal'),
      document.getElementById('ai-results-overlay-panel'),
      document.body
    ];
    
    for (const panel of panels) {
      if (!panel) continue;
      
      // Verificar se já existe botão de ações diretas
      const existingActions = panel.querySelector('#direct-report-actions');
      if (existingActions) {
        existingActions.remove();
      }
      
      // Criar container para os botões
      const actionsContainer = document.createElement('div');
      actionsContainer.id = 'direct-report-actions';
      actionsContainer.style.position = 'fixed';
      actionsContainer.style.top = '50%';
      actionsContainer.style.left = '50%';
      actionsContainer.style.transform = 'translate(-50%, -50%)';
      actionsContainer.style.zIndex = '9999999999';
      actionsContainer.style.display = 'flex';
      actionsContainer.style.flexDirection = 'column';
      actionsContainer.style.gap = '15px';
      actionsContainer.style.backgroundColor = 'white';
      actionsContainer.style.padding = '20px';
      actionsContainer.style.borderRadius = '10px';
      actionsContainer.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
      actionsContainer.style.width = '300px';
      actionsContainer.style.textAlign = 'center';
      
      // Adicionar título
      const title = document.createElement('h3');
      title.textContent = 'Ações para o Relatório';
      title.style.marginTop = '0';
      title.style.marginBottom = '15px';
      title.style.color = '#333';
      title.style.fontSize = '18px';
      
      // Adicionar botão de download
      const downloadBtn = document.createElement('button');
      downloadBtn.innerHTML = '⬇️ Baixar Relatório';
      downloadBtn.style.backgroundColor = '#2196f3';
      downloadBtn.style.color = 'white';
      downloadBtn.style.border = 'none';
      downloadBtn.style.padding = '12px 20px';
      downloadBtn.style.borderRadius = '50px';
      downloadBtn.style.cursor = 'pointer';
      downloadBtn.style.fontSize = '16px';
      downloadBtn.style.fontWeight = 'bold';
      downloadBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
      downloadBtn.style.display = 'flex';
      downloadBtn.style.alignItems = 'center';
      downloadBtn.style.justifyContent = 'center';
      downloadBtn.style.width = '100%';
      
      downloadBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          const reportText = resultData.report || resultData.data?.report || '';
          const element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
          element.setAttribute('download', 'relatorio-sessao.txt');
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          toast.success('Relatório baixado com sucesso!');
        } catch (error) {
          console.error('Erro ao baixar relatório:', error);
          toast.error('Erro ao baixar relatório. Tente novamente.');
        }
      };
      
      // Adicionar botão de impressão
      const printBtn = document.createElement('button');
      printBtn.innerHTML = '🖨️ Imprimir Relatório';
      printBtn.style.backgroundColor = '#4caf50';
      printBtn.style.color = 'white';
      printBtn.style.border = 'none';
      printBtn.style.padding = '12px 20px';
      printBtn.style.borderRadius = '50px';
      printBtn.style.cursor = 'pointer';
      printBtn.style.fontSize = '16px';
      printBtn.style.fontWeight = 'bold';
      printBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
      printBtn.style.display = 'flex';
      printBtn.style.alignItems = 'center';
      printBtn.style.justifyContent = 'center';
      printBtn.style.width = '100%';
      
      printBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const reportText = resultData.report || resultData.data?.report || '';
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>Relatório da Sessão</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                h1 { color: #2c3e50; }
                h3 { color: #3498db; margin-top: 20px; }
                p { margin-bottom: 10px; }
                @media print {
                  body { padding: 0; margin: 1cm; }
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>Relatório da Sessão</h1>
              ${reportText.split('\n').map(p => 
                p.trim() ? (
                  p.startsWith('#') || p.startsWith('##') ? 
                    `<h3>${p.replace(/^#+\s+/, '')}</h3>` : 
                    `<p>${p}</p>`
                ) : '<br>'
              ).join('')}
              <hr>
              <p style="color: #7f8c8d; font-size: 0.8em;">Gerado por TerapiaConect</p>
              <button onclick="window.print()" style="margin-top: 20px; padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir Relatório</button>
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.success('Preparado para impressão!');
      };
      
      // Botão para fechar o painel de ações
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '❌ Fechar';
      closeBtn.style.backgroundColor = '#f44336';
      closeBtn.style.color = 'white';
      closeBtn.style.border = 'none';
      closeBtn.style.padding = '12px 20px';
      closeBtn.style.borderRadius = '50px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '16px';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
      closeBtn.style.display = 'flex';
      closeBtn.style.alignItems = 'center';
      closeBtn.style.justifyContent = 'center';
      closeBtn.style.width = '100%';
      
      closeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Remover apenas este painel de ações
        actionsContainer.remove();
      };
      
      // Adicionar elementos ao container
      actionsContainer.appendChild(title);
      actionsContainer.appendChild(downloadBtn);
      actionsContainer.appendChild(printBtn);
      actionsContainer.appendChild(closeBtn);
      
      // Adicionar container ao painel
      panel.appendChild(actionsContainer);
      break;
    }
  };

  if (!visible || !resultData) return null;

  console.log('AIResultsPanel: Rendering with data:', resultData);
  
  // Garantir que temos um título apropriado
  const getTitle = () => {
    if (resultData.type === 'analysis') return '🔍 Análise da Sessão';
    if (resultData.type === 'suggestions') return '💡 Sugestões';
    if (resultData.type === 'report') return '📝 Relatório da Sessão';
    return '🤖 Resultados da IA';
  };
  
  // Garantir que temos sugestões para exibir
  const getSuggestions = () => {
    if (!resultData.suggestions) return [];
    
    if (Array.isArray(resultData.suggestions)) {
      return resultData.suggestions.length > 0 
        ? resultData.suggestions 
        : ['Não há sugestões específicas para esta conversa no momento.'];
    }
    
    return [resultData.suggestions];
  };
  
  return (
    <div 
      id="ai-results-overlay-panel" 
      className={`ai-results-overlay ${pinnedMode ? 'pinned-mode' : ''}`} 
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        zIndex: 9999999999
      }}
    >
      <div 
        className="ai-results-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 9999999999
        }}
      >
        <div className="ai-results-header">
          <h3>{getTitle()}</h3>
          <div className="header-actions">
            <button 
              className="pin-button" 
              onClick={(e) => {
                // Impedir propagação do evento
                e.stopPropagation();
                e.preventDefault();
                togglePinMode();
              }}
              title={pinnedMode ? "Desafixar painel" : "Fixar painel"}
            >
              {pinnedMode ? '📌' : '📍'}
            </button>
            <button 
              className="close-button" 
              onClick={(e) => {
                // Impedir propagação do evento
                e.stopPropagation();
                e.preventDefault();
                handleClose();
              }}
              title="Fechar"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="ai-results-content" onClick={(e) => e.stopPropagation()}>
          {resultData.error ? (
            <div className="ai-results-error">
              <p>{resultData.error}</p>
              {resultData.message && <p>{resultData.message}</p>}
              
              {/* Mostrar sugestões mesmo se houver erro */}
              {resultData.suggestions && (
                <div className="ai-results-section mt-3">
                  <h4>Sugestões Gerais</h4>
                  <ul>
                    {getSuggestions().map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {resultData.content && (
                <div className="ai-results-section">
                  <p>{resultData.content}</p>
                </div>
              )}
              
              {resultData.analysis && (
                <div className="ai-results-section">
                  <h4>Análise</h4>
                  <p>{resultData.analysis}</p>
                </div>
              )}
              
              {resultData.data && resultData.data.referencedMaterials && resultData.data.referencedMaterials.length > 0 && (
                <div className="ai-results-section">
                  <h4>Materiais de Referência</h4>
                  <div className="referenced-materials">
                    {resultData.data.referencedMaterials.map((material, index) => (
                      <div key={index} className="material-item">
                        <h5>{material.title}</h5>
                        <p className="material-insights">{material.insights}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resultData.suggestions && (
                <div className="ai-results-section">
                  <h4>Sugestões</h4>
                  <ul>
                    {getSuggestions().map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {resultData.data && resultData.data.referencedMaterials && resultData.data.referencedMaterials.length > 0 && (
                <div className="ai-results-section">
                  <h4>Materiais de Referência</h4>
                  <div className="referenced-materials">
                    {resultData.data.referencedMaterials.map((material, index) => (
                      <div key={index} className="material-item">
                        <h5>{material.title}</h5>
                        <p className="material-insights">{material.insights}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resultData.insights && (
                <div className="ai-results-section">
                  <h4>Insights</h4>
                  <p>{resultData.insights}</p>
                </div>
              )}
              
              {/* Adicionando seção específica para Relatórios */}
              {resultData.type === 'report' && (resultData.report || resultData.data?.report) && (
                <div className="ai-results-section" onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}>
                  <h4 className="report-title">📝 Relatório da Sessão</h4>
                  <div className="report-content" onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}>
                    {/* Aplicando formatação especial para o relatório */}
                    <div className="report-text" onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}>
                      {resultData.report ? (
                        resultData.report.split('\n').map((paragraph, idx) => (
                          paragraph.trim() ? (
                            paragraph.startsWith('#') || paragraph.startsWith('##') ? (
                              <h5 key={idx}>{paragraph.replace(/^#+\s+/, '')}</h5>
                            ) : (
                              <p key={idx}>{paragraph}</p>
                            )
                          ) : <br key={idx} />
                        ))
                      ) : (
                        resultData.data?.report.split('\n').map((paragraph, idx) => (
                          paragraph.trim() ? (
                            paragraph.startsWith('#') || paragraph.startsWith('##') ? (
                              <h5 key={idx}>{paragraph.replace(/^#+\s+/, '')}</h5>
                            ) : (
                              <p key={idx}>{paragraph}</p>
                            )
                          ) : <br key={idx} />
                        ))
                      )}
                    </div>
                    <div className="report-instructions">
                      <p>Utilize os botões abaixo para baixar ou imprimir este relatório:</p>
                    </div>
                    <div className="report-actions">
                      <button 
                        className="report-action-btn" 
                        onClick={(e) => {
                          // Impedir propagação do evento
                          e.stopPropagation();
                          e.preventDefault();
                          
                          try {
                            console.log('Iniciando download direto do relatório do componente');
                            
                            // Obter o texto do relatório
                            const reportText = resultData.report || resultData.data?.report || '';
                            
                            // Método direto de download
                            const element = document.createElement('a');
                            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
                            element.setAttribute('download', 'relatorio-sessao.txt');
                            element.style.display = 'none';
                            
                            // Adicionar ao DOM e forçar o clique
                            document.body.appendChild(element);
                            element.click();
                            
                            // Limpar
                            document.body.removeChild(element);
                            
                            toast.success('Relatório baixado com sucesso!');
                          } catch (error) {
                            console.error('Erro ao baixar relatório:', error);
                            toast.error('Erro ao baixar o relatório. Tente novamente.');
                          }
                        }}
                      >
                        <span className="download-icon" style={{ marginRight: '8px' }}>⬇️</span>
                        Baixar Relatório
                      </button>
                      <button 
                        className="report-action-btn" 
                        onClick={(e) => {
                          // Impedir propagação do evento
                          e.stopPropagation();
                          e.preventDefault();
                          
                          const reportText = resultData.report || resultData.data?.report || '';
                          const printWindow = window.open('', '_blank');
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Relatório da Sessão</title>
                                <style>
                                  body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                                  h1 { color: #2c3e50; }
                                  h3 { color: #3498db; margin-top: 20px; }
                                  p { margin-bottom: 10px; }
                                  @media print {
                                    body { padding: 0; margin: 1cm; }
                                    button { display: none; }
                                  }
                                </style>
                              </head>
                              <body>
                                <h1>Relatório da Sessão</h1>
                                ${reportText.split('\n').map(p => 
                                  p.trim() ? (
                                    p.startsWith('#') || p.startsWith('##') ? 
                                      `<h3>${p.replace(/^#+\s+/, '')}</h3>` : 
                                      `<p>${p}</p>`
                                  ) : '<br>'
                                ).join('')}
                                <hr>
                                <p style="color: #7f8c8d; font-size: 0.8em;">Gerado por TerapiaConect</p>
                                <button onclick="window.print()" style="margin-top: 20px; padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir Relatório</button>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          toast.success('Preparado para impressão!');
                        }}
                      >
                        <span className="print-icon" style={{ marginRight: '8px' }}>🖨️</span>
                        Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Exibir seção padrão se não houver nenhum conteúdo */}
              {!resultData.content && !resultData.analysis && 
               !resultData.suggestions && !resultData.insights && 
               !resultData.report && !resultData.data?.report && (
                <div className="ai-results-section">
                  <p>Não foi possível gerar conteúdo específico para esta sessão.</p>
                  <p>Sugestões gerais:</p>
                  <ul>
                    <li>Mantenha uma comunicação clara e empática</li>
                    <li>Observe as reações e sinais não-verbais do paciente</li>
                    <li>Faça perguntas abertas para explorar sentimentos</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="ai-results-footer">
          <button 
            className="ai-results-button" 
            onClick={(e) => {
              // Impedir propagação do evento
              e.stopPropagation();
              e.preventDefault();
              handleClose();
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIResultsPanel; 