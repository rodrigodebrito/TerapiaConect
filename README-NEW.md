# TerapiaConect

Plataforma de terapia online que permite a conexão entre terapeutas e clientes para sessões online com ferramentas especializadas e suporte de IA.

## Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Autenticação e Segurança](#autenticação-e-segurança)
6. [Módulos Principais](#módulos-principais)
7. [API e Rotas](#api-e-rotas)
8. [Frontend e Páginas](#frontend-e-páginas)
9. [Instalação](#instalação)
10. [Configuração](#configuração)
11. [Executando o Projeto](#executando-o-projeto)
12. [Melhorias Recentes](#melhorias-recentes)
13. [Roadmap](#roadmap)
14. [Contribuição](#contribuição)
15. [Licença](#licença)

## Visão Geral

TerapiaConect é uma plataforma completa para realização de sessões de terapia online, permitindo:

- Cadastro separado para terapeutas e clientes com perfis especializados
- Agendamento de sessões com gerenciamento de disponibilidade
- Videoconferência integrada com sistema de fallback entre Jitsi e Dyte
- Ferramentas terapêuticas especializadas (Campo de Constelação)
- Assistente de IA para análise de sessões, sugestões e relatórios
- Sistema de treinamento da IA com materiais personalizados
- Transcrição automática de sessões
- Análise emocional e de conteúdo em tempo real
- Interface responsiva e acessível

## Tecnologias Utilizadas

### Frontend
- **React.js**: Biblioteca principal para construção da interface
- **React Router**: Gerenciamento de rotas e navegação
- **Context API**: Gerenciamento de estado global com contextos especializados
- **Axios**: Cliente HTTP para comunicação com o backend
- **Material-UI**: Framework de componentes para UI responsiva
- **React Hook Form**: Gerenciamento de formulários
- **TensorFlow.js**: Processamento local de IA no navegador

### Backend
- **Node.js**: Ambiente de execução JavaScript
- **Express**: Framework web para criação da API RESTful
- **Prisma ORM**: ORM para acesso ao banco de dados PostgreSQL
- **PostgreSQL**: Banco de dados relacional
- **JWT**: Autenticação baseada em tokens JSON Web Token
- **Bcrypt**: Criptografia segura de senhas
- **OpenAI API**: Integração com GPT-4 e GPT-3.5 Turbo para funcionalidades de IA
- **Socket.IO**: Comunicação em tempo real

### Videoconferência
- **Jitsi Meet**: Solução primária de videoconferência (open source)
- **Dyte**: Solução alternativa como fallback
- **Sistema de redundância**: Troca automática entre soluções em caso de falha

### Inteligência Artificial
- **OpenAI GPT-4**: Análise avançada de sessões e geração de relatórios
- **OpenAI GPT-3.5 Turbo**: Processamento de materiais de treinamento e enriquecimento de análises
- **Embeddings**: (Planejado) Representações vetoriais para busca semântica de materiais
- **face-api.js**: (Planejado) Análise de microexpressões faciais em tempo real

## Arquitetura do Sistema

O TerapiaConect segue uma arquitetura cliente-servidor moderna:

```
├── Cliente (React)
│   ├── Páginas e Rotas
│   ├── Componentes Reutilizáveis
│   ├── Contextos Globais
│   │   ├── AuthContext (autenticação)
│   │   ├── AIContext (serviços de IA)
│   │   ├── SessionContext (gestão de sessões)
│   │   ├── NotificationContext (notificações)
│   │   └── ConstellationContext (ferramentas terapêuticas)
│   ├── Serviços
│   │   ├── API (comunicação com backend)
│   │   ├── Autenticação
│   │   ├── Videoconferência (Jitsi + Dyte)
│   │   └── Processamento de IA local
│   └── Assets e Estilos
│
├── Servidor (Node.js + Express)
│   ├── API RESTful
│   │   ├── Rotas de Autenticação
│   │   ├── Rotas de Usuários
│   │   ├── Rotas de Terapeutas
│   │   ├── Rotas de Clientes
│   │   ├── Rotas de Agendamentos
│   │   ├── Rotas de Sessões
│   │   ├── Rotas de IA
│   │   └── Rotas de Ferramentas
│   ├── Controladores
│   ├── Serviços
│   │   ├── Serviços de IA
│   │   │   ├── OpenAI Service
│   │   │   └── Training Service
│   │   ├── Serviço de Videoconferência
│   │   └── Serviços de Negócios
│   ├── Middleware
│   │   ├── Autenticação
│   │   ├── Validação
│   │   └── Tratamento de Erros
│   ├── Modelos (Prisma)
│   └── Utilitários
│
└── Banco de Dados (PostgreSQL)
    ├── Usuários
    ├── Terapeutas
    ├── Clientes
    ├── Agendamentos
    ├── Sessões
    ├── Transcrições
    ├── Insights de IA
    └── Materiais de Treinamento
```

O sistema utiliza comunicação RESTful entre cliente e servidor, com autenticação JWT, e integra serviços externos como OpenAI e APIs de videoconferência. O processamento de IA é distribuído entre cliente (leve) e servidor (complexo).

## Estrutura do Projeto

O projeto é organizado em duas partes principais:

### Frontend (`/frontend`)

```
frontend/
├── public/              # Arquivos estáticos e modelos de IA
├── src/
│   ├── assets/          # Imagens, ícones e recursos
│   ├── components/      # Componentes reutilizáveis
│   │   ├── AIResultsPanel.jsx        # Painel de resultados da IA
│   │   ├── FallbackMeeting.jsx       # Componente principal de videoconferência
│   │   ├── SessionTranscript/        # Componentes de transcrição
│   │   ├── ConstellationField/       # Ferramenta de constelação
│   │   └── AIAssistant/              # Componentes do assistente de IA
│   ├── contexts/        # Contextos globais React
│   │   ├── AIContext.jsx             # Contexto para funcionalidades de IA
│   │   ├── AuthContext.jsx           # Autenticação e gestão de usuários
│   │   ├── SessionContext.jsx        # Gerenciamento de sessões
│   │   ├── NotificationContext.jsx   # Sistema de notificações
│   │   └── ConstellationContext.jsx  # Estado da ferramenta de constelação
│   ├── pages/           # Páginas e rotas
│   │   ├── Home.jsx                  # Página inicial
│   │   ├── Login.jsx                 # Autenticação
│   │   ├── Register.jsx              # Registro de usuários
│   │   ├── TherapistProfile.jsx      # Perfil do terapeuta
│   │   ├── ClientProfile.jsx         # Perfil do cliente
│   │   ├── TherapistDashboard.jsx    # Dashboard do terapeuta
│   │   ├── TherapistDirectory.jsx    # Diretório de terapeutas
│   │   ├── AppointmentScheduling.jsx # Agendamento
│   │   ├── SessionRoom.jsx           # Sala de videoconferência
│   │   └── AdminDashboard.jsx        # Painel administrativo
│   ├── services/        # Serviços e APIs
│   │   ├── api.js                    # Cliente Axios configurado
│   │   ├── auth.service.js           # Serviço de autenticação
│   │   ├── ai.service.js             # Serviço de IA
│   │   ├── hybridAI.service.js       # Processamento híbrido de IA
│   │   └── aiService.js              # Chamadas à API de IA
│   ├── utils/           # Utilitários e helpers
│   ├── styles/          # Estilos globais
│   ├── App.jsx          # Componente principal com rotas
│   └── index.js         # Ponto de entrada
```

### Backend (`/backend`)

```
backend/
├── prisma/
│   └── schema.prisma    # Esquema do banco de dados
├── src/
│   ├── controllers/     # Controladores da API
│   │   ├── auth.controller.js        # Autenticação
│   │   ├── user.controller.js        # Usuários
│   │   ├── therapist.controller.js   # Terapeutas
│   │   ├── client.controller.js      # Clientes
│   │   ├── appointment.controller.js # Agendamentos
│   │   ├── session.controller.js     # Sessões
│   │   ├── ai.controller.js          # Funcionalidades de IA
│   │   └── training.controller.js    # Materiais de treinamento
│   ├── middlewares/     # Middlewares Express
│   │   ├── auth.middleware.js        # Proteção de rotas
│   │   ├── error.middleware.js       # Tratamento de erros
│   │   └── validation.middleware.js  # Validação de dados
│   ├── routes/          # Rotas da API
│   │   ├── auth.routes.js            # Autenticação
│   │   ├── user.routes.js            # Usuários
│   │   ├── therapist.routes.js       # Terapeutas
│   │   ├── client.routes.js          # Clientes
│   │   ├── appointment.routes.js     # Agendamentos
│   │   ├── session.routes.js         # Sessões
│   │   ├── ai.routes.js              # IA
│   │   └── training.routes.js        # Treinamento
│   ├── services/        # Serviços de negócios
│   │   ├── ai/
│   │   │   ├── openai.service.js     # Serviço OpenAI
│   │   │   └── training.service.js   # Processamento de materiais
│   │   ├── jitsi.service.js          # Integração Jitsi
│   │   └── dyte.service.js           # Integração Dyte
│   ├── utils/           # Utilitários
│   │   ├── prisma.js                 # Cliente Prisma
│   │   ├── logger.js                 # Sistema de logs
│   │   └── helpers.js                # Funções auxiliares
│   ├── app.js           # Configuração do Express
│   └── server.js        # Ponto de entrada
```

## Autenticação e Segurança

O sistema implementa múltiplas camadas de segurança:

### Autenticação e Autorização

- **JWT (JSON Web Tokens)**: Utilizado para autenticação stateless
- **Middleware de autenticação**: Proteção de rotas privadas
- **Validação de permissões**: Controle granular baseado em papéis (roles)
- **Verificação de propriedade**: Validação de acesso a recursos específicos
- **Armazenamento seguro de senhas**: Hashing com bcrypt e salt
- **HTTP-Only Cookies**: Segurança contra ataques XSS

### Segurança de Sessões

- **Salas privadas**: Geradas com identificadores únicos
- **Tokens temporários**: Acesso limitado a sessões específicas
- **Modo de desenvolvimento**: Flexibilização de regras para testes
- **Verificação de relação**: Validação de relação terapeuta-cliente
- **Isolamento de dados**: Cada sessão é isolada e protegida

## Módulos Principais

### Sistema de Usuários

O sistema suporta três tipos de usuários com funções específicas:

#### Administrador
- Gerenciamento completo da plataforma
- Aprovação de terapeutas
- Visualização de estatísticas e métricas
- Gerenciamento de usuários

#### Terapeuta
- Perfil profissional detalhado
- Configuração de disponibilidade
- Definição de serviços e preços
- Gerenciamento de sessões
- Acesso às ferramentas terapêuticas
- Utilização do assistente de IA

#### Cliente
- Busca de terapeutas
- Agendamento de sessões
- Participação em sessões
- Visualização de histórico

### Agendamento e Sessões

O sistema de agendamento gerencia todo o ciclo de vida das sessões:

#### Disponibilidade
- Configuração de dias e horários disponíveis
- Bloqueio de períodos específicos
- Visibilidade automática no calendário

#### Agendamento
- Seleção de terapeuta e serviço
- Escolha de data e horário
- Confirmação e pagamento (planejado)
- Notificações automáticas

#### Sessões
- Criação automática a partir de agendamentos
- Estados de sessão (pendente, ativa, finalizada, cancelada)
- Registro de duração real vs. planejada
- Armazenamento de transcrições e insights
- Ferramentas terapêuticas integradas

### Videoconferência

O sistema oferece uma solução robusta de videoconferência:

#### Jitsi Meet (Primário)
- Integração direta via API JavaScript
- Configuração personalizada
- Controles de áudio/vídeo
- Compartilhamento de tela

#### Dyte (Fallback)
- Sistema secundário em caso de falha
- Ativação automática se o Jitsi falhar
- Mesma experiência de usuário

#### Sistema de Redundância
- Detecção de falhas
- Troca automática entre plataformas
- Persistência de estado entre transições
- Recuperação em caso de queda de conexão

### Assistente de IA

O assistente de IA é um conjunto de ferramentas baseadas em IA para apoiar os terapeutas:

#### Transcrição
- Captura e processamento de áudio em tempo real
- Reconhecimento de fala via API do navegador
- Armazenamento de transcrições no banco de dados
- Atribuição de falas a participantes

#### Análise de Sessão
- Processamento da transcrição via GPT-4 Turbo
- Identificação de temas principais
- Detecção de padrões emocionais
- Sugestão de questões subjacentes
- Análise de progresso entre sessões
- Enriquecimento com materiais de treinamento

#### Sistema de Sugestões
- Recomendações em tempo real para o terapeuta
- Técnicas terapêuticas sugeridas
- Exercícios para o paciente
- Próximos passos recomendados
- Referências a materiais de treinamento

#### Geração de Relatórios
- Síntese estruturada da sessão
- Pontos-chave e insights
- Progressos observados
- Recomendações para sessões futuras

#### Processamento Híbrido
- Balanceamento entre processamento local e servidor
- TensorFlow.js para análise leve no navegador
- OpenAI API para análise pesada no servidor
- Fallbacks em caso de falha de conexão

### TrainingService

O TrainingService é um sistema de enriquecimento da IA com materiais de treinamento:

#### Materiais de Treinamento
- Adição e gerenciamento de materiais educativos
- Processamento automatizado via GPT-4
- Extração de insights e conceitos-chave
- Categorização por temas e abordagens

#### Integração com Análise
- Extração de temas da transcrição da sessão
- Busca de materiais relevantes por categoria
- Enriquecimento da análise com conhecimentos específicos
- Exibição de materiais referenciados na interface

#### Tipos de Materiais
- Textos teóricos
- Estudos de caso
- Técnicas terapêuticas
- Vídeos do YouTube (com extração automática)
- Resumos de supervisões

#### Processamento de Vídeos
- Extração de informações de vídeos YouTube
- Processamento da transcrição
- Análise especializada do conteúdo
- Geração de insights estruturados

### Ferramentas Terapêuticas

#### Campo de Constelação
- Representação virtual para terapia sistêmica
- Adição e manipulação de representantes
- Registro de posições e movimentos
- Captura de insights durante o processo
- Integração com análise de IA

## API e Rotas

O backend expõe uma API RESTful organizada por domínios:

### Autenticação (`/api/auth`)
- `POST /register` - Registro de novos usuários
- `POST /login` - Autenticação e geração de token
- `POST /refresh-token` - Renovação de token
- `POST /logout` - Invalidação de token

### Usuários (`/api/users`)
- `GET /profile` - Perfil do usuário autenticado
- `PUT /profile` - Atualização de perfil
- `PUT /password` - Alteração de senha

### Terapeutas (`/api/therapists`)
- `GET /` - Lista de terapeutas
- `GET /:id` - Detalhes de um terapeuta
- `GET /:id/availability` - Disponibilidade
- `GET /:id/services` - Serviços oferecidos
- `PUT /profile` - Atualização de perfil profissional
- `PUT /availability` - Configuração de disponibilidade
- `PUT /services` - Configuração de serviços

### Clientes (`/api/clients`)
- `GET /profile` - Perfil do cliente
- `PUT /profile` - Atualização de perfil
- `GET /appointments` - Agendamentos do cliente

### Agendamentos (`/api/appointments`)
- `GET /` - Lista de agendamentos
- `POST /` - Criação de agendamento
- `GET /:id` - Detalhes de um agendamento
- `PUT /:id` - Atualização de agendamento
- `DELETE /:id` - Cancelamento de agendamento

### Sessões (`/api/sessions`)
- `GET /` - Lista de sessões
- `GET /:id` - Detalhes de uma sessão
- `POST /` - Criação manual de sessão
- `PUT /:id/status` - Atualização de status
- `GET /:id/transcript` - Transcrição da sessão
- `GET /:id/insights` - Insights da IA

### IA (`/api/ai`)
- `POST /transcriptions` - Adicionar transcrição
- `GET /transcriptions/session/:sessionId` - Obter transcrições
- `POST /analyze/:sessionId` - Analisar sessão
- `POST /suggestions/:sessionId` - Gerar sugestões
- `POST /report/:sessionId` - Gerar relatório

### Treinamento (`/api/training`)
- `POST /materials` - Adicionar material
- `GET /materials/category/:category` - Materiais por categoria
- `GET /materials/:id` - Detalhes de um material
- `PUT /materials/:id` - Atualizar material
- `DELETE /materials/:id` - Remover material
- `POST /materials/:id/process` - Processar material
- `POST /enhance-analysis` - Enriquecer análise de sessão

## Frontend e Páginas

O frontend é organizado em páginas conectadas por rotas:

### Páginas Públicas
- **Home** - Página inicial com apresentação da plataforma
- **Login** - Autenticação de usuários
- **Register** - Registro de novos usuários
- **TherapistDirectory** - Diretório de terapeutas

### Páginas de Terapeuta
- **TherapistDashboard** - Painel principal
- **TherapistProfile** - Perfil e configurações
- **TherapistAvailability** - Gerenciamento de agenda
- **TherapistSchedule** - Visão de agendamentos
- **SessionRoom** - Sala de videoconferência

### Páginas de Cliente
- **ClientProfile** - Perfil e preferências
- **ClientAppointments** - Agendamentos ativos
- **AppointmentScheduling** - Agendamento de sessões
- **AppointmentSuccess** - Confirmação de agendamento
- **SessionRoom** - Sala de videoconferência

### Páginas Administrativas
- **AdminDashboard** - Painel administrativo
- **AdminLogin** - Autenticação administrativa

### Componentes Principais
- **FallbackMeeting** - Sistema de videoconferência com fallback
- **AIResultsPanel** - Exibição de resultados da IA
- **SessionTranscript** - Visualização de transcrições
- **ConstellationField** - Ferramenta de constelação familiar
- **AITools** - Conjunto de ferramentas de IA

## Instalação

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- NPM ou Yarn
- Chave de API da OpenAI

### Passos para instalação

1. Clone o repositório:
```
git clone https://github.com/seu-usuario/terapiaconect.git
cd terapiaconect
```

2. Instale as dependências do backend:
```
cd backend
npm install
```

3. Configure o banco de dados e a API da OpenAI no arquivo `.env`:
```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/terapiaconect?schema=public"
JWT_SECRET=chave_secreta_jwt
JWT_EXPIRES_IN=30d
OPENAI_API_KEY=sua_chave_da_openai
OPENAI_MODEL=gpt-4-turbo
OPENAI_FALLBACK_MODEL=gpt-3.5-turbo
DYTE_API_KEY=sua_chave_dyte
DYTE_ORG_ID=seu_id_dyte
```

4. Execute as migrações do banco de dados:
```
npx prisma migrate dev
```

5. Instale as dependências do frontend:
```
cd ../frontend
npm install
```

6. Configure o arquivo `.env` do frontend:
```
VITE_API_URL=http://localhost:3000
VITE_JITSI_SERVER=meet.jit.si
VITE_ENABLE_LOCAL_PROCESSING=true
```

## Configuração

### Variáveis de Ambiente

#### Backend
- `PORT` - Porta do servidor (padrão: 3000)
- `NODE_ENV` - Ambiente (development, production)
- `DATABASE_URL` - Conexão com o PostgreSQL
- `JWT_SECRET` - Chave para assinatura de tokens
- `JWT_EXPIRES_IN` - Tempo de expiração dos tokens
- `OPENAI_API_KEY` - Chave da API da OpenAI
- `OPENAI_MODEL` - Modelo principal (padrão: gpt-4-turbo)
- `OPENAI_FALLBACK_MODEL` - Modelo de fallback (padrão: gpt-3.5-turbo)
- `DYTE_API_KEY` - Chave da API do Dyte
- `DYTE_ORG_ID` - ID da organização no Dyte

#### Frontend
- `VITE_API_URL` - URL da API backend
- `VITE_JITSI_SERVER` - Servidor Jitsi Meet
- `VITE_ENABLE_LOCAL_PROCESSING` - Ativar processamento local de IA

## Executando o Projeto

1. Inicie o servidor backend:
```
cd backend
npm run dev
```

2. Em outro terminal, inicie o frontend:
```
cd frontend
npm run dev
```

3. Acesse a aplicação em `http://localhost:3001`

## Melhorias Recentes

- **Integração com TrainingService**: Implementação da integração do serviço de treinamento com as análises de sessão e sugestões na videoconferência, permitindo que insights de materiais de treinamento enriqueçam os resultados da IA
- **Exibição de Materiais Referenciados**: Adição de uma seção na interface que mostra quais materiais de treinamento foram usados para enriquecer a análise
- **Extração Automática de Temas**: Identificação automática de temas na transcrição para busca de materiais relevantes
- **Robustez do Sistema**: Implementação de tratamento extensivo de erros com fallbacks em todo o sistema
- **Geração de Relatórios**: Sistema aprimorado para geração de relatórios profissionais
- **Criação de Sessões**: Melhorias na validação e criação de sessões para evitar inconsistências
- **Análise de IA**: Refinamento das capacidades de análise e geração de sugestões
- **Interface do Usuário**: Aprimoramentos na experiência do usuário e responsividade
- **Documentação**: Atualização e expansão da documentação técnica

## Roadmap

- [x] Sistema de usuários e autenticação
- [x] Agendamento básico
- [x] Integração de videoconferência
- [x] Campo de Constelação
- [x] Assistente IA para terapeutas
- [x] Análise de sessões em tempo real
- [x] Geração de relatórios
- [x] Sistema robusto de tratamento de erros
- [x] Integração do TrainingService com análises de sessão
- [ ] Sistema de embeddings para busca semântica de materiais relevantes
- [ ] Implementação de análise de microexpressões faciais
- [ ] Implementação de pagamentos
- [ ] Aplicativo móvel
- [ ] Expansão de ferramentas terapêuticas
- [ ] Integração com sistemas de prontuário eletrônico
- [ ] Plataforma para supervisão de terapeutas

## Próximos Objetivos

1. **Aprimoramento do Sistema de TrainingService**
   - Implementação de sistema de embeddings para busca semântica de materiais
   - Sistema de feedback para avaliação de relevância dos materiais
   - Otimização da integração com as análises de sessão

2. **Implementação de Análise Facial**
   - Integração de face-api.js para detecção de microexpressões
   - Análise de emoções em tempo real durante sessões
   - Incorporação dos dados emocionais nos relatórios e análises

3. **Integração com Plataformas de Pagamento**
   - Implementação de gateway de pagamento para sessões
   - Sistema de assinaturas para terapeutas
   - Gerenciamento de cobranças e faturas

4. **Expansão do Sistema de IA**
   - Treinamento com dados específicos de psicoterapia
   - Modelos personalizados por abordagem terapêutica
   - Melhor análise contextual de sessões em andamento

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Faça commit das mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nome-da-feature`)
5. Crie um novo Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. 