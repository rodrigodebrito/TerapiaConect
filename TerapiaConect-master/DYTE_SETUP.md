# Configuração do Dyte para Videoconferência

Este guia explica como configurar o Dyte.io para videoconferência na plataforma TerapiaConect.

## 1. Criar uma conta no Dyte

1. Acesse [https://dev.dyte.io/register](https://dev.dyte.io/register)
2. Registre-se usando seu email profissional
3. Confirme seu email e crie sua organização
4. Navegue para o Dashboard após o login

## 2. Obter as credenciais de API

1. No Dashboard do Dyte, navegue até "API Keys" no menu lateral
2. Você encontrará:
   - **Organization ID**: ID da sua organização
   - **API Key**: Chave de API para integração
   - **Base URL**: URL base para chamadas à API (geralmente https://api.dyte.io/v2)

## 3. Criar Presets para diferentes tipos de usuários

Os presets definem permissões e configurações para diferentes participantes:

1. Navegue até "Presets" no Dashboard do Dyte
2. Crie dois presets:
   - **host**: Para terapeutas (permissões completas)
   - **participant**: Para clientes (permissões limitadas)

### Configurações recomendadas para Host (Terapeuta)

- **Audio**: Enabled
- **Video**: Enabled
- **Chat**: Enabled
- **Polls**: Enabled
- **Screenshare**: Enabled
- **Recording Control**: Enabled
- **Kick Participants**: Enabled
- **Plugins**: Enabled

### Configurações recomendadas para Participants (Cliente)

- **Audio**: Enabled
- **Video**: Enabled
- **Chat**: Enabled
- **Polls**: Disabled
- **Screenshare**: Enabled
- **Recording Control**: Disabled
- **Kick Participants**: Disabled
- **Plugins**: Disabled

## 4. Configurar o ambiente

1. No projeto backend, crie um arquivo `.env` com as seguintes variáveis:

```
DYTE_ORGANIZATION_ID="seu_organization_id"
DYTE_API_KEY="sua_api_key"
DYTE_BASE_URL="https://api.dyte.io/v2"
DYTE_AUTH_HEADER="Basic sua_chave_em_base64"
```

Para gerar o valor do `DYTE_AUTH_HEADER`, use: `base64encode(apikey:organizationid)`

## 5. Criar campos no banco de dados

Execute a rota administrativa para verificar se os campos necessários existem no banco de dados:

```
GET /api/sessions/admin/check-dyte-fields
```

## 6. Usando a videoconferência

1. Ao iniciar uma sessão, o terapeuta clica no botão "Iniciar Videoconferência" na sala de sessão
2. A aplicação cria uma reunião no Dyte e gera tokens de autenticação para o terapeuta e cliente
3. Os participantes entram automaticamente na videoconferência

## 7. Solução de problemas

### Erro ao criar reunião
- Verifique se as credenciais de API estão corretas no arquivo `.env`
- Confirme se os presets "host" e "participant" foram criados no Dashboard do Dyte

### Erro ao entrar na reunião
- Verifique se o usuário tem permissão para acessar a sessão
- Confirme se a reunião foi criada corretamente
- Verifique se o token de autenticação está sendo gerado corretamente

### Problemas de áudio/vídeo
- Verifique se o navegador tem permissão para acessar câmera e microfone
- Tente usar o Chrome, que geralmente tem melhor compatibilidade

## 8. Custos e limites

Lembre-se que o Dyte oferece diferentes planos, incluindo:
- **Plano Free**: Bom para testes, com limites de minutos e participantes
- **Plano Growth**: Para uso em produção com mais recursos

Revise os planos em [https://www.dyte.io/pricing](https://www.dyte.io/pricing) para escolher o mais adequado. 