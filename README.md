# Plataforma de Terapeutas

## Sobre o Projeto
Uma plataforma web para conectar terapeutas e clientes, permitindo o gerenciamento de perfis profissionais, agendamentos e sessões terapêuticas.

## Estado Atual do Projeto

### Funcionalidades Implementadas
- Sistema de autenticação de usuários (login/registro)
- Gerenciamento de perfil de terapeuta
  - Informações básicas
  - Bio e mini bio
  - Nichos de atuação
  - Ferramentas terapêuticas
  - Experiência e formação
  - Preços e duração das sessões
  - Modo de atendimento (online/presencial)
  - Sessão gratuita (opcional)
  - Upload de foto de perfil
- Listagem de terapeutas com filtros
- Sistema de disponibilidade do terapeuta
  - Interface de calendário avançada para gerenciamento de horários
  - Visualização de disponibilidade em modo tabela e calendário
  - Suporte a eventos específicos (dias específicos)

### Em Desenvolvimento
- Correção do sistema de ferramentas terapêuticas
  - Implementação da duração específica para cada ferramenta
  - Persistência correta dos dados de ferramentas no banco
  - Atualização da interface para refletir as durações das ferramentas

### Próximos Passos
- Sistema de agendamento de sessões
- Pagamentos online
- Avaliações e reviews
- Chat entre terapeuta e cliente
- Notificações
- Área administrativa

## Estrutura do Backend

### Portas
- Backend: 3000
- Frontend: 3001
- Banco de dados (PostgreSQL): 5432

### Rotas da API

#### Autenticação
- POST `/api/auth/register` - Registro de usuário
- POST `/api/auth/login` - Login de usuário

#### Terapeutas
- GET `/api/therapists` - Listar todos os terapeutas
- GET `/api/therapists/:id` - Buscar terapeuta por ID
- GET `/api/therapists/user/:userId` - Buscar terapeuta por ID do usuário
- POST `/api/therapists` - Criar perfil de terapeuta
- PUT `/api/therapists/:id` - Atualizar perfil de terapeuta
- POST `/api/therapists/:id/profile-picture` - Upload de foto de perfil

#### Disponibilidade
- GET `/api/therapists/:therapistId/availability` - Buscar disponibilidade
- POST `/api/therapists/:therapistId/availability` - Atualizar disponibilidade

### Controladores

#### TherapistController
- getAllTherapists
- getTherapistById
- getTherapistByUserId
- createTherapist
- updateTherapistProfile
- uploadProfilePicture
- getTherapistAvailability
- updateTherapistAvailability

## Componentes do Frontend

### TherapistAvailabilitySimple
Componente moderno para gerenciamento de disponibilidade de terapeutas com visualização em calendário e tabela.

#### Características:
- Alternância entre visualização em tabela e calendário interativo
- Três modos de visualização no calendário: diário, semanal e mensal
- Adição de horários específicos com seleção de data e intervalo de tempo
- Visualização consolidada de todos os horários cadastrados
- Salvamento automático dos horários no backend
- Interface responsiva e amigável

#### Dependências:
- FullCalendar (daygrid, timegrid, interaction)
- FontAwesome para ícones
- React-Toastify para notificações
- UUID para geração de identificadores únicos

## Estrutura do Banco de Dados

### Modelos Prisma

#### User
- id (UUID)
- email
- password
- name
- role (ADMIN/THERAPIST/CLIENT)

#### Therapist
- id (UUID)
- userId
- shortBio
- bio
- niches (JSON)
- customNiches (JSON)
- tools (Relation)
- customTools (JSON)
- education
- experience
- targetAudience
- differential
- baseSessionPrice
- servicePrices (JSON)
- sessionDuration
- attendanceMode
- city
- state
- offersFreeSession
- freeSessionDuration
- profilePicture
- isApproved
- rating

#### Availability
- id (UUID)
- therapistId
- date (String, opcional, para eventos específicos)
- dayOfWeek (Int, para eventos recorrentes)
- startTime (String)
- endTime (String)
- isRecurring (Boolean)

#### TherapistTool
- therapistId
- toolId
- price
- duration
- @@id([therapistId, toolId])

#### Tool
- id
- name
- description
- duration
- price

## Configuração do Ambiente

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- NPM ou Yarn

### Variáveis de Ambiente
```env
DATABASE_URL="postgresql://user:password@localhost:5432/constelacao"
JWT_SECRET="seu_jwt_secret"
```

### Instalação
1. Clone o repositório
2. Instale as dependências:
```bash
cd backend && npm install
cd frontend && npm install
```
3. Configure as variáveis de ambiente
4. Execute as migrações do banco:
```bash
cd backend && npx prisma migrate dev
```
5. Inicie os servidores:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm start
```

### Dependências adicionais do Frontend
Para o calendário de disponibilidade, instale os seguintes pacotes:
```bash
cd frontend
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction uuid
```

## Problemas Conhecidos e Soluções em Andamento

### 1. Ferramentas Terapêuticas
- **Problema**: Duração específica das ferramentas não estava sendo salva corretamente
- **Solução**: 
  - Adicionado campo duration ao modelo TherapistTool
  - Atualizado controlador para processar duração específica
  - Implementada migração do banco de dados
  - Ajustada interface para permitir definição de duração por ferramenta

### 2. Powershell no Windows
- **Problema**: Comandos com operador `&&` não funcionam no PowerShell
- **Solução**: 
  - Execute os comandos separadamente ou use o operador `;` no PowerShell
  - Exemplo: `cd frontend; npm start`

### 3. Próximos Ajustes
- Melhorar validação de dados
- Implementar cache para otimizar consultas
- Adicionar testes automatizados
- Documentar API com Swagger

## Contribuição
1. Fork o projeto
2. Crie sua branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request 