/**
 * Função que cria botões de forma nativa, sem React,
 * para garantir que não sejam afetados pelo Jitsi
 */
export function injectNativeDownloadButtons(reportText) {
  // Remover botões antigos se existirem
  const oldButtons = document.querySelectorAll('.report-action-fixed-btn');
  oldButtons.forEach(btn => btn.remove());
  
  // Criar botão de download
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'report-action-fixed-btn download-btn';
  downloadBtn.innerHTML = '⬇️';
  downloadBtn.title = 'Baixar Relatório';
  
  // Estilos para o botão de download
  Object.assign(downloadBtn.style, {
    position: 'fixed',
    bottom: '100px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#1e88e5',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    zIndex: '2147483647',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
  // Adicionar evento de clique
  downloadBtn.addEventListener('click', function() {
    try {
      // Criar elemento para download
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
      element.setAttribute('download', 'relatorio-sessao.txt');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      // Notificar usuário
      alert('Relatório baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      alert('Erro ao baixar relatório. Tente novamente.');
    }
  });
  
  // Criar botão de impressão
  const printBtn = document.createElement('button');
  printBtn.className = 'report-action-fixed-btn print-btn';
  printBtn.innerHTML = '🖨️';
  printBtn.title = 'Imprimir Relatório';
  
  // Estilos para o botão de impressão
  Object.assign(printBtn.style, {
    position: 'fixed',
    bottom: '180px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#43a047',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    zIndex: '2147483647',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
  // Adicionar evento de clique
  printBtn.addEventListener('click', function() {
    try {
      // Criar janela de impressão
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
                    `<h3>${p.replace(/^#+\\s+/, '')}</h3>` : 
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
        
        // Notificar usuário
        alert('Preparado para impressão!');
      } else {
        alert('Não foi possível abrir a janela de impressão.');
      }
    } catch (error) {
      console.error('Erro ao preparar impressão:', error);
      alert('Erro ao preparar a impressão. Tente novamente.');
    }
  });
  
  // Adicionar botões ao corpo do documento
  document.body.appendChild(downloadBtn);
  document.body.appendChild(printBtn);
  
  // Criar intervalos para garantir que os botões permaneçam visíveis
  // Usando uma técnica de proteção
  const intervalId = setInterval(() => {
    // Se os botões foram removidos, adicioná-los novamente
    if (!document.querySelector('.report-action-fixed-btn.download-btn')) {
      document.body.appendChild(downloadBtn);
    }
    if (!document.querySelector('.report-action-fixed-btn.print-btn')) {
      document.body.appendChild(printBtn);
    }
    
    // Forçar visibilidade
    downloadBtn.style.display = 'flex';
    printBtn.style.display = 'flex';
  }, 1000);
  
  // Retornar função para remover botões e parar o intervalo
  return function cleanup() {
    clearInterval(intervalId);
    
    // Remover botões
    const buttons = document.querySelectorAll('.report-action-fixed-btn');
    buttons.forEach(btn => btn.remove());
  };
}

/**
 * Injetar o botão no DOM
 */
export function injectDownloadButton(reportText) {
  // Usamos a versão nativa, que é mais robusta
  return injectNativeDownloadButtons(reportText);
} 