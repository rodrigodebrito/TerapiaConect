import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

// Componente que gerencia uma janela flutuante para o Daily.co
const FloatingWindowManager = ({ 
  url, 
  sessionId, 
  isOpen, 
  onClose, 
  width = 400, 
  height = 300,
  title = 'TerapiaConect - Sessão'
}) => {
  const [popupWindow, setPopupWindow] = useState(null);
  const intervalRef = useRef(null);
  const popupRef = useRef(null);
  const attemptRef = useRef(0);
  
  // Verificar se a URL é válida
  const hasValidUrl = url && typeof url === 'string' && (url.startsWith('https://') || url.includes('daily.co'));
  
  // Memoizar a URL para evitar reaberturas desnecessárias
  const urlRef = useRef(url);
  
  // Atualizar a referência de URL
  useEffect(() => {
    if (url && url !== urlRef.current) {
      urlRef.current = url;
      console.log("URL da FloatingWindowManager atualizada:", url);
    }
  }, [url]);
  
  // Efeito para abrir/fechar a janela
  useEffect(() => {
    // Se o componente deve abrir a janela e temos uma URL válida
    if (isOpen && hasValidUrl) {
      // Se já existe uma janela aberta, verificar se está fechada
      if (popupRef.current && !popupRef.current.closed) {
        // A janela já está aberta, apenas focar nela
        popupRef.current.focus();
        return;
      }
      
      try {
        // Definir dimensões e posição
        const left = window.screen.width - width - 20;
        const top = window.screen.height - height - 100;
        
        // Construir URL para a sala
        const safeSessionId = sessionId || 'sessao';
        
        // Verificar se a URL já é uma URL completa ou só um ID de sala
        let iframeUrl;
        if (url.startsWith('https://')) {
          // Usar URL diretamente se já for completa
          iframeUrl = `${window.location.origin}/popup-video?url=${encodeURIComponent(url)}`;
        } else {
          // Construir URL com base no ID da sessão
          iframeUrl = `${window.location.origin}/popup-video?sessionId=${encodeURIComponent(safeSessionId)}`;
        }
        
        console.log("Abrindo popup com URL:", iframeUrl);
        
        // Abrir popup
        const newPopup = window.open(
          iframeUrl,
          'DailyPopup',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,menubar=no,titlebar=yes`
        );
        
        // Verificar se o popup foi aberto com sucesso
        if (!newPopup || newPopup.closed || typeof newPopup.closed === 'undefined') {
          console.error("Falha ao abrir popup. Popups podem estar bloqueados pelo navegador.");
          
          // Incrementar contador de tentativas
          attemptRef.current += 1;
          
          // Se tivermos tentado muitas vezes, desistir
          if (attemptRef.current >= 3) {
            console.error("Muitas tentativas de abrir popup falharam. Desistindo.");
            onClose?.();
            return;
          }
          
          // Tentar novamente após um delay
          setTimeout(() => {
            if (isOpen) {
              console.log("Tentando abrir popup novamente...");
              // Chamar o efeito novamente
              setPopupWindow(null);
            }
          }, 1000);
          
          return;
        }
        
        // Configurar popup
        newPopup.document.title = `${title} - ${safeSessionId}`;
        
        // Guardar referência
        setPopupWindow(newPopup);
        popupRef.current = newPopup;
        
        // Resetar contador de tentativas em caso de sucesso
        attemptRef.current = 0;
        
        // Monitorar fechamento
        intervalRef.current = setInterval(() => {
          if (newPopup.closed) {
            clearInterval(intervalRef.current);
            setPopupWindow(null);
            popupRef.current = null;
            onClose?.();
          }
        }, 1000);
      } catch (error) {
        console.error('Erro ao abrir janela flutuante:', error);
        // Notificar erro ao chamador
        onClose?.();
      }
    } else {
      // Fechar a janela se existir
      if (popupRef.current && !popupRef.current.closed) {
        try {
          popupRef.current.close();
        } catch (e) {
          console.warn("Erro ao fechar popup:", e);
        }
      }
      
      // Limpar intervalo e referências
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setPopupWindow(null);
      popupRef.current = null;
    }
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Não fechar janela automaticamente ao desmontar
      // para permitir que a janela sobreviva a mudanças de rota
    };
  }, [isOpen, hasValidUrl, width, height, sessionId, title, onClose]);
  
  // Efeito para fechar janela se componente for desmontado após tempo suficiente
  useEffect(() => {
    return () => {
      // Se o componente está sendo desmontado, considerar fechar a janela
      // após um atraso para evitar fechamento durante navegação
      if (popupRef.current && !popupRef.current.closed) {
        const popup = popupRef.current;
        
        // Definir flag na janela para sinalizar que o componente foi desmontado
        try {
          popup.componentUnmounted = true;
        } catch (e) {
          // Erro de acesso entre origens, ignorar
        }
        
        // Esperar 5 segundos antes de fechar para permitir navegação
        setTimeout(() => {
          try {
            // Verificar se não há outra instância gerenciando esta janela
            if (popup.componentUnmounted && !popup.closed) {
              console.log("Fechando popup após desmontagem do componente");
              popup.close();
            }
          } catch (e) {
            console.warn("Erro ao tentar fechar popup após desmontagem:", e);
          }
        }, 5000);
      }
    };
  }, []);
  
  return null; // Componente não renderiza UI
};

FloatingWindowManager.propTypes = {
  url: PropTypes.string,
  sessionId: PropTypes.string,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number,
  title: PropTypes.string
};

export default FloatingWindowManager; 