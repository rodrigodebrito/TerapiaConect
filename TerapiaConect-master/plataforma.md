# Documentação da Plataforma Terapeuta

## Estrutura do Projeto

- `backend/`: API em Node.js/Express na porta 3000.
  - `src/`: Código-fonte da API
    - `controllers/`: Controladores para manipulação das requisições
    - `routes/`: Definição das rotas da API
      - `auth.routes.js`: Rotas de autenticação
      - `therapist.routes.js`: Rotas para gerenciamento de terapeutas
      - `appointment.routes.js`: Rotas para agendamentos
      - `user.routes.js`: Rotas para administração de usuários
    - `middleware/`: Middlewares, como autenticação
      - `auth.middleware.js`: Middleware de autenticação e autorização JWT
    - `models/`: Modelos de dados e lógica de negócio
      - `data.js`: Dados de exemplo para desenvolvimento
    - `utils/`: Funções utilitárias
  - `index.js`: Configuração do servidor Express
  - `.env`: Configurações e variáveis de ambiente
- `frontend/`: React com Vite na porta 3001.
  - `src/`: Código-fonte da aplicação
    - `components/`: Componentes reutilizáveis
    - `pages/`: Páginas da aplicação
      - `Login.jsx`: Página de login para os três perfis
      - `ClientDashboard.jsx`: Dashboard para clientes
      - `TherapistDashboard.jsx`: Dashboard para terapeutas
      - `AdminDashboard.jsx`: Dashboard para administradores
      - `NotFound.jsx`: Página 404 para rotas não encontradas
    - `context/`: Contextos e gerenciamento de estado
      - `AuthContext.jsx`: Contexto de autenticação com JWT
      - `NotificationContext.jsx`: Contexto para sistema de notificações
    - `utils/`: Funções utilitárias
    - `App.jsx`: Componente principal com configuração de rotas

## Endpoints Implementados

### Autenticação

- **POST `/login`**: Autenticação de usuários. Retorna token JWT e informações do usuário.
  - **Corpo da requisição**: `{ email: string, password: string }`
  - **Resposta de sucesso**: `{ token: string, refreshToken: string, user: { id, name, email, role } }`

- **POST `/login/refresh`**: Renovação de token JWT usando refresh token.
  - **Corpo da requisição**: `{ refreshToken: string }`
  - **Resposta de sucesso**: `{ token: string, user: { id, name, email, role } }`

### Terapeutas

- **GET `/therapists`**: Lista todos os terapeutas aprovados.
  - **Resposta**: Lista de terapeutas com informações básicas.

- **GET `/therapists/:id`**: Obtém detalhes de um terapeuta específico.
  - **Resposta**: Dados completos do terapeuta.

- **GET `/therapists/:therapistId/availability`**: Obtém disponibilidade de um terapeuta.
  - **Resposta**: Lista de slots de disponibilidade.

- **PUT `/therapists/:therapistId/availability`**: Atualiza disponibilidade de um terapeuta (requer autenticação como terapeuta).
  - **Corpo da requisição**: `{ availability: Array<Slot> }`
  - **Resposta**: Lista atualizada de slots de disponibilidade.

### Agendamentos

- **GET `/appointments/therapist/:therapistId`**: Obtém agendamentos de um terapeuta (requer autenticação como terapeuta).
  - **Resposta**: Lista de agendamentos.

- **GET `/appointments/client/:clientId`**: Obtém agendamentos de um cliente (requer autenticação como cliente).
  - **Resposta**: Lista de agendamentos.

- **POST `/appointments`**: Cria um novo agendamento (requer autenticação como cliente).
  - **Corpo da requisição**: `{ therapistId: string, date: Date, notes?: string }`
  - **Resposta**: Dados do agendamento criado.

### Administração

- **GET `/users`**: Lista todos os usuários (requer autenticação como administrador).
  - **Resposta**: Lista de usuários.

- **DELETE `/users/:userId`**: Remove um usuário (requer autenticação como administrador).
  - **Resposta**: 204 No Content em caso de sucesso.

