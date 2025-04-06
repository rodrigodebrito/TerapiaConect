# TerapiaConect - Método Simplificado

Este guia explica como executar o TerapiaConect usando uma abordagem simplificada com três opções:

1. PostgreSQL em Docker + Backend local
2. Backend com SQLite (sem Docker)

## Pré-requisitos

1. **Docker Desktop** instalado e funcionando (apenas para a opção com PostgreSQL)
2. **Node.js** instalado
3. **PowerShell** (já vem com o Windows)

## Estrutura de Arquivos

Foram criados scripts PowerShell para facilitar a execução:

- `run-postgresql.ps1` - Inicia o PostgreSQL no Docker
- `run-backend.ps1` - Inicia o backend localmente conectando ao PostgreSQL
- `run-backend-mock-db.ps1` - Inicia o backend usando SQLite (sem Docker)
- `start-terapiaconect.ps1` - Menu interativo para gerenciar todos os serviços

## Como Usar

### Método 1: Usando o Menu Interativo (Recomendado)

1. Execute o script principal:

```
.\start-terapiaconect.ps1
```

2. Selecione as opções desejadas no menu:
   - Opção 1: Iniciar PostgreSQL
   - Opção 2: Iniciar Backend (com PostgreSQL)
   - Opção 3: Iniciar Backend com SQLite (Sem Docker)
   - Opção 4: Parar PostgreSQL
   - Opção 5: Ver status dos serviços
   - Opção 6: Ver logs do PostgreSQL
   - Opção 7: Executar Prisma Migrate
   - Opção 8: Executar Prisma Studio

### Método 2: Usando PostgreSQL em Docker

1. Primeiro inicie o PostgreSQL:

```
.\run-postgresql.ps1
```

2. Depois inicie o backend:

```
.\run-backend.ps1
```

3. Para parar o PostgreSQL:

```
docker stop terapiaconect-db
docker rm terapiaconect-db
```

### Método 3: Usando SQLite (Sem Docker)

Se você estiver enfrentando problemas com o Docker ou simplesmente quiser uma configuração mais simples:

```
.\run-backend-mock-db.ps1
```

Este script:
- Cria um arquivo de configuração para SQLite
- Faz backup da sua configuração atual
- Configura o projeto para usar SQLite
- Inicializa o banco de dados
- Inicia o backend

## Detalhes de Conexão

### PostgreSQL
- **Host**: localhost
- **Porta**: 5432
- **Usuário**: postgres
- **Senha**: postgres
- **Banco de Dados**: terapiaconect

### SQLite
- Arquivo: `backend/dev.db`
- Sem necessidade de credenciais
- Acesso através do Prisma Studio (opção 8 no menu)

## Funcionalidades

- **Opção PostgreSQL**: Banco de dados robusto em Docker, backend local para fácil desenvolvimento
- **Opção SQLite**: Solução sem Docker, perfeita para desenvolvimento e testes rápidos
- Interface unificada para gerenciar todos os serviços
- Integração com Prisma para gerenciar o banco de dados

## Solução de Problemas

### Erro no Docker

Se você encontrar erros como "read-only file system" ao usar o Docker:
- Use a opção SQLite (opção 3 no menu)
- Considere reiniciar o Docker Desktop
- Verificar se o WSL está funcionando corretamente

### Backup e Restauração

Se você precisar voltar à configuração original do banco de dados:
```
cd backend
Copy-Item -Path "./.env.backup" -Destination "./.env" -Force
```

## Observações

- Recomendamos a opção SQLite se você estiver enfrentando problemas com o Docker no Windows
- O SQLite é adequado para desenvolvimento, mas para produção é recomendado usar PostgreSQL
- A versão SQLite do banco usa o mesmo esquema do PostgreSQL, graças ao Prisma 