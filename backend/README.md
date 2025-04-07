# TerapiaConect Backend

Backend da plataforma TerapiaConect, desenvolvido com Node.js, Express e Prisma.

## Estrutura do Projeto

O projeto segue uma arquitetura moderna baseada em ES Modules e foi organizado para facilitar a manutenção e escalabilidade:

```
backend/
├── dist/               # Código transpilado para produção
├── prisma/             # Schemas e migrações do Prisma
├── scripts/            # Scripts de utilidade
├── src/                # Código-fonte
│   ├── controllers/    # Controladores das rotas
│   ├── middleware/     # Middleware de Express
│   ├── models/         # Modelos de dados
│   ├── routes/         # Rotas da API
│   ├── services/       # Serviços de negócio
│   ├── utils/          # Utilitários
│   ├── app.js          # Configuração do Express
│   └── index.js        # Ponto de entrada da aplicação
├── uploads/            # Arquivos enviados pelos usuários
├── .env                # Variáveis de ambiente (não versionado)
├── .env.docker         # Variáveis para ambiente Docker
├── .gitignore          # Arquivos ignorados pelo Git
├── build.js            # Script de build com esbuild
├── Dockerfile          # Configuração para Docker
├── package.json        # Dependências e scripts
└── README.md           # Documentação (este arquivo)
```

## Requisitos

- Node.js >= 18
- npm ou yarn
- PostgreSQL

## Características

- **ES Modules**: Utiliza o sistema de módulos ECMAScript nativo
- **Arquitetura Modular**: Organização em controllers, services, routes, etc.
- **API RESTful**: Endpoints bem definidos seguindo as melhores práticas
- **Socket.IO**: Suporte a WebSockets para comunicação em tempo real
- **Docker**: Containerização para facilitar o deployment
- **Prisma ORM**: Acesso ao banco de dados seguro e tipado

## Configuração de Desenvolvimento

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/terapiaconect.git
cd terapiaconect/backend

# Instalar dependências
npm install
```

### Configuração do Ambiente

1. Crie um arquivo `.env` baseado no modelo `.env.example`:

```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env`:

```
# Configurações do servidor
NODE_ENV=development
PORT=3000

# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/terapiaconect

# JWT
JWT_SECRET=sua_chave_secreta_jwt
JWT_REFRESH_SECRET=sua_chave_secreta_refresh_jwt
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:5173
```

3. Execute as migrações do banco de dados:

```bash
npx prisma migrate dev
```

### Comandos Disponíveis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento
- `npm run build`: Constrói o projeto para produção
- `npm start`: Inicia o servidor em modo de produção
- `npm run convert-to-esm`: Converte arquivos CommonJS para ES Modules
- `npm run prisma:generate`: Gera o cliente Prisma
- `npm run prisma:migrate`: Executa migrações do banco de dados
- `npm run prisma:deploy`: Implanta migrações em produção

## Docker

Para executar o projeto com Docker:

```bash
# Construir e iniciar o container
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

## Implantação

O projeto está configurado para ser implantado facilmente em plataformas como Render ou Railway.

### Variáveis de Ambiente em Produção

Certifique-se de configurar as seguintes variáveis de ambiente:

- `PORT`: Porta em que o servidor será executado
- `DATABASE_URL`: URL de conexão com o banco de dados PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT
- `CORS_ORIGIN`: Lista de origens permitidas separadas por vírgula

## Processo de Desenvolvimento

### Conversão para ES Modules

Se você precisar converter arquivos CommonJS para ES Modules:

```bash
npm run convert-to-esm
```

Isso executará um script que:
1. Converte `require()` para `import`
2. Converte `module.exports` para `export default`
3. Ajusta referências de caminhos

### Build do Projeto

O projeto usa esbuild para transpilação rápida:

```bash
npm run build
```

O processo de build:
1. Limpa o diretório `dist`
2. Transpila arquivos ES Modules
3. Copia arquivos estáticos, como Prisma e uploads

## Contribuição

1. Crie um fork do projeto
2. Crie uma nova branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas alterações (`git commit -m 'feat: implementa nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença ISC.
