import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente que gerencia uma janela popup real utilizando window.open
 * Esta abordagem permite que a janela permaneça visível mesmo quando o usuário muda de aba
 */
const PopupWindow = ({ 
  url, 
  title = 'TerapiaConect Video', 
  width = 400, 
  height = 300, 
  onClose,
  isOpen
}) => {
  const popupRef = useRef(null);
  const checkIntervalRef = useRef(null);
  
  useEffect(() => {
    // Função para abrir a janela popup
    const openPopup = () => {
      if (popupRef.current && !popupRef.current.closed) {
        // Janela já existe, apenas focar nela
        popupRef.current.focus();
        return;
      }
      
      // Posicionar no canto inferior direito da tela
      const left = window.screen.width - width - 20;
      const top = window.screen.height - height - 60;
      
      // Configurar a URL com parâmetros específicos para o modo flutuante
      const popupUrl = url.includes('?') 
        ? `${url}&floating=true&showControls=minimal&layout=active` 
        : `${url}?floating=true&showControls=minimal&layout=active`;
      
      // Abrir a popup
      const popup = window.open(
        popupUrl,
        title,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,menubar=no,toolbar=no`
      );
      
      // Guardar referência à janela
      popupRef.current = popup;
      window.dailyPopupWindow = popup; // Para acesso global se necessário
      
      // Configurar monitoramento da janela
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      checkIntervalRef.current = setInterval(() => {
        if (popup && popup.closed) {
          // Janela foi fechada pelo usuário
          clearInterval(checkIntervalRef.current);
          popupRef.current = null;
          
          // Notificar o componente pai
          if (onClose) onClose();
        }
      }, 1000);
    };
    
    // Fechar a janela popup
    const closePopup = () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
        popupRef.current = null;
      }
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
    
    // Abrir ou fechar com base na prop isOpen
    if (isOpen && url) {
      openPopup();
    } else {
      closePopup();
    }
    
    // Fechar ao desmontar
    return () => {
      closePopup();
    };
  }, [url, title, width, height, onClose, isOpen]);
  
  // Não renderiza nada no DOM, apenas gerencia a janela popup
  return null;
};

PopupWindow.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool
};

export default PopupWindow; 