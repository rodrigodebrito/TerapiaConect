# Docker para TerapiaConect

Este documento descreve como utilizar o Docker para executar o backend do TerapiaConect.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- PowerShell (Windows) ou Terminal (Mac/Linux)

## Estrutura

Os seguintes arquivos foram configurados para o Docker:

- `docker-compose.yml` - Configuração dos serviços (backend e banco de dados)
- `backend/Dockerfile` - Instruções para construir a imagem do backend
- `backend/.env.docker` - Variáveis de ambiente para o ambiente Docker
- `backend/.dockerignore` - Arquivos que serão ignorados ao construir a imagem
- `start-docker.ps1` - Script para iniciar os contêineres no Windows

## Como usar

### Iniciar o ambiente

No Windows, execute o script PowerShell:

```powershell
.\start-docker.ps1
```

Ou use diretamente o Docker Compose:

```bash
# Construir e iniciar os contêineres em segundo plano
docker-compose up -d --build
```

### Acessar os logs

Para ver os logs em tempo real:

```bash
docker-compose logs -f
```

Para ver apenas os logs do backend:

```bash
docker-compose logs -f backend
```

### Acessar o shell do contêiner

Para acessar o shell do contêiner do backend:

```bash
docker-compose exec backend sh
```

### Executar comandos do Prisma

Para executar comandos Prisma no contêiner:

```bash
docker-compose exec backend npx prisma migrate dev
# ou
docker-compose exec backend npx prisma generate
# ou
docker-compose exec backend npx prisma studio
```

### Parar o ambiente

Para parar todos os contêineres:

```bash
docker-compose down
```

Para parar e remover todos os dados (incluindo banco de dados):

```bash
docker-compose down -v
```

## Conexão com o banco de dados

- **Host**: localhost
- **Porta**: 5432
- **Usuário**: postgres
- **Senha**: postgres
- **Banco de dados**: terapiaconect

## Como funciona

1. O Docker Compose inicia dois serviços:
   - **db**: PostgreSQL para armazenar os dados
   - **backend**: Servidor Node.js com sua aplicação

2. Os dados do PostgreSQL são persistidos em um volume Docker, o que significa que eles sobreviverão entre reinicializações dos contêineres.

3. O backend está configurado para usar o banco de dados via URL de conexão: `postgresql://postgres:postgres@db:5432/terapiaconect`

4. O backend está acessível em `http://localhost:3000`

## Solução de problemas

### O backend não conecta ao banco de dados

Verifique se o contêiner do PostgreSQL está funcionando:

```bash
docker-compose ps
```

Se estiver em execução, tente reiniciar o backend:

```bash
docker-compose restart backend
```

### Erros de Prisma

Se você estiver enfrentando erros relacionados ao Prisma, tente gerar o cliente novamente:

```bash
docker-compose exec backend npx prisma generate
``` 