# Arquitetura da Sessão Terapêutica

## 1. Visão Geral

A sessão terapêutica é um ambiente virtual onde terapeuta e cliente interagem, com suporte a múltiplas ferramentas, incluindo o Campo de Constelação e um assistente IA.

### 1.1 Objetivos
- Fornecer um ambiente seguro e confiável para sessões terapêuticas
- Integrar ferramentas existentes (Campo de Constelação)
- Adicionar novas funcionalidades (Assistente IA)
- Manter a experiência do usuário fluida e intuitiva

### 1.2 Usuários
- **Terapeuta**: Controla a sessão e tem acesso a todas as ferramentas
- **Cliente**: Participa da sessão com permissões limitadas
- **Assistente IA**: Atua como observador e fornece insights

## 2. Arquitetura Técnica

### 2.1 Frontend (Porta 3001)
```
frontend/
├── src/
│   ├── pages/
│   │   └── SessionRoom/
│   │       ├── index.jsx
│   │       ├── VideoArea.jsx
│   │       ├── ToolsMenu.jsx
│   │       └── ActiveTools.jsx
│   ├── components/
│   │   ├── ConstellationField/ (existente)
│   │   ├── AIPanel/
│   │   └── VideoConference/
│   ├── contexts/
│   │   ├── SessionContext.jsx
│   │   └── AIContext.jsx
│   └── services/
│       ├── sessionService.js
│       ├── aiService.js
│       └── websocketService.js
```

### 2.2 Backend (Porta 3000)
```
backend/
├── src/
│   ├── controllers/
│   │   ├── sessionController.js
│   │   └── aiController.js
│   ├── models/
│   │   ├── Session.js
│   │   └── SessionTranscript.js
│   ├── services/
│   │   ├── aiService.js
│   │   └── transcriptionService.js
│   └── websocket/
│       └── sessionHandler.js
```

## 3. Fluxo de Dados

### 3.1 Inicialização da Sessão
1. Terapeuta inicia sessão a partir do agendamento
2. Sistema gera ID único da sessão
3. Cliente recebe notificação/link para entrar
4. Ambos conectam via WebSocket

### 3.2 Durante a Sessão
1. **Videoconferência**:
   - Stream de áudio/vídeo
   - Controles de mídia
   - Indicadores de qualidade

2. **Campo de Constelação**:
   - Estado sincronizado via WebSocket
   - Controles específicos por perfil
   - Salvamento automático

3. **Assistente IA**:
   - Transcrição em tempo real
   - Análise de sentimentos
   - Geração de insights

### 3.3 Finalização da Sessão
1. Salvamento de dados
2. Geração de relatórios
3. Limpeza de recursos

## 4. Segurança

### 4.1 Autenticação
- JWT para autenticação de sessão
- Validação de permissões
- Timeout de sessão

### 4.2 Privacidade
- Criptografia de dados sensíveis
- Política de retenção
- Conformidade com LGPD

### 4.3 Comunicação
- WebSocket seguro (WSS)
- Validação de origem
- Proteção contra ataques

## 5. Integrações

### 5.1 Campo de Constelação
- Manter funcionalidade existente
- Adicionar sincronização em tempo real
- Implementar controles de permissão

### 5.2 Assistente IA
- Integração com serviço de IA
- Processamento de áudio em tempo real
- Geração de relatórios

### 5.3 Videoconferência
- Integração com serviço de videoconferência
- Controles de mídia
- Indicadores de qualidade

## 6. Estados da Sessão

### 6.1 Estados Possíveis
- `PENDING`: Sessão agendada
- `ACTIVE`: Sessão em andamento
- `PAUSED`: Sessão temporariamente pausada
- `COMPLETED`: Sessão finalizada
- `CANCELLED`: Sessão cancelada

### 6.2 Transições
```
PENDING -> ACTIVE
ACTIVE -> PAUSED
PAUSED -> ACTIVE
ACTIVE -> COMPLETED
ANY -> CANCELLED
```

## 7. Armazenamento

### 7.1 Dados da Sessão
- Informações básicas
- Transcrições
- Análises de IA
- Estado do Campo de Constelação

### 7.2 Retenção
- Transcrições: 30 dias
- Análises: 90 dias
- Dados de sessão: 1 ano

## 8. Performance

### 8.1 Otimizações
- Compressão de dados
- Cache de recursos
- Lazy loading de componentes

### 8.2 Limites
- Máximo de 2 participantes por sessão
- Duração máxima: 2 horas
- Tamanho máximo de dados: 1GB

## 9. Monitoramento

### 9.1 Métricas
- Qualidade da conexão
- Uso de recursos
- Erros e exceções

### 9.2 Logs
- Eventos da sessão
- Ações dos usuários
- Erros e warnings

## 10. Próximos Passos

### 10.1 Fase 1 - Estrutura Base
- [ ] Implementar modelo de dados
- [ ] Criar endpoints básicos
- [ ] Configurar WebSocket

### 10.2 Fase 2 - Interface
- [ ] Desenvolver layout da sessão
- [ ] Integrar videoconferência
- [ ] Implementar menu de ferramentas

### 10.3 Fase 3 - Integrações
- [ ] Integrar Campo de Constelação
- [ ] Implementar assistente IA
- [ ] Adicionar relatórios

### 10.4 Fase 4 - Refinamento
- [ ] Otimizar performance
- [ ] Implementar testes
- [ ] Documentar API 