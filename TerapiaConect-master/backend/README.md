# Backend TerapiaConnect

Este é o backend da aplicação TerapiaConnect, uma plataforma para terapia online com recursos avançados de videoconferência e ferramentas terapêuticas.

## Requisitos

- Node.js 18.x ou superior
- MongoDB
- Redis (para gerenciamento de sessões)
- Jitsi Meet Server (para videoconferência)

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/terapiaconnect
REDIS_URL=redis://localhost:6379
JWT_SECRET=seu_jwt_secret
JITSI_SERVER=https://meet.jit.si
```

## Estrutura do Projeto

```
backend/
├── src/
│   ├── config/         # Configurações do servidor
│   ├── controllers/    # Controladores da aplicação
│   ├── middleware/     # Middlewares personalizados
│   ├── models/         # Modelos do MongoDB
│   ├── routes/         # Rotas da API
│   ├── services/       # Serviços da aplicação
│   └── utils/          # Utilitários e helpers
├── tests/             # Testes automatizados
└── server.js          # Ponto de entrada da aplicação
```

## Funcionalidades Principais

- Autenticação e autorização de usuários
- Gerenciamento de sessões de terapia
- Integração com Jitsi Meet para videoconferência
- Sistema de agendamento
- Ferramentas terapêuticas interativas
- Gestão de documentos e relatórios
- Controle de acesso baseado em papéis (RBAC)

## Scripts Disponíveis

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Iniciar em modo produção
npm start

# Executar testes
npm test

# Verificar cobertura de testes
npm run test:coverage

# Executar linting
npm run lint
```

## API Endpoints

### Autenticação
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me

### Sessões
- GET /api/sessions
- POST /api/sessions
- GET /api/sessions/:id
- PUT /api/sessions/:id
- DELETE /api/sessions/:id

### Usuários
- GET /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### Agendamentos
- GET /api/schedules
- POST /api/schedules
- GET /api/schedules/:id
- PUT /api/schedules/:id
- DELETE /api/schedules/:id

## Websockets

O backend utiliza Socket.IO para comunicação em tempo real:

- Notificações de sessão
- Status de presença
- Chat em tempo real
- Sincronização de ferramentas terapêuticas

## Segurança

- Autenticação JWT
- Sanitização de dados
- Rate limiting
- CORS configurado
- Validação de dados
- Logs de segurança

## Monitoramento

- Winston para logging
- Morgan para logs HTTP
- Métricas de performance
- Monitoramento de erros

## Backup e Recuperação

- Backup automático do MongoDB
- Sistema de logs para auditoria
- Recuperação de dados em caso de falhas

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Suporte

Para suporte, envie um email para suporte@terapiaconnect.com.br

## Licença

Este projeto está sob a licença MIT.

## Implementação da Inteligência Artificial

### Visão Geral
O sistema implementa uma abordagem híbrida de IA que combina processamento local no navegador com análise remota no servidor. Esta arquitetura foi projetada para:
- Maximizar a privacidade dos dados
- Melhorar o desempenho
- Garantir resiliência mesmo com problemas de conectividade
- Fornecer feedback em tempo real

### Componentes Principais

#### 1. Serviço Híbrido de IA (HybridAIService)
- **Localização**: `frontend/src/services/hybridAI.service.js`
- **Responsabilidades**:
  - Reconhecimento de voz em tempo real
  - Processamento local de emoções
  - Anonimização de dados sensíveis
  - Comunicação com o servidor

#### 2. API de IA (aiService)
- **Localização**: `frontend/src/services/aiService.js`
- **Endpoints**:
  - `/api/ai/analyze`: Análise de sessão
  - `/api/ai/suggestions`: Geração de sugestões
  - `/api/ai/report`: Geração de relatórios
  - `/api/ai/transcript`: Salvamento de transcrições

#### 3. Sistema de Treinamento da IA
- **Localização**: `backend/src/services/ai/training.service.js`
- **Funcionalidades**:
  - Upload e processamento de materiais de treinamento
  - Extração automática de insights
  - Categorização de conteúdo
  - Análise contextual de sessões

