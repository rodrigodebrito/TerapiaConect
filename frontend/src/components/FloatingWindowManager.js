import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';

/**
 * Componente para gerenciar uma janela popup para videochamada
 * Implementa window.open para criar uma janela real separada
 */
export const FloatingWindowManager = ({ 
  url = '',
  sessionId, 
  isOpen, 
  onClose, 
  width = 480,
  height = 320,
  title = 'TerapiaConect Video'
}) => {
  const popupRef = useRef(null);
  const checkIntervalRef = useRef(null);
  
  useEffect(() => {
    const openWindow = () => {
      try {
        if (!url) {
          console.error('URL não fornecida para a janela flutuante');
          toast.error('Não foi possível abrir a janela flutuante: URL inválida');
          return;
        }
        
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.focus();
          return;
        }
        
        const left = window.screen.width - width - 20;
        const top = window.screen.height - height - 60;
        
        const popupUrl = url.includes('?') 
          ? `${url}&floating=true&showControls=minimal&layout=active` 
          : `${url}?floating=true&showControls=minimal&layout=active`;
        
        const popup = window.open(
          popupUrl,
          `TerapiaConect - Sessão: ${sessionId || ''}`,
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,menubar=no,toolbar=no`
        );
        
        if (!popup) {
          toast.error('Não foi possível abrir a janela flutuante. Verifique as configurações do seu navegador.');
          return;
        }
        
        popupRef.current = popup;
        window.dailyPopupWindow = popup;
        
        toast.success('Janela flutuante ativada');
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        
        checkIntervalRef.current = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
            popupRef.current = null;
            window.dailyPopupWindow = null;
            
            if (onClose) onClose();
          }
        }, 1000);
      } catch (error) {
        console.error('Erro ao abrir janela flutuante:', error);
        toast.error('Não foi possível abrir a janela flutuante');
      }
    };
    
    const closeWindow = () => {
      try {
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        
        popupRef.current = null;
        window.dailyPopupWindow = null;
      } catch (error) {
        console.error('Erro ao fechar janela flutuante:', error);
      }
    };
    
    console.log("FloatingWindowManager useEffect running", { isOpen, url, hasUrl: !!url });
    
    if (isOpen && url) {
      openWindow();
    } else if (popupRef.current) {
      closeWindow();
    }
    
    return () => {
      closeWindow();
    };
  }, [url, sessionId, isOpen, onClose, width, height, title]);
  
  return null;
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