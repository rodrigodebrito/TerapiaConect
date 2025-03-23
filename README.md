# Plataforma Terapeuta

Uma plataforma web completa para conectar terapeutas e clientes, permitindo o gerenciamento de perfis profissionais, agendamentos e sessões terapêuticas.

## Funcionalidades Principais

### Para Terapeutas
- Perfil profissional detalhado
- Gerenciamento de disponibilidade
- Ferramentas terapêuticas personalizáveis
- Agendamento de sessões
- Campo de Constelação Familiar interativo
- Dashboard administrativo

### Para Clientes
- Busca avançada de terapeutas
- Agendamento online
- Sessões remotas
- Participação em sessões de Constelação Familiar
- Histórico de atendimentos

## Estrutura do Projeto

O projeto está dividido em duas partes principais:

### Backend (Porta 3000)
- API RESTful desenvolvida com Node.js e Express
- Banco de dados PostgreSQL com Prisma ORM
- Autenticação JWT
- Upload de arquivos
- Websockets para comunicação em tempo real (Campo de Constelação)

### Frontend (Porta 3001)
- Aplicação React com Vite
- State management com React Context e hooks
- UI responsiva e moderna
- Componentes Three.js para visualização 3D
- Integração com APIs de pagamento e videoconferência

## Destaques Técnicos

### Campo de Constelação Familiar
Uma ferramenta inovadora para terapeutas conduzirem sessões de constelação familiar de forma digital:

- **Visualização 3D interativa** - Ambiente tridimensional para posicionamento de representantes
- **Controle compartilhado** - Terapeuta pode transferir o controle ao cliente durante a sessão
- **Personalização de representantes** - Cores e nomes customizáveis
- **Rotação de elementos** - Pressione SHIFT enquanto arrasta para girar representantes em 360°
- **Comunicação em tempo real** - Sincronização instantânea entre terapeuta e cliente

### Sistema de Disponibilidade
- Calendário interativo para terapeutas
- Slots customizáveis por dia e horário
- Suporte a disponibilidade recorrente e específica
- Integração com sistema de agendamento

### Ferramentas Terapêuticas
- Catálogo de ferramentas predefinidas
- Personalização de duração e preço por ferramenta
- Integração com sistema de agendamento

## Tecnologias

- **Frontend**: React, Vite, Three.js, React Three Fiber, Socket.io-client
- **Backend**: Node.js, Express, Prisma, PostgreSQL, Socket.io
- **Autenticação**: JWT
- **Arquivos**: Multer

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- NPM ou Yarn

### Instalação do Backend
```bash
cd backend
npm install
```

Configure o arquivo `.env` com suas credenciais de banco de dados e JWT:
```
DATABASE_URL="postgresql://user:password@localhost:5432/terapeutas"
JWT_SECRET="seu_jwt_secret"
```

Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

Inicie o servidor:
```bash
npm run dev
```

### Instalação do Frontend
```bash
cd frontend
npm install
npm run dev
```

## Rotas Principais da API

### Autenticação
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token de acesso

### Terapeutas
- `GET /api/therapists` - Listar terapeutas
- `GET /api/therapists/:id` - Detalhes de um terapeuta
- `POST /api/therapists` - Criar perfil de terapeuta
- `PUT /api/therapists/:id` - Atualizar perfil

### Clientes
- `GET /api/clients/:id` - Detalhes de um cliente
- `PUT /api/clients/:id` - Atualizar perfil de cliente

### Agendamentos
- `GET /api/appointments/therapist/:id` - Agendamentos de um terapeuta
- `POST /api/appointments` - Criar novo agendamento

## Contribuição

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.

## Contato

Para mais informações, entre em contato com a equipe de desenvolvimento. 