### Funcionalidades Implementadas

1. **Reconhecimento de Voz**
   - Suporte a múltiplos navegadores
   - Processamento contínuo
   - Resultados intermediários
   - Reinicialização automática

2. **Análise de Emoções**
   - Detecção em tempo real
   - Contagem acumulativa
   - Eventos de notificação
   - Visualização em interface

3. **Anonimização de Dados**
   - Remoção de informações sensíveis
   - Proteção de dados pessoais
   - Substituição de números e documentos

4. **Interface de Usuário**
   - Botões de controle de IA
   - Indicadores de emoções
   - Feedback visual de processamento
   - Controles de microfone

5. **Sistema de Treinamento**
   - Upload de materiais (aulas, supervisões)
   - Processamento automático com GPT-4
   - Extração de insights e conceitos
   - Categorização por tipo e tema
   - Análise contextual de sessões

### API de Treinamento

#### Endpoints Disponíveis
```
POST /api/training/materials
- Adiciona novo material de treinamento
- Parâmetros: title, content, type, category

GET /api/training/materials/:category
- Lista materiais por categoria

GET /api/training/materials/:id
- Obtém detalhes de um material específico

PUT /api/training/materials/:id
- Atualiza um material existente

DELETE /api/training/materials/:id
- Remove um material

POST /api/training/materials/:id/process
- Processa um material manualmente

POST /api/training/enhance-analysis
- Melhora análise de sessão usando materiais
```

#### Processamento de Materiais
1. **Upload de Material**
   ```javascript
   const response = await fetch('/api/training/materials', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer seu-token'
     },
     body: JSON.stringify({
       title: 'Aula sobre TCC',
       content: 'Conteúdo da aula...',
       type: 'aula',
       category: 'TCC'
     })
   });
   ```

2. **Processamento Automático**
   - Extração de conceitos principais
   - Identificação de técnicas e metodologias
   - Análise de casos de exemplo
   - Geração de recomendações
   - Identificação de pontos de atenção

3. **Melhoria de Análises**
   - Contextualização com materiais relevantes
   - Comparação com metodologias aprendidas
   - Sugestões baseadas em casos similares
   - Recomendações específicas por categoria

### Próximos Passos

1. **Melhorias de Performance**
   - [ ] Otimização do processamento local
   - [ ] Cache de resultados
   - [ ] Compressão de dados
   - [ ] Lazy loading de recursos

2. **Expansão de Funcionalidades**
   - [ ] Análise de sentimento mais profunda
   - [ ] Detecção de padrões comportamentais
   - [ ] Sugestões personalizadas
   - [ ] Relatórios detalhados

3. **Segurança e Privacidade**
   - [ ] Criptografia end-to-end
   - [ ] Políticas de retenção de dados
   - [ ] Conformidade com LGPD
   - [ ] Auditoria de acesso

4. **Integração e APIs**
   - [ ] Webhooks para notificações
   - [ ] API REST documentada
   - [ ] SDK para integração
   - [ ] Testes automatizados

5. **Interface e UX**
   - [ ] Temas personalizáveis
   - [ ] Acessibilidade
   - [ ] Responsividade
   - [ ] Animações suaves

6. **Sistema de Treinamento**
   - [ ] Interface para gerenciamento de materiais
   - [ ] Upload de arquivos
   - [ ] Visualização de insights
   - [ ] Sistema de tags
   - [ ] Busca semântica

### Requisitos Técnicos

- Node.js >= 14.x
- NPM >= 6.x
- MongoDB >= 4.4
- TensorFlow.js (frontend)
- Web Speech API (navegador)
- OpenAI API Key

### Instalação

1. Clonar o repositório
2. Instalar dependências:
   ```bash
   npm install
   ```
3. Configurar variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
4. Configurar banco de dados:
   ```bash
   npx prisma migrate dev
   ```
5. Iniciar o servidor:
   ```bash
   npm run dev
   ```

### Contribuição

1. Fork o projeto
2. Criar branch para feature
3. Commit suas mudanças
4. Push para a branch
5. Abrir Pull Request

### Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
