# TerapiaConect

Sistema de conexão entre terapeutas e pacientes para terapia online.

## 📋 Visão Geral

O TerapiaConect é uma plataforma que conecta terapeutas e pacientes, facilitando o agendamento e realização de sessões de terapia online. O sistema oferece uma interface intuitiva para gerenciamento de consultas, comunicação entre profissionais e pacientes, e integração com sistemas de pagamento.

### 🎯 Objetivos
- Facilitar o encontro entre terapeutas e pacientes
- Simplificar o processo de agendamento de consultas
- Oferecer ferramentas de comunicação segura
- Garantir a privacidade e confidencialidade das sessões
- Integrar com sistemas de pagamento para facilitar transações

### 👥 Público-Alvo
- Psicólogos, terapeutas e outros profissionais de saúde mental
- Pacientes em busca de atendimento psicológico online
- Clínicas e consultórios que desejam expandir para o ambiente digital

## 🚀 Estado Atual do Projeto

### Backend
- **Tecnologias**: Node.js, Express, Socket.IO
- **Deploy**: Render (render.com)
- **Banco de Dados**: MongoDB Atlas
- **Autenticação**: JWT + Google OAuth
- **Arquitetura**: API REST + WebSockets
- **Porta**: 3000
- **Integrações**: OpenAI, Google Calendar, Stripe

### Frontend
- **Tecnologias**: React, Next.js, TailwindCSS
- **Deploy**: Vercel
- **Autenticação**: NextAuth.js
- **UI/UX**: Design responsivo e moderno
- **Porta**: 3001 (desenvolvimento)

### Funcionalidades Implementadas
- ✅ Autenticação de usuários (Google + Email/Senha)
- ✅ Perfis de terapeutas e pacientes
- ✅ Agendamento de consultas
- ✅ Chat em tempo real
- ✅ Notificações
- ✅ Integração com Google Calendar
- ✅ Sistema de pagamentos
- ✅ Área administrativa
- ✅ Histórico de sessões
- ✅ Relatórios e estatísticas
- ✅ Sistema de avaliações

### Problemas Identificados

#### 1. Estrutura do Código
- Duplicação de código em arquivos .cjs
- Geração de código no Dockerfile
- Falta de processo de build adequado
- Arquivos misturados entre CommonJS e ES Modules
- Falta de padronização na estrutura de diretórios

#### 2. Deployment
- Diferenças entre ambiente local e Render
- Configurações de CORS complexas
- Processo de build não otimizado
- Dependências desatualizadas
- Configurações de ambiente inconsistentes

#### 3. Manutenção
- Dificuldade para implementar novas features
- Risco de erros em deploys
- Complexidade na depuração
- Falta de testes automatizados
- Documentação insuficiente

## 📁 Estrutura de Diretórios

### Backend
```
backend/
├── src/
│   ├── config/           # Configurações do sistema
│   │   ├── database.js   # Configuração do MongoDB
│   │   ├── auth.js       # Configuração de autenticação
│   │   └── socket.js     # Configuração do Socket.IO
│   ├── controllers/      # Controladores da API
│   │   ├── auth.js       # Autenticação
│   │   ├── users.js      # Usuários
│   │   ├── appointments.js # Agendamentos
│   │   ├── payments.js   # Pagamentos
│   │   └── chat.js       # Chat
│   ├── models/           # Modelos do MongoDB
│   │   ├── User.js       # Modelo de usuário
│   │   ├── Appointment.js # Modelo de agendamento
│   │   ├── Payment.js    # Modelo de pagamento
│   │   └── Message.js    # Modelo de mensagem
│   ├── routes/           # Rotas da API
│   │   ├── auth.js       # Rotas de autenticação
│   │   ├── users.js      # Rotas de usuários
│   │   ├── appointments.js # Rotas de agendamentos
│   │   ├── payments.js   # Rotas de pagamentos
│   │   └── chat.js       # Rotas de chat
│   ├── middlewares/      # Middlewares
│   │   ├── auth.js       # Middleware de autenticação
│   │   ├── validation.js # Validação de dados
│   │   └── error.js      # Tratamento de erros
│   ├── services/         # Serviços
│   │   ├── openai.js     # Integração com OpenAI
│   │   ├── google.js     # Integração com Google
│   │   └── stripe.js     # Integração com Stripe
│   ├── utils/            # Utilitários
│   │   ├── logger.js     # Logging
│   │   ├── email.js      # Envio de emails
│   │   └── helpers.js    # Funções auxiliares
│   └── app.js            # Aplicação Express
├── tests/                # Testes
│   ├── unit/             # Testes unitários
│   ├── integration/      # Testes de integração
│   └── e2e/              # Testes end-to-end
├── .env.example          # Exemplo de variáveis de ambiente
├── .eslintrc.js          # Configuração do ESLint
├── .prettierrc           # Configuração do Prettier
├── jest.config.js        # Configuração do Jest
├── package.json          # Dependências e scripts
└── README.md             # Documentação
```

