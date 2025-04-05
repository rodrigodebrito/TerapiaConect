// Definir a função setupDailyMessageHandlers
const setupDailyMessageHandlers = useCallback((dailyCallObj, clientId) => {
  if (!dailyCallObj) {
    console.error('Objeto Daily.co inválido passado para setupDailyMessageHandlers');
    return;
  }

  try {
    console.log('Configurando listeners para mensagens...');
    
    // Remover qualquer listener existente para evitar duplicação
    try {
      dailyCallObj.off('app-message');
      console.log('Removidos listeners anteriores');
    } catch (cleanupErr) {
      console.warn('Erro ao limpar listeners anteriores:', cleanupErr);
    }
    
    // Configurar novo listener para todas as mensagens do Daily.co
    dailyCallObj.on('app-message', (evt) => {
      const message = evt.data;
      
      // Log detalhado da mensagem recebida
      console.log('📬 Mensagem recebida via Daily.co:', {
        type: message?.type,
        sessionId: message?.sessionId,
        mySessionId: sessionId,
        timestamp: new Date().toISOString()
      });
      
      // Processar mensagens relacionadas à constelação
      if (message && (
          message.type === 'constellation-show' || 
          message.type === 'constellation-toggle' ||
          message.type === 'activate-constellation'
      )) {
        console.log('Mensagem de ativação de constelação recebida:', message);
        
        // Evitar processamento de mensagens antigas
        const msgTime = message.timestamp || Date.now();
        const now = Date.now();
        if (now - msgTime > 10000) {
          console.log('Ignorando mensagem muito antiga (> 10s)');
          return;
        }
        
        // Verificar se a mensagem se aplica a esta sessão
        if (message.sessionId && message.sessionId !== sessionId) {
          console.log('Mensagem para outra sessão, ignorando');
          return;
        }
        
        // Se o campo de constelação deve ser ativado
        if (message.show === true || message.type === 'activate-constellation') {
          console.log('Mensagem indica ativação do campo - disparando evento interno');
          
          // Criar evento interno para ativar o campo
          window.dispatchEvent(new CustomEvent('constellation-show', {
            detail: {
              sessionId,
              show: true,
              remote: true,
              timestamp: Date.now(),
              source: 'daily-message',
              suppressNotification: false,
              originMessage: message
            }
          }));
          
          // Também ativar diretamente o campo via componente
          window.dispatchEvent(new CustomEvent('activate-constellation', {
            detail: {
              sessionId,
              timestamp: Date.now(),
              source: 'daily-message',
              suppressNotification: false
            }
          }));
          
          // Notificar o usuário via toast
          if (!message.suppressNotification) {
            toast.info('Campo de Constelação ativado por outro participante', {
              position: "top-right",
              autoClose: 3000
            });
          }
        }
      } else if (message && message.type === 'constellation-update') {
        // Processar atualizações de posição/rotação dos representantes
        console.log('Recebida atualização de posição/estado para o campo:', message);
        
        // Disparar evento para componentes que precisam processar esta atualização
        window.dispatchEvent(new CustomEvent('constellation-field-update', {
          detail: {
            ...message,
            timestamp: Date.now(),
            source: 'daily-message'
          }
        }));
      } else if (message && message.type === 'client-joined') {
        // Novo cliente entrou na sala
        console.log('Novo cliente entrou na sala:', message.clientId);
        
        // Se este cliente já tem o campo ativo, notificar o novo participante
        if (showConstellation) {
          console.log('Notificando novo participante que o campo já está ativo...');
          
          setTimeout(() => {
            try {
              dailyCallObj.sendAppMessage({
                type: 'constellation-show',
                show: true,
                sessionId,
                timestamp: Date.now(),
                clientId,
                forceUpdate: true,
                source: 'existing-client'
              }, '*');
              
              console.log('Notificação enviada para o novo participante');
            } catch (error) {
              console.error('Erro ao notificar novo participante:', error);
            }
          }, 2000); // Atraso para garantir que o cliente esteja pronto
        }
      }
    });
    
    console.log('✅ Listener para mensagens Daily.co configurado com sucesso');
    
    // Enviar mensagem inicial para notificar presença após um breve delay
    // para garantir que a conexão está estável
    setTimeout(() => {
      try {
        console.log('Enviando mensagem inicial de presença...');
        
        dailyCallObj.sendAppMessage({
          type: 'client-joined',
          sessionId,
          timestamp: Date.now(),
          clientId
        }, '*');
        
        console.log('Mensagem de presença enviada com sucesso');
        
        // Se o campo já estiver ativo, enviar estado para sincronizar
        if (showConstellation) {
          console.log('Campo já ativo neste cliente, notificando outros participantes...');
          
          dailyCallObj.sendAppMessage({
            type: 'constellation-show',
            show: true,
            sessionId,
            timestamp: Date.now(),
            clientId,
            forceUpdate: true
          }, '*');
          
          console.log('Mensagem de sincronização enviada com sucesso');
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem inicial:', error);
      }
    }, 1500);
  } catch (err) {
    console.error('❌ Erro ao configurar listener para app-messages:', err);
  }
}, [sessionId, showConstellation]); 