/**
 * Componente para gerenciar a janela flutuante
 * Esse arquivo contém funções utilitárias para abrir uma chamada em uma janela popup separada
 */

/**
 * Abre uma janela flutuante com a URL da videochamada
 * @param {string} url - URL da sala de videochamada
 * @param {string} sessionId - ID da sessão para título da janela
 * @param {Function} onClose - Callback chamado quando a janela for fechada
 * @returns {Object} - Referência à janela aberta e função para fechá-la
 */
export const openFloatingWindow = (url, sessionId, onClose) => {
  // Se já existe uma janela aberta, focar nela
  if (window.dailyPopupWindow && !window.dailyPopupWindow.closed) {
    window.dailyPopupWindow.focus();
    return { 
      window: window.dailyPopupWindow,
      close: () => closeFloatingWindow()
    };
  }
  
  try {
    // Configurar dimensões e posição da janela
    const width = 480;
    const height = 320;
    const left = window.screen.width - width - 20;
    const top = window.screen.height - height - 60;
    
    // Configurar a URL com parâmetros específicos para o modo flutuante
    const popupUrl = url.includes('?') 
      ? `${url}&floating=true&showControls=minimal&layout=active` 
      : `${url}?floating=true&showControls=minimal&layout=active`;
    
    // Abrir a janela popup
    const popup = window.open(
      popupUrl,
      `TerapiaConect - Sessão: ${sessionId || ''}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,menubar=no,toolbar=no`
    );
    
    if (!popup) {
      throw new Error('Não foi possível abrir a janela flutuante');
    }
    
    // Guardar referência à janela
    window.dailyPopupWindow = popup;
    
    // Configurar monitoramento da janela
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('Janela flutuante fechada pelo usuário');
        delete window.dailyPopupWindow;
        
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    }, 1000);
    
    return {
      window: popup,
      close: () => closeFloatingWindow()
    };
  } catch (error) {
    console.error('Erro ao abrir janela flutuante:', error);
    throw error;
  }
};

/**
 * Fecha a janela flutuante se estiver aberta
 */
export const closeFloatingWindow = () => {
  if (window.dailyPopupWindow && !window.dailyPopupWindow.closed) {
    window.dailyPopupWindow.close();
    delete window.dailyPopupWindow;
  }
};

export default {
  openFloatingWindow,
  closeFloatingWindow
}; 