# Constelação - Documento de Handover

## Visão Geral do Projeto

Constelação é uma plataforma para conectar terapeutas de constelação familiar e clientes, oferecendo recursos como chat em tempo real, notificações e agendamento de sessões. Este documento resume as implementações, configurações e desafios conhecidos.

## Estrutura do Projeto

- **Frontend**: Next.js (App Router)
- **Backend**: API REST (em desenvolvimento)
- **Chat/Notificações**: WebSockets simulados (para desenvolvimento)

## Principais Funcionalidades Implementadas

### 1. Sistema de Chat
- Interface de chat em tempo real entre clientes e terapeutas
- Suporte para notificações visuais e sonoras 
- Indicador de digitação
- Exibição de status de leitura
- Layout responsivo otimizado para mobile e desktop

### 2. Sistema de Notificações
- Sistema de notificações em tempo real (simulado durante desenvolvimento)
- Contador de mensagens não lidas na navegação
- Toggle para ativar/desativar notificações
- Persistência de preferências no localStorage

### 3. Dashboard 
- Layout principal com navegação lateral
- Exibição de contagem de notificações não lidas
- Design responsivo e consistente

## Arquivos Principais

```
constelacao-frontend/
├── app/
│   ├── dashboard/
│   │   ├── chat/
│   │   │   └── page.tsx      # Página de chat
│   │   └── layout.tsx        # Layout principal do dashboard
│   └── layout.tsx            # Layout global
├── components/
│   └── NotificationProvider.tsx  # Provedor de contexto para notificações
├── services/
│   ├── message.ts            # Serviço para API de mensagens
│   └── notification.ts       # Serviço para notificações em tempo real
├── styles/
│   └── chat.css              # Estilos do chat
└── config.ts                 # Configurações globais
```

## Alterações e Correções Recentes

1. **Correções de API**:
   - Implementada versão simulada do serviço de mensagens para funcionar sem backend
   - Dados mockados para desenvolvimento sem dependência de API externa
   - Adição de respostas simuladas do terapeuta

2. **Correções de UI**:
   - Substituição da imagem do logo por texto estilizado para evitar problemas de carregamento
   - Melhorias no layout para funcionar em diferentes tamanhos de tela
   - Adição de indicador visual para mensagens não lidas

3. **Otimizações de Performance**:
   - Redução de chamadas de API desnecessárias
   - Melhor gerenciamento de estado para evitar re-renderizações
   - Implementação de cache de mensagens

## Configurações Importantes

### Config.ts
```typescript
export const API_URL = 'http://localhost:3000/api';  // URL da API em desenvolvimento
export const AUTH_TOKEN_KEY = 'auth_token';          // Chave para armazenar token no localStorage
export const USER_DATA_KEY = 'user_data';            // Chave para armazenar dados do usuário
```

### JWT Token
O sistema espera um token JWT com:
- `sub`: ID do usuário
- `name`: Nome do usuário
- `role`: Papel do usuário ('client', 'therapist', etc)

### Serviço de Notificações
- Atualmente implementado como simulação para desenvolvimento
- Configurado para enviar respostas simuladas com probabilidade de 50%
- Em produção, deve ser substituído por um serviço WebSocket real

## Problemas Conhecidos e Suas Soluções

1. **Erro de Carregamento de Imagens**:
   - **Problema**: Erro 400 ao carregar `logo.png`
   - **Solução**: Substituído por texto estilizado. Para adicionar imagens, coloque-as em `/public/images/` e use o componente `Image` do Next.js corretamente.

2. **Erros 404 em Chamadas de API**:
   - **Problema**: Endpoints de API não encontrados
   - **Solução**: Implementados serviços simulados para desenvolvimento. Para produção, implemente os endpoints corretos.

3. **Erro de Diretiva Client**:
   - **Problema**: Erro de "use client" em componentes que usam APIs do navegador
   - **Solução**: Adicionada diretiva 'use client' nos arquivos relevantes.

4. **Limite de Listeners de EventEmitter**:
   - **Problema**: Warning sobre número de listeners
   - **Solução**: Aumentado o limite com `setMaxListeners(20)`

## Requisitos para Produção

### 1. Backend API
Implementar os seguintes endpoints:
- `GET /api/therapists/:id` - Dados de um terapeuta
- `GET /api/messages/conversation/:userId` - Histórico de conversa
- `POST /api/messages` - Enviar mensagens
- `PUT /api/messages/mark-read` - Marcar mensagens como lidas

### 2. WebSockets
- Implementar serviço WebSocket real para substituir a simulação
- Configurar handshake com autenticação via token
- Implementar canais por usuário para notificações direcionadas

### 3. Arquivos de Mídia
- Adicionar som de notificação em `/public/sounds/notification.mp3`
- Configurar CDN para imagens e mídia em produção

### 4. Configurações de Ambiente
Será necessário configurar:
- Variáveis de ambiente para diferentes ambientes (dev/prod)
- CORS para permitir conexões WebSocket
- Limites de rate para APIs sensíveis

## Modelos de Monetização Sugeridos

### Opções para Receita
1. **Assinatura para Terapeutas**:
   - Plano Básico: R$79/mês 
   - Plano Premium: R$149-199/mês (com recursos adicionais)

2. **Comissão por Sessão**:
   - 8-10% por sessão agendada pela plataforma

3. **Modelo Híbrido**:
   - Taxa básica menor (R$49/mês) + comissão reduzida (5%)

## Hospedagem Recomendada (Economia)

### Opção Econômica (~R$250-350/mês)
- **Frontend**: Vercel (Plano Hobby gratuito inicialmente)
- **Backend**: Render ($7/mês) ou Railway (~$10/mês)
- **Banco de Dados**: MongoDB Atlas ($9/mês) ou Supabase (gratuito inicialmente)
- **WebSockets**: Socket.io no mesmo servidor de backend

### Videochamadas (Opção Econômica)
Para adicionar videochamadas:
- **Daily.co**: Plano gratuito (40 min por chamada) ou $15/mês + $0.006/minuto
- **Alternativa**: Links para Zoom/Google Meet na fase inicial

## Próximos Passos Recomendados

1. **Desenvolvimento Backend**:
   - Implementar API REST para mensagens e perfis
   - Desenvolver serviço WebSocket real

2. **Recursos Adicionais**:
   - Sistema de agendamento integrado ao chat
   - Videochamadas integradas
   - Pagamentos in-app

3. **Marketing e Onboarding**:
   - Develop página de landing page para captura de terapeutas
   - Criar processo de verificação para terapeutas
   - Implementar sistema de avaliações

## Conclusão

O sistema atual fornece uma base sólida para um produto mínimo viável (MVP), com foco na experiência do chat e notificações. As implementações atuais são simuladas para desenvolvimento rápido, mas foram projetadas para facilitar a transição para um backend real quando estiver pronto.

A arquitetura é escalável e pode crescer para acomodar mais usuários e funcionalidades conforme a plataforma se expande, sem grandes refatorações. 