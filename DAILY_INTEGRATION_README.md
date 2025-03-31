# Integração do Daily.co para Videoconferência - Guia Completo

## Introdução

O TerapiaConect agora utiliza o Daily.co como solução principal de videoconferência, substituindo o Jitsi Meet. O Daily.co oferece maior estabilidade, qualidade de vídeo superior e suporte a sessões de longa duração (até 2 horas por padrão).

## Configuração Inicial

Para começar a usar o Daily.co, siga estes passos:

### 1. Criar uma conta no Daily.co

1. Acesse [daily.co](https://www.daily.co/) e clique em "Sign up"
2. Crie uma conta gratuita usando seu email profissional
3. Após confirmar seu email, você será direcionado ao dashboard

### 2. Obter a API Key

1. No dashboard do Daily.co, navegue até "Developers" no menu lateral
2. Clique em "API keys"
3. Copie sua API key

### 3. Configurar o arquivo .env

Abra o arquivo `backend/.env` e adicione sua API key:

```
DAILY_API_KEY=sua_api_key_aqui
```

## Como Funciona a Integração

### Criação de Salas

- As salas de videoconferência são criadas automaticamente quando um terapeuta ou cliente inicia uma sessão
- Cada sala tem um nome único baseado no ID da sessão e timestamp
- As salas têm duração padrão de 2 horas, ideal para sessões terapêuticas

### Participantes

- Terapeutas e clientes recebem tokens de acesso específicos para suas funções
- Os terapeutas têm permissões de host, permitindo controle total da sala
- Os clientes têm permissões limitadas

### Fallback e Estabilidade

- O sistema atual substitui completamente o Jitsi pelo Daily.co
- Não é mais necessário um sistema de fallback, pois o Daily.co oferece alta confiabilidade

## Diferenças em Relação ao Jitsi

### Vantagens

- **Estabilidade superior**: Menos quedas e problemas de conexão
- **Melhor qualidade de vídeo**: Adaptação inteligente à qualidade da conexão
- **Sessões mais longas**: Ideal para terapias que exigem 2 horas ou mais
- **Menos recursos computacionais**: Funciona bem em dispositivos mais antigos
- **Compatibilidade**: Funciona em mais navegadores e sistemas operacionais

### Ajustes necessários

- O frontend foi modificado para usar o Daily.co em vez do Jitsi
- Os componentes de interface foram simplificados e melhorados
- A mesma API de IA e transcrição permanece funcionando

## Aspectos Técnicos

### Frontend

O componente `FallbackMeeting` foi modificado para usar o Daily.co em vez do Jitsi:

- Remoção da complexa inicialização do Jitsi
- Simplificação do código com abordagem de iframe direto
- Manutenção de todas as funcionalidades de IA existentes

### Backend

O controlador de reuniões foi adaptado para usar o Daily.co:

- Serviço `daily.service.js` para interagir com a API do Daily.co
- Reutilização dos campos existentes no banco de dados (`dyteMeetingId`, `dyteRoomName`)
- Função de criação de tokens para segurança adicional

## Plano Gratuito vs Pago

### Plano Gratuito (atual)

- Até 1,000 minutos de uso por mês
- Até 4 participantes por sala
- Duração máxima de 60 minutos por sala (contornável com renovação automática)

### Plano Pago

Recomendado para uso profissional contínuo:
- A partir de $20/mês
- Até 20,000 minutos de uso
- Até 300 participantes por sala
- Duração de sala ilimitada
- Gravação de sessões (opcional)

## Possíveis Problemas e Soluções

### URL da Sala Não Encontrada

Se ocorrer erro de "URL not found" ao acessar uma sala Daily:
1. Verifique se você criou um subdomínio válido no Daily.co
2. Confirme que sua API key está configurada corretamente
3. Verifique os logs do backend para mais detalhes

### Autorização de Câmera/Microfone

Se um usuário não conseguir ativar câmera ou microfone:
1. Verifique as permissões do navegador
2. Use o Chrome para maior compatibilidade
3. Certifique-se de que não há outro aplicativo usando a câmera/microfone

## Próximos Passos (Opcional)

- Implementar gravação de sessões (recurso premium)
- Adicionar salas de espera para clientes
- Personalizar a interface com branding do TerapiaConect

## Resumo das Alterações Realizadas

A migração do Jitsi para o Daily.co envolveu as seguintes mudanças:

### Arquivos criados:
- `backend/src/services/daily.service.js`: Implementação do serviço para integração com a API do Daily.co
- `DAILY_INTEGRATION_README.md`: Documentação detalhada sobre a integração

### Arquivos modificados:
- `frontend/src/components/FallbackMeeting.jsx`: Substituição completa da integração com Jitsi pela integração com Daily.co
- `backend/src/controllers/meeting.controller.js`: Atualização do controlador para usar o serviço Daily.co
- `backend/.env`: Adição da variável `DAILY_API_KEY` 
- `frontend/.env`: Substituição de `VITE_JITSI_SERVER` por `VITE_DAILY_API_KEY`
- `README.md`: Atualização da documentação principal para refletir a nova integração

### Dependências adicionadas:
- `@daily-co/react`: SDK React oficial do Daily.co para front-end

### Melhorias técnicas:
- Simplificação do código de videoconferência
- Redução do número de dependências
- Maior estabilidade e desempenho
- Manutenção da compatibilidade com o sistema de IA existente

---

Para mais informações ou suporte, consulte a [documentação oficial do Daily.co](https://docs.daily.co/). 