# TerapiaConect - Guia de Execução Local

Este guia explica como executar o TerapiaConect localmente no Windows, aproveitando seu PostgreSQL já instalado.

## Pré-requisitos

1. **PostgreSQL** já instalado e rodando
2. **Node.js** instalado
3. **PowerShell** (já vem com o Windows)

## Estrutura de Arquivos

Foram criados vários scripts PowerShell para facilitar a execução:

- `start-terapiaconect.ps1` - Menu interativo principal
- `run-backend-local-db.ps1` - Executa o backend com seu PostgreSQL local
- Outros scripts auxiliares para opções alternativas

## Como Usar (Recomendado)

### Menu Interativo

1. Execute o script principal:

```
.\start-terapiaconect.ps1
```

2. No menu que aparecerá, escolha a opção 1 - "Iniciar Backend com PostgreSQL local"

3. Siga as instruções na tela. O script irá:
   - Verificar as dependências
   - Configurar a conexão com seu PostgreSQL local
   - Iniciar o backend na porta 3000

4. Após iniciar, você poderá acessar o backend em:
   - http://localhost:3000

### Configuração do PostgreSQL

O script usa as seguintes configurações padrão para o PostgreSQL local:
- **Host**: localhost
- **Porta**: 5432
- **Usuário**: postgres
- **Senha**: postgres
- **Banco de Dados**: terapiaconect

Se você precisa modificar essas configurações, edite o arquivo `run-backend-local-db.ps1`.

## Ferramentas Adicionais

### Prisma Studio

Para visualizar e editar os dados do banco, use a opção 9 "Executar Prisma Studio" no menu principal.
Isto abrirá o Prisma Studio na porta 5555:
- http://localhost:5555

### Migração do Banco

Para executar migrações do Prisma, use a opção 8 "Executar Prisma Migrate" no menu principal.

## Opções Alternativas

O menu principal também oferece outras opções:

- **PostgreSQL no Docker** - Se preferir isolar o banco de dados
- **SQLite** - Para desenvolvimento rápido sem PostgreSQL
- **Ferramentas de Manutenção** - Para solucionar problemas

## Solução de Problemas

### Banco de Dados Não Conecta

Verifique se:
1. O PostgreSQL está rodando (procure no painel de serviços do Windows)
2. As credenciais estão corretas (usuário/senha)
3. O banco de dados "terapiaconect" existe

Para criar o banco, use:
```
createdb -U postgres terapiaconect
```

### Erro no Prisma

Execute:
```
cd backend
npx prisma generate
```

## Observações

- Esta configuração aproveita o PostgreSQL que você já tem instalado
- Para produção, o Render já possui seu próprio PostgreSQL
- Todos os scripts foram criados especificamente para o PowerShell no Windows 