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
14. [Implementações Recentes e Status](#implementações-recentes-e-status)
15. [Contribuição](#contribuição)
16. [Licença](#licença)

## Visão Geral

TerapiaConect é uma plataforma completa para realização de sessões de terapia online, permitindo:

- Cadastro separado para terapeutas e clientes com perfis especializados
- Agendamento de sessões com gerenciamento de disponibilidade
- Videoconferência integrada com Daily.co (API e SDK React)
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
- **Daily.co**: Solução primária de videoconferência (API e SDK React)
- **Dyte**: Solução alternativa como backup
- **@daily-co/react**: SDK React oficial para integração com Daily.co

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
│   │   ├── Videoconferência (Daily.co)
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
│   │   │   ├── openai.service.js     # Integração com OpenAI
│   │   │   └── training.service.js   # Serviço de treinamento e materiais
│   │   ├── daily.service.js          # Integração com Daily.co
│   │   └── dyte.service.js           # Integração com Dyte (backup)
│   ├── utils/           # Utilitários
│   │   ├── logger.js                 # Sistema de logs
│   │   ├── errorHandler.js           # Tratamento de erros
│   │   └── formatters.js             # Formatação de dados
│   ├── config/          # Configurações
│   │   ├── database.js               # Configuração do banco de dados
│   │   └── ai.js                     # Configuração dos serviços de IA
│   ├── app.js           # Configuração do Express
│   └── index.js         # Ponto de entrada
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

#### Daily.co (Principal)
- Integração via API JavaScript e SDK React
- Configuração personalizada com suporte a salas privadas
- Controles de áudio/vídeo e compartilhamento de tela
- Alta qualidade e estabilidade de conexão
- Salas com duração estendida (até 60 minutos no plano gratuito)
- Capacidade para até 4 participantes por sala (plano gratuito)
- Suporte para transcrição integrada

#### Vantagens sobre o anterior sistema
- Maior estabilidade e confiabilidade
- Melhor qualidade de áudio/vídeo
- Interface mais intuitiva e responsiva
- Melhor suporte para dispositivos móveis
- Menor consumo de recursos

#### Integração com IA
- Funcionamento contínuo com o sistema de análise de sessões
- Transcrição em tempo real durante as sessões
- Análise emocional e sugestões ao terapeuta
- Geração de relatórios pós-sessão

Para mais detalhes sobre esta integração, consulte o [Guia de Integração do Daily.co](./DAILY_INTEGRATION_README.md).

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
DAILY_API_KEY=sua_chave_daily_co
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
VITE_DAILY_API_KEY=sua_chave_daily_co
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
- `DAILY_API_KEY` - Chave da API do Daily.co
- `DYTE_API_KEY` - Chave da API do Dyte
- `DYTE_ORG_ID` - ID da organização no Dyte

#### Frontend
- `VITE_API_URL` - URL da API backend
- `VITE_DAILY_API_KEY` - Chave da API do Daily.co
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

- **Migração para GPT-4o Mini**: Implementada migração completa para o modelo GPT-4o Mini da OpenAI, que oferece excelente equilíbrio entre desempenho e custo (4x mais econômico que GPT-4o e 25x mais econômico que Claude 3 Opus), mantendo qualidade de análise.

- **Sistema de monitoramento de custos**: Implementado sistema que monitora o uso de tokens e calcula a economia gerada pela migração de modelo, acessível via endpoint `/api/ai/token-usage`.

- **Integração com TrainingService**: Implementação da integração do serviço de treinamento com as análises de sessão e sugestões na videoconferência, permitindo que insights de materiais de treinamento enriqueçam os resultados da IA
- **Exibição de Materiais Referenciados**: Adição de uma seção na interface que mostra quais materiais de treinamento foram usados para enriquecer a análise
- **Extração Automática de Temas**: Identificação automática de temas na transcrição para busca de materiais relevantes
- **Robustez do Sistema**: Implementação de tratamento extensivo de erros com fallbacks em todo o sistema
- **Geração de Relatórios**: Sistema aprimorado para geração de relatórios profissionais
- **Criação de Sessões**: Melhorias na validação e criação de sessões para evitar inconsistências
- **Análise de IA**: Refinamento das capacidades de análise e geração de sugestões
- **Interface do Usuário**: Aprimoramentos na experiência do usuário e responsividade
- **Documentação**: Atualização e expansão da documentação técnica
- **Transcrição de Áudio/Vídeo**: Adição de funcionalidade para transcrever arquivos de áudio e vídeo e transformá-los em materiais de treinamento

### Melhorias na transcrição de áudio com Whisper API

- **Processamento de áudio robusto**: Implementação de conversão consistente para formato MP3 com configurações otimizadas para reconhecimento de voz (mono, 16kHz, 64kbps)
- **Limpeza automática de arquivos**: Os arquivos temporários de áudio são automaticamente removidos após o processamento para economia de espaço em disco
- **Filtro de conteúdo indesejado**: Adição de filtros para remover textos como "tamara.org" e outras URLs indesejadas das transcrições
- **Controle de microfone manual**: Adicionada opção para parar completamente a gravação (sem reinício automático) ao clicar no botão de microfone
- **Tratamento robusto de erros**: Melhoria na detecção e resposta a erros de reconhecimento de voz, incluindo erros do tipo "aborted"
- **Verificação de compatibilidade do navegador**: Adicionada verificação completa de suporte do navegador para todas as APIs necessárias
- **Interface de fallback aprimorada**: Para informar quando um navegador não é compatível

### Autenticação aprimorada
- Gerenciamento de token adequado para produção
- Validação de IDs de sessão para evitar o uso de sessões temporárias ou inválidas

### Outros ajustes de infraestrutura
- Corrigida a configuração de endpoint para comunicação direta entre frontend e backend
- Melhorada a detecção e resposta a interrupções no reconhecimento de voz

## Chatbot Terapêutico

Um dos próximos desenvolvimentos prioritários será a implementação de um Chatbot Terapêutico que oferecerá suporte contínuo aos clientes entre as sessões regulares de terapia.

### Visão Geral

O Chatbot Terapêutico será um assistente de IA especializado que permitirá:
- Suporte emocional contínuo entre sessões
- Realização de exercícios terapêuticos guiados
- Resposta a dúvidas comuns sobre o processo terapêutico
- Acompanhamento de progresso e humor

### Opções de Implementação

1. **Chatbot no Aplicativo (Experiência Premium)**
   - Integrado diretamente na plataforma
   - Interface conversacional rica com suporte a voz
   - Acesso ao histórico completo e material personalizado
   - Experiência totalmente personalizada

2. **Chatbot no WhatsApp (Acesso Facilitado)**
   - Integração via WhatsApp Business API
   - Maior acessibilidade (sem necessidade de instalar outro app)
   - Capacidade de processar mensagens de áudio
   - Funcionaria como "porta de entrada" para o serviço completo

### Funcionamento Técnico

O Chatbot utilizará uma combinação de tecnologias:
- **Processamento de Voz**: Conversão áudio-texto via Web Speech API/Whisper
- **Motor de IA**: OpenAI GPT-4/Claude para processamento de linguagem natural
- **Síntese de Voz**: Text-to-Speech para respostas por áudio
- **Personalização**: Acesso ao histórico do cliente e materiais de treinamento relevantes

### Modelo de Negócio Proposto

- **Para Clientes Cadastrados**: Acesso básico incluído no plano regular
- **Versão Premium**: Interações ilimitadas e funcionalidades avançadas
- **Benefício para Terapeutas**: Melhoria no engajamento e acompanhamento contínuo

### Vantagens para a Plataforma

- **Diferencial Competitivo**: Assistência contínua entre sessões
- **Maior Retenção**: Engajamento constante com a plataforma
- **Dados Valiosos**: Insights sobre necessidades dos clientes entre sessões
- **Caminho para Monetização**: Modelo freemium para recursos avançados

## Infraestrutura em Cloud

Para garantir desempenho, segurança e escalabilidade, planejamos a migração para uma infraestrutura em cloud profissional.

### Arquitetura de Hospedagem Proposta

A estratégia de hospedagem seguirá uma abordagem moderna e escalável:

**Frontend:**
- **Vercel** (Plano Hobby inicialmente): Especializada em aplicações React com excelente performance
- CDN global integrada
- Certificados SSL automáticos
- Integração contínua com GitHub
- Deploy previews para facilitar revisões

**Backend:**
- **Render Web Services** (Plano Standard - $14/mês): Serviços confiáveis para Node.js
- 1GB RAM / 1 CPU (escalável conforme necessidade)
- Serviços sempre ativos (sem spin down)
- CI/CD automatizado
- Monitoramento e logs em tempo real

**Banco de Dados:**
- **Render PostgreSQL** (Plano Starter - $7/mês): PostgreSQL gerenciado
- Backups automáticos
- 1GB de armazenamento
- Alta disponibilidade

**Alternativas para Banco de Dados:**
- **Supabase**: PostgreSQL gerenciado com recursos extras (autenticação, storage)
- **Neon**: PostgreSQL serverless com escalabilidade automática

### Estratégia de Escalabilidade

A infraestrutura foi planejada para crescer junto com a plataforma:

**Fase 1: Inicial (até 500 usuários)**
- Custo estimado: $21/mês
- Frontend: Vercel (Plano Hobby)
- Backend: Render Standard ($14/mês)
- Banco de Dados: Render PostgreSQL ($7/mês)
- Capacidade: Suporta algumas centenas de usuários ativos

**Fase 2: Crescimento (até 5.000 usuários)**
- Custo estimado: $100-200/mês
- Frontend: Vercel (Plano Pro)
- Backend: Render com recursos aumentados ou migração para Railway/Fly.io
- Banco de Dados: Upgrade para plano dedicado
- Implementação de camadas de cache

**Fase 3: Escala (10.000+ usuários)**
- Custo estimado: $500+/mês
- Arquitetura de microserviços
- Implementação em múltiplas regiões
- Considerar migração para AWS/GCP/Azure
- Balanceamento de carga e auto-scaling

### Melhorias de Desempenho

A migração para a infraestrutura em cloud proporcionará:
- Redução significativa do tempo de resposta da API
- Melhor experiência de videoconferência
- Capacidade de processar mais solicitações de IA simultaneamente
- Maior confiabilidade e uptime
- Backups automáticos e segurança aprimorada

### Implementação

A migração será realizada em etapas para minimizar interrupções:
1. Configuração e testes em ambiente de staging
2. Migração do banco de dados com validação de integridade
3. Deployment do backend na Render com verificação de performance
4. Migração do frontend para Vercel com testes A/B
5. Período de estabilização e monitoramento

Esta estratégia permite uma transição suave para uma infraestrutura robusta e escalável, preparando a plataforma para o crescimento futuro.

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
- [x] Transcrição de áudio e vídeo para materiais de treinamento
- [x] Sistema de embeddings para busca semântica de materiais relevantes
- [ ] Chatbot terapêutico para suporte contínuo aos clientes
- [ ] Implementação de infraestrutura em cloud (Vercel + Render)
- [ ] Implementação de análise de microexpressões faciais
- [ ] Implementação de pagamentos
- [ ] Aplicativo móvel (APK para Google Play Store)
- [ ] Expansão de ferramentas terapêuticas
- [ ] Integração com sistemas de prontuário eletrônico
- [ ] Plataforma para supervisão de terapeutas

## Implementações Recentes e Status

### Migração para Daily.co

#### Implementações Bem-Sucedidas
- **Substituição Completa do Jitsi**: O componente `FallbackMeeting.jsx` foi totalmente reescrito para usar o Daily.co em vez do Jitsi.
- **Nova API de Serviço**: Implementação do serviço `daily.service.js` no backend para gerenciar a criação e manutenção de salas de videoconferência.
- **Integração com Daily.co API**: Configuração da autenticação com API key do Daily.co e implementação dos endpoints para criação, verificação e exclusão de salas.
- **Interface Simplificada**: A interface de videoconferência foi simplificada, mantendo todos os controles essenciais (microfone, câmera, tela cheia).
- **Manutenção da Integração com IA**: A funcionalidade de IA foi preservada e integrada com a nova solução de videoconferência.

#### Vantagens Obtidas
- **Maior Estabilidade**: As salas Daily.co apresentam significativamente menos problemas de conexão.
- **Melhor Qualidade**: A qualidade de áudio e vídeo é superior, mesmo em conexões mais limitadas.
- **Simplicidade de Código**: O código para integração é mais simples e menos propenso a erros.
- **Melhor Desempenho**: Menor consumo de recursos do sistema e melhor adaptação a diferentes dispositivos.
- **Documentação Detalhada**: Criação do guia completo `DAILY_INTEGRATION_README.md` para facilitar o entendimento e manutenção da solução.

#### Próximas Etapas com Daily.co
- **Otimização de Parâmetros de Sala**: Ajustar configurações específicas para salas de terapia.
- **Implementação de Salas de Espera**: Adicionar funcionalidade de sala de espera para clientes.
- **Personalização de Interface**: Melhorar a personalização visual do player de videoconferência.
- **Testes de Carga**: Realizar testes com múltiplos participantes para verificar limites de performance.

### Correções no Backend

- **Ajustes no Modelo de Dados**: Corrigido o acesso a campos no modelo `TrainingMaterial`, alterando consultas que usavam `category` para o campo correto `categories` e adaptando os operadores para trabalhar com arrays (`has` em vez de `contains`).
- **Tratamento de Erros**: Melhorada a robustez do sistema adicionando tratamento adequado para situações onde materiais de treinamento não são encontrados.

### Melhorias no Sistema de IA

- **Sistema de Embeddings**: Implementação completa do serviço de embeddings utilizando o modelo `Xenova/all-MiniLM-L6-v2`, permitindo busca semântica de materiais de treinamento relevantes mesmo sem correspondência exata de categorias.
- **Pré-processamento de Sessões Longas**: Implementação de um sistema inteligente que detecta quando uma transcrição de sessão é muito longa para ser processada diretamente pela OpenAI, criando automaticamente um resumo estruturado usando GPT-3.5-Turbo antes de enviar para análise completa com GPT-4.
- **Fallback Manual de Truncamento**: Adição de um mecanismo de fallback que, caso o resumo automático falhe, realiza um truncamento manual preservando o início e o fim da sessão para garantir que a análise continue funcionando.

### Próximos Passos

1. **Estabilidade da Videoconferência**: Continuar monitorando e refinando a integração com Daily.co para garantir confiabilidade.
2. **UI/UX dos Botões de IA**: Revisar e melhorar a interface dos botões de IA durante as sessões.
3. **Sincronização entre Componentes React**: Otimizar a comunicação entre componentes para evitar renderizações desnecessárias.
4. **Testes de Integração**: Desenvolver testes automatizados para validar a integração entre os diversos componentes do sistema.

## Roadmap de Desenvolvimento Futuro

Baseado na análise do sistema atual, identificamos as seguintes áreas de melhoria e próximos passos para evolução da plataforma:

### 1. Otimização do Processamento de Áudio
- **Implementar buffer adaptativo**: Ajustar automaticamente o tamanho dos chunks de áudio com base na qualidade da conexão
- **Cache local de transcrições**: Armazenar transcrições parciais no localStorage para recuperação em caso de falhas
- **Compressão inteligente**: Implementar algoritmos de compressão específicos para voz antes do envio

### 2. Evolução da Análise de Sessões
- **Análise multimodal**: Combinar análise de texto com processamento de tom de voz e expressões faciais
- **Framework de métricas terapêuticas**: Desenvolver sistema para rastrear e visualizar progresso entre sessões
- **Detecção de micromomentos críticos**: Identificar pontos de alta intensidade emocional durante a sessão

### 3. Personalização Avançada da IA
- **Perfis de abordagem terapêutica**: Criar modelos pré-treinados específicos para diferentes linhas terapêuticas
- **Sistema de feedback do terapeuta**: Implementar mecanismo para o terapeuta avaliar e refinar sugestões da IA
- **Aprendizado contínuo**: Desenvolver sistema que aprende com o uso e refina sugestões ao longo do tempo
- **Migração para GPT-4o ou Claude 3 Opus**: Atualizar o modelo base para obter melhor desempenho na análise contextual, maior compreensão de nuances emocionais e processamento mais eficiente de sessões longas

### Comparação GPT-4o vs Claude 3 Opus

| Característica | GPT-4o | Claude 3 Opus | GPT-4o Mini | Impacto para TerapiaConect |
|----------------|--------|---------------|-------------|----------------------------|
| **Custo** | Acessível ($2,50/milhão tokens entrada, $10/milhão tokens saída) | Caro ($15/milhão tokens entrada, $75/milhão tokens saída) | Muito econômico ($0,60/milhão tokens entrada, $1,80/milhão tokens saída) | GPT-4o Mini é aproximadamente 4x mais econômico que GPT-4o e 25x mais econômico que Claude 3 Opus |
| **Janela de Contexto** | 128K tokens | 200K tokens | 128K tokens | Todos os modelos suportam sessões longas, com vantagem para Claude 3 |
| **Desempenho em Raciocínio** | Excelente em raciocínio lógico e matemático (MMLU: 88,7%) | Superior em nuances emocionais e compreensão psicológica | Bom (aprox. 80-85% do desempenho do GPT-4o) | GPT-4o Mini oferece equilíbrio entre custo e capacidade para a maioria dos casos de terapia |
| **Velocidade** | Rápido | Mais lento, porém mais detalhado | Muito rápido | GPT-4o Mini permite respostas mais ágeis durante sessões ao vivo |
| **Conhecimento** | Recente (até Out/2023) | Ligeiramente mais antigo (até Ago/2023) | Recente (até Out/2023) | Diferença mínima para uso terapêutico |
| **Processamento Multimodal** | Superior em análise de imagens | Bom, mas menos avançado | Básico, mas adequado | Adequado para necessidades atuais do TerapiaConect |

**Recomendação atualizada para TerapiaConect:** Implementar GPT-4o Mini como modelo principal devido ao excelente equilíbrio entre custo e desempenho. Esta opção permite um uso mais intensivo da IA sem impacto significativo nos custos, mantendo a possibilidade de utilizar GPT-4o para casos mais complexos ou Claude 3 Opus para análises que exijam compreensão emocional mais sofisticada.

### Como implementar a migração para GPT-4o Mini

A migração para o GPT-4o Mini é um processo relativamente simples que pode ser implementado nas seguintes etapas:

1. **Atualização da integração com a API da OpenAI**: 
   ```javascript
   // Código atual
   const completion = await openai.chat.completions.create({
     model: "gpt-3.5-turbo", // ou modelo atual
     messages: conversationHistory,
     // outros parâmetros
   });
   
   // Novo código com GPT-4o Mini
   const completion = await openai.chat.completions.create({
     model: "gpt-4o-mini", // Alteração do modelo
     messages: conversationHistory,
     // manter demais parâmetros
   });
   ```

2. **Ajustes em prompts**: Possivelmente otimizar prompts existentes para o novo modelo, embora geralmente não seja necessário.

3. **Monitoramento de custos**: Implementar métricas para acompanhar o número de tokens processados e o custo associado.

4. **Teste comparativo**: Antes da migração completa, executar testes A/B comparando resultados entre o modelo atual e o GPT-4o Mini para garantir que a qualidade das análises seja mantida.

Esta migração pode ser implementada na Fase 1 do roadmap e trará benefícios imediatos em termos de custo-benefício.

### 4. Arquitetura Técnica e Escalabilidade
- **Sistema de filas assíncronas**: Implementar RabbitMQ/Redis para processamento assíncrono de análises pesadas
- **Armazenamento em camadas**: Mover transcrições e áudios temporários para armazenamento hierárquico
- **Streaming de resultados**: Implementar streaming de resultados da IA para feedback mais imediato

### 5. Extensões do Sistema de Embeddings
- **Embeddings multimodais**: Expandir para incluir representações de áudio e vídeo além do texto
- **Clustering de sessions**: Agrupar sessões similares para identificar padrões entre diferentes clientes
- **Banco de conhecimento vetorial**: Expandir sistema atual para comportar maior biblioteca de referências

### Roteiro de Implementação Recomendado

**Fase 1 (1-2 meses)**
1. Aprimorar o sistema de processamento de áudio com buffer adaptativo
2. Implementar sistema de feedback do terapeuta para sugestões da IA
3. Otimizar autenticação e validação de sessão para maior robustez

**Fase 2 (2-3 meses)**
1. Desenvolver framework de métricas terapêuticas
2. Implementar sistema de filas assíncronas para processamento de IA
3. Expandir embeddings para comportar áudio e classificação de emoções

**Fase 3 (3-4 meses)**
1. Integrar análise facial (microexpressões) com a análise de texto
2. Desenvolver dashboard de progresso do cliente baseado em sessões anteriores
3. Implementar mecanismo de aprendizado contínuo baseado no feedback

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Faça commit das mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nome-da-feature`)
5. Crie um novo Pull Request

## Licença

Este projeto está licenciado sob a licença MIT.