### Frontend
```
frontend/
├── public/               # Arquivos estáticos
│   ├── images/           # Imagens
│   ├── fonts/            # Fontes
│   └── icons/            # Ícones
├── src/
│   ├── components/       # Componentes React
│   │   ├── common/       # Componentes comuns
│   │   ├── layout/       # Componentes de layout
│   │   ├── auth/         # Componentes de autenticação
│   │   ├── appointments/ # Componentes de agendamentos
│   │   ├── chat/         # Componentes de chat
│   │   └── payments/     # Componentes de pagamentos
│   ├── pages/            # Páginas Next.js
│   │   ├── _app.js       # Configuração do app
│   │   ├── _document.js  # Configuração do documento
│   │   ├── index.js      # Página inicial
│   │   ├── login.js      # Página de login
│   │   ├── register.js   # Página de registro
│   │   ├── dashboard/    # Páginas do dashboard
│   │   ├── appointments/ # Páginas de agendamentos
│   │   ├── chat/         # Páginas de chat
│   │   └── payments/     # Páginas de pagamentos
│   ├── hooks/            # Hooks personalizados
│   │   ├── useAuth.js    # Hook de autenticação
│   │   ├── useSocket.js  # Hook de socket
│   │   └── useForm.js    # Hook de formulário
│   ├── contexts/         # Contextos React
│   │   ├── AuthContext.js # Contexto de autenticação
│   │   └── SocketContext.js # Contexto de socket
│   ├── services/         # Serviços
│   │   ├── api.js        # Cliente da API
│   │   ├── auth.js       # Serviço de autenticação
│   │   └── socket.js     # Serviço de socket
│   ├── utils/            # Utilitários
│   │   ├── formatters.js # Formatadores
│   │   ├── validators.js # Validadores
│   │   └── helpers.js    # Funções auxiliares
│   ├── styles/           # Estilos
│   │   ├── globals.css   # Estilos globais
│   │   └── components/   # Estilos de componentes
│   └── config/           # Configurações
│       ├── constants.js  # Constantes
│       └── theme.js      # Tema
├── .env.example          # Exemplo de variáveis de ambiente
├── .eslintrc.js          # Configuração do ESLint
├── .prettierrc           # Configuração do Prettier
├── jest.config.js        # Configuração do Jest
├── next.config.js        # Configuração do Next.js
├── package.json          # Dependências e scripts
└── README.md             # Documentação
```

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/register` | Registro de usuário | Não |
| POST | `/api/auth/login` | Login de usuário | Não |
| POST | `/api/auth/google` | Login com Google | Não |
| POST | `/api/auth/refresh` | Atualizar token | Sim |
| POST | `/api/auth/logout` | Logout | Sim |
| GET | `/api/auth/me` | Obter usuário atual | Sim |

### Usuários
| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/users` | Listar usuários | Sim (Admin) |
| GET | `/api/users/:id` | Obter usuário | Sim |
| PUT | `/api/users/:id` | Atualizar usuário | Sim |
| DELETE | `/api/users/:id` | Excluir usuário | Sim (Admin) |
| GET | `/api/users/therapists` | Listar terapeutas | Sim |
| GET | `/api/users/patients` | Listar pacientes | Sim |

### Agendamentos
| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/appointments` | Listar agendamentos | Sim |
| GET | `/api/appointments/:id` | Obter agendamento | Sim |
| POST | `/api/appointments` | Criar agendamento | Sim |
| PUT | `/api/appointments/:id` | Atualizar agendamento | Sim |
| DELETE | `/api/appointments/:id` | Cancelar agendamento | Sim |
| GET | `/api/appointments/therapist/:id` | Agendamentos do terapeuta | Sim |
| GET | `/api/appointments/patient/:id` | Agendamentos do paciente | Sim |

### Chat
| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/chat/conversations` | Listar conversas | Sim |
| GET | `/api/chat/conversations/:id` | Obter conversa | Sim |
| POST | `/api/chat/conversations` | Criar conversa | Sim |
| GET | `/api/chat/messages/:conversationId` | Listar mensagens | Sim |
| POST | `/api/chat/messages` | Enviar mensagem | Sim |
| PUT | `/api/chat/messages/:id` | Atualizar mensagem | Sim |
| DELETE | `/api/chat/messages/:id` | Excluir mensagem | Sim |

### Pagamentos
| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/payments` | Listar pagamentos | Sim |
| GET | `/api/payments/:id` | Obter pagamento | Sim |
| POST | `/api/payments` | Criar pagamento | Sim |
| POST | `/api/payments/webhook` | Webhook do Stripe | Não |
| GET | `/api/payments/user/:id` | Pagamentos do usuário | Sim |

### Administração
| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/admin/stats` | Estatísticas | Sim (Admin) |
| GET | `/api/admin/users` | Gerenciar usuários | Sim (Admin) |
| GET | `/api/admin/appointments` | Gerenciar agendamentos | Sim (Admin) |
| GET | `/api/admin/payments` | Gerenciar pagamentos | Sim (Admin) |
| GET | `/api/admin/reports` | Relatórios | Sim (Admin) |

## 🔄 Fluxos de Dados

### Autenticação
1. Usuário acessa a página de login/registro
2. Preenche formulário ou seleciona login com Google
3. Frontend envia requisição para o backend
4. Backend valida credenciais
5. Backend gera token JWT
6. Frontend armazena token no localStorage
7. Frontend redireciona para dashboard

### Agendamento
1. Paciente seleciona terapeuta
2. Paciente escolhe data e horário disponíveis
3. Frontend envia requisição para o backend
4. Backend verifica disponibilidade
5. Backend cria agendamento no banco de dados
6. Backend envia notificação para o terapeuta
7. Backend adiciona evento ao Google Calendar
8. Frontend atualiza interface

### Chat
1. Usuário acessa a conversa
2. Frontend estabelece conexão WebSocket
3. Usuário envia mensagem
4. Frontend envia mensagem para o backend via WebSocket
5. Backend processa mensagem
6. Backend armazena mensagem no banco de dados
7. Backend envia mensagem para o destinatário via WebSocket
8. Frontend atualiza interface

### Pagamento
1. Paciente seleciona sessão para pagamento
2. Frontend solicita sessão do Stripe
3. Frontend redireciona para página de pagamento do Stripe
4. Paciente conclui pagamento
5. Stripe envia webhook para o backend
6. Backend processa webhook
7. Backend atualiza status do pagamento
8. Backend envia notificação para o terapeuta
9. Frontend atualiza interface

## 🔄 Plano de Refatoração

### Fase 1: Preparação (2-3 dias)

#### 1. Análise da Estrutura Atual
- [x] Mapear todos os arquivos .cjs
- [x] Identificar dependências
- [x] Documentar fluxos críticos
- [x] Analisar padrões de código existentes
- [x] Identificar pontos de melhoria

#### 2. Setup do Ambiente de Desenvolvimento
- [ ] Configurar ambiente local
- [ ] Criar banco de dados de teste
- [ ] Preparar variáveis de ambiente
- [ ] Configurar ferramentas de linting
- [ ] Preparar ambiente de testes

#### 3. Criação da Branch de Desenvolvimento
- [ ] Criar branch `feature/clean-structure`
- [ ] Configurar ambiente de staging no Render
- [ ] Preparar pipeline de testes
- [ ] Configurar CI/CD
- [ ] Definir métricas de qualidade

### Fase 2: Desenvolvimento (3-4 dias)

#### 1. Reorganização da Estrutura
- [ ] Criar nova estrutura de diretórios
- [ ] Migrar arquivos .cjs
- [ ] Atualizar imports/exports
- [ ] Padronizar nomenclatura
- [ ] Organizar por domínios

#### 2. Implementação do Build
- [ ] Configurar Babel
- [ ] Criar scripts de build
- [ ] Documentar processo
- [ ] Otimizar dependências
- [ ] Configurar cache

#### 3. Limpeza do Dockerfile
- [ ] Remover geração de código
- [ ] Otimizar processo de build
- [ ] Atualizar configurações
- [ ] Reduzir tamanho da imagem
- [ ] Implementar multi-stage builds

### Fase 3: Testes (2-3 dias)

#### 1. Testes Locais
- [ ] Testar todos os endpoints
- [ ] Verificar WebSockets
- [ ] Validar autenticação
- [ ] Testar integrações
- [ ] Verificar performance

#### 2. Testes em Staging
- [ ] Deploy para ambiente de staging
- [ ] Testar integrações
- [ ] Validar performance
- [ ] Simular carga
- [ ] Testar recuperação de falhas

#### 3. Documentação
- [ ] Atualizar README
- [ ] Documentar processos
- [ ] Criar guias de troubleshooting
- [ ] Documentar APIs
- [ ] Criar diagramas de arquitetura

### Fase 4: Deploy (1-2 dias)

#### 1. Preparação
- [ ] Backup do banco de dados
- [ ] Preparar rollback
- [ ] Agendar janela de manutenção
- [ ] Notificar usuários
- [ ] Preparar monitoramento

#### 2. Migração
- [ ] Deploy da nova versão
- [ ] Verificar logs
- [ ] Monitorar métricas
- [ ] Validar integrações
- [ ] Verificar performance

#### 3. Pós-deploy
- [ ] Validar funcionalidades
- [ ] Monitorar erros
- [ ] Coletar feedback
- [ ] Ajustar configurações
- [ ] Documentar lições aprendidas

## 🛠️ Manutenção

### Processo de Deploy
1. Desenvolvimento em branch feature
2. Testes locais
3. Deploy para staging
4. Testes em staging
5. Merge para master
6. Deploy para produção

### Boas Práticas
1. Sempre testar localmente antes do deploy
2. Manter backups do banco de dados
3. Documentar todas as alterações
4. Seguir padrões de código
5. Revisar logs após deploys
6. Manter dependências atualizadas
7. Seguir princípios SOLID
8. Implementar testes automatizados
9. Usar versionamento semântico
10. Manter documentação atualizada

## ❗ Troubleshooting

### Problemas Comuns

#### CORS
- Verificar configurações no backend
- Confirmar URLs permitidas
- Checar headers nas requisições
- Verificar configurações do proxy
- Checar configurações do servidor web

#### Autenticação
- Verificar tokens JWT
- Confirmar configurações do Google OAuth
- Checar sessões no frontend
- Verificar cookies e localStorage
- Checar configurações de segurança

#### Deploy
- Verificar logs no Render
- Confirmar variáveis de ambiente
- Checar status do banco de dados
- Verificar conectividade
- Checar recursos disponíveis

#### Performance
- Verificar consultas ao banco de dados
- Otimizar carregamento de assets
- Implementar cache quando possível
- Verificar uso de memória
- Monitorar tempo de resposta

## 📋 Requisitos do Sistema

### Backend
- Node.js 18.x ou superior
- MongoDB 5.x ou superior
- NPM 8.x ou superior
- Mínimo 1GB de RAM
- 20GB de espaço em disco

### Frontend
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Conexão estável com a internet
- Resolução mínima de 1024x768

## 🚀 Instalação e Configuração

### Backend
```bash
# Clonar o repositório
git clone https://github.com/rodrigodebrito/TerapiaConect.git
cd TerapiaConect

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar o arquivo .env com suas configurações

# Iniciar o servidor
npm run dev
```

### Frontend
```bash
# Navegar para o diretório do frontend
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar o arquivo .env.local com suas configurações

# Iniciar o servidor de desenvolvimento
npm run dev
```

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente (Backend)
```
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=seu_segredo_jwt
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
OPENAI_API_KEY=sua_chave_api
STRIPE_SECRET_KEY=sua_chave_stripe
```

### Variáveis de Ambiente (Frontend)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu_client_id
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=sua_chave_publica
```

## 📊 Arquitetura do Sistema

### Diagrama de Componentes
```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Frontend      |<--->|  Backend       |<--->|  Banco de      |
|  (Next.js)     |     |  (Node.js)     |     |   Dados        |
|                |     |                |     |  (MongoDB)     |
+----------------+     +----------------+     +----------------+
        ^                      ^                      ^
        |                      |                      |
        v                      v                      v
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Google OAuth  |     |  OpenAI API    |     |  Stripe API    |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
```

### Fluxo de Dados
1. Usuário acessa o frontend
2. Autenticação via Google OAuth ou email/senha
3. Requisições para o backend via API REST
4. Backend processa e interage com o banco de dados
5. Integrações com serviços externos quando necessário
6. Resposta enviada ao frontend
7. Interface atualizada para o usuário

## 📈 Roadmap

### Curto Prazo (1-3 meses)
- [ ] Refatoração da estrutura do código
- [ ] Implementação de testes automatizados
- [ ] Melhoria na documentação
- [ ] Otimização de performance
- [ ] Correção de bugs conhecidos

### Médio Prazo (3-6 meses)
- [ ] Implementação de novos recursos
- [ ] Melhoria na experiência do usuário
- [ ] Expansão para novos mercados
- [ ] Integração com mais serviços
- [ ] Implementação de analytics

### Longo Prazo (6-12 meses)
- [ ] Versão mobile nativa
- [ ] Inteligência artificial avançada
- [ ] Expansão internacional
- [ ] Plataforma white-label
- [ ] Marketplace de terapeutas

## 👥 Equipe

- **Desenvolvimento**: Equipe interna
- **Design**: Equipe interna
- **Suporte**: Equipe interna
- **Marketing**: Equipe interna

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: suporte@terapiaconect.com.br
- Discord: [Link do servidor]
- Documentação: [Link da documentação]
- Telefone: (11) 1234-5678
- Horário de atendimento: Segunda a Sexta, 9h às 18h

## 📜 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.

## 🙏 Agradecimentos

- Todos os contribuidores do projeto
- Comunidade open source
- Usuários que forneceram feedback
- Parceiros e integradores

---

**Nota**: Este documento está em constante atualização. Última atualização: 07/04/2024