- **POST `/users/therapists/approve`**: Aprova cadastro de terapeuta (requer autenticação como administrador).
  - **Corpo da requisição**: `{ therapistId: string }`
  - **Resposta**: Mensagem de sucesso e dados do terapeuta.

- **GET `/users/therapists/pending`**: Lista terapeutas pendentes de aprovação (requer autenticação como administrador).
  - **Resposta**: Lista de terapeutas pendentes.

## Componentes Frontend Implementados

### Contextos

- **AuthContext**: Gerencia autenticação e autorização de usuários.
  - `login(email, password)`: Autentica o usuário.
  - `logout()`: Encerra a sessão.
  - `refreshToken()`: Renova o token JWT.
  - `hasRole(roles)`: Verifica se o usuário tem um papel específico.

- **NotificationContext**: Gerencia notificações do usuário.
  - `markAsRead(id)`: Marca uma notificação como lida.
  - `markAllAsRead()`: Marca todas as notificações como lidas.
  - `addNotification(notification)`: Adiciona uma nova notificação.

### Páginas

- **Login**: Formulário de login para todos os perfis.
- **ClientDashboard**: Dashboard para clientes com lista de terapeutas, agendamentos e calendário.
- **NotFound**: Página 404 para rotas não encontradas.

## Modelos de Dados

### User
```javascript
{
  id: string,
  email: string,
  password: string, // Hash bcrypt
  name: string,
  role: 'ADMIN' | 'THERAPIST' | 'CLIENT',
  createdAt: Date
}
```

### Therapist
```javascript
{
  id: string,
  userId: string, // Referência ao User
  bio: string,
  specialties: string[],
  education: string,
  experience: string,
  sessionPrice: number,
  sessionDuration: number,
  isApproved: boolean,
  createdAt: Date
}
```

### Client
```javascript
{
  id: string,
  userId: string, // Referência ao User
  preferences: string[],
  notes: string,
  createdAt: Date
}
```

### Appointment
```javascript
{
  id: string,
  therapistId: string,
  clientId: string,
  date: Date,
  endDate: Date,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
  notes: string,
  createdAt: Date
}
```

### Availability
```javascript
{
  id: string,
  therapistId: string,
  dayOfWeek: number, // 0-6 (Domingo-Sábado)
  startTime: string, // Formato HH:MM
  endTime: string, // Formato HH:MM
  isRecurring: boolean
}
```

## Configuração

### Backend
- **Porta**: 3000
- **Autenticação**: JWT com refresh tokens
- **CORS**: Configurado para permitir acesso do frontend (porta 3001)
- **Armazenamento de dados**: Inicialmente em memória, preparado para migração para PostgreSQL

### Frontend
- **Porta**: 3001
- **Framework**: React com Vite
- **Roteamento**: React Router DOM
- **Gestão de Agenda**: FullCalendar com timeGridPlugin
- **Chamadas API**: Axios

## Perfis de Usuário

1. **Cliente**:
   - Buscar terapeutas
   - Visualizar perfis de terapeutas
   - Agendar sessões
   - Visualizar sua própria agenda

2. **Terapeuta**:
   - Configurar disponibilidade
   - Visualizar agendamentos
   - Gerenciar perfil profissional

3. **Administrador**:
   - Gerenciar cadastros de terapeutas (aprovar, remover)
   - Gerenciar clientes (bloquear, se necessário)
   - Acesso a estatísticas da plataforma

## Como Executar o Projeto

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Migração para Banco de Dados

Para migrar do armazenamento em memória para PostgreSQL:

1. Instalar e configurar o Prisma ORM:
   ```
   npm install @prisma/client prisma --save
   npx prisma init
   ```

2. Definir os modelos no arquivo `prisma/schema.prisma`.

3. Substituir as funções de manipulação de dados em `models/data.js` por chamadas aos métodos do Prisma.

4. Executar a migração inicial:
   ```
   npx prisma migrate dev --name init
   ```

## Próximos Passos

1. Implementar o dashboard para terapeutas
2. Implementar o dashboard para administradores
3. Finalizar o componente de agendamento de sessões
4. Adicionar validações mais robustas nos formulários
5. Implementar sistema de notificações em tempo real com WebSockets 