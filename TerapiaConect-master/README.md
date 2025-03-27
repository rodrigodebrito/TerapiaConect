# TerapiaConect

Plataforma de terapia online que permite a conexão entre terapeutas e clientes para sessões online com ferramentas especializadas.

## Visão Geral

TerapiaConect é uma plataforma completa para realização de sessões de terapia online, permitindo:

- Cadastro separado para terapeutas e clientes
- Agendamento de sessões
- Videoconferência integrada
- Ferramentas terapêuticas especializadas (Campo de Constelação)
- Assistente de IA para suporte ao terapeuta
- Gerenciamento de prontuários
- Pagamentos integrados

## Tecnologias Utilizadas

### Frontend
- React.js
- React Router
- Axios
- Context API
- React Hook Form
- CSS Modules

### Backend
- Node.js
- Express
- Sequelize ORM
- MySQL
- JWT para autenticação
- Bcrypt para criptografia
- OpenAI API para funcionalidades de IA

### Videoconferência
- Jitsi Meet (implementação atual)
- Alternativas consideradas: Daily.com

### Inteligência Artificial
- OpenAI GPT-4 para análise de sessões
- Processamento de linguagem natural para sugestões em tempo real
- Geração automática de relatórios

## Estrutura do Projeto

O projeto é dividido em duas partes principais:

- `frontend/`: Aplicação React
- `backend/`: API RESTful em Node.js

## Instalação

### Requisitos
- Node.js 14+
- MySQL 8+
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
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=terapiaconect
JWT_SECRET=chave_secreta_jwt
OPENAI_API_KEY=sua_chave_da_openai
```

4. Execute as migrações do banco de dados:
```
npx sequelize db:migrate
```

5. Instale as dependências do frontend:
```
cd ../frontend
npm install
```

6. Configure o arquivo `.env` do frontend:
```
REACT_APP_API_URL=http://localhost:3000
```

## Executando o Projeto

1. Inicie o servidor backend:
```
cd backend
npm run dev
```

2. Em outro terminal, inicie o frontend:
```
cd frontend
npm start
```

3. Acesse a aplicação em `http://localhost:3001`

## Funcionalidades Principais

### Sistema de Usuários
- Cadastro e autenticação de terapeutas e clientes
- Perfis com atributos específicos para cada tipo de usuário
- Gestão de permissões

### Agendamento
- Calendário de disponibilidade
- Confirmação de agendamentos
- Notificações por email

### Videoconferência
- Integração com Jitsi Meet para videoconferência
- Salas privadas por sessão
- Controles de áudio e vídeo

### Assistente de IA
- Análise em tempo real das sessões
- Sugestões contextuais para o terapeuta
- Geração automática de relatórios
- Transcrição das sessões
- Insights sobre padrões e temas recorrentes

### Observações sobre Videoconferência
A implementação atual utiliza Jitsi Meet como solução de videoconferência. Durante o desenvolvimento, enfrentamos desafios com a integração WebRTC:

1. **Problemas de conexão WebSocket**: Instabilidades na conexão WebSocket ao utilizar a SDK do Dyte.

2. **Alternativas consideradas**:
   - **Daily.com**: Uma alternativa robusta ao Dyte, com API simples e focada em confiabilidade.
   - **Implementação própria com WebRTC**: Possibilidade de desenvolver uma solução personalizada utilizando a API WebRTC.

3. **Próximos passos**:
   - Avaliar a implementação do Daily.com como alternativa mais estável
   - Corrigir os problemas de WebRTC na implementação atual
   - Garantir compatibilidade cross-browser

### Ferramentas Terapêuticas
- Campo de Constelação para terapia
- Assistente IA integrado à videoconferência
- Análise de sessões em tempo real
- Geração de relatórios e insights

## Roadmap

- [x] Sistema de usuários e autenticação
- [x] Agendamento básico
- [x] Integração de videoconferência
- [x] Campo de Constelação
- [x] Assistente IA para terapeutas
- [x] Análise de sessões em tempo real
- [x] Geração de relatórios
- [ ] Melhorias na integração de videoconferência
- [ ] Implementação de pagamentos
- [ ] Aplicativo móvel

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Faça commit das mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nome-da-feature`)
5. Crie um novo Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. 