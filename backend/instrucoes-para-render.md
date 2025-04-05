# Instruções para Corrigir o Banco de Dados no Render

A verificação identificou que o banco de dados no ambiente de produção (Render) está faltando várias tabelas importantes que existem em seu ambiente local. Vamos corrigir isso executando os scripts necessários no Shell do Render.

## Passo 1: Acessar o Shell do Render

1. Acesse o dashboard do Render
2. Encontre o serviço web do seu backend
3. Clique na opção "Shell" no menu

## Passo 2: Verificar as tabelas atuais

Execute o seguinte comando para verificar as tabelas existentes no banco de dados:

```
node check-db.js
```

## Passo 3: Criar as tabelas faltantes

1. Faça upload do script `create-remaining-tables.js` que criamos ou crie o arquivo no Render Shell usando um editor como nano ou vi:

```
vi create-remaining-tables.js
```

2. Cole o conteúdo do script que criamos localmente (ou copie do seu ambiente local para o Render usando uma transferência de arquivo)

3. Execute o script para criar as tabelas faltantes:

```
node create-remaining-tables.js
```

4. Este script irá:
   - Identificar quais tabelas estão faltando no banco de dados
   - Criar automaticamente cada tabela faltante com a estrutura correta
   - Adicionar as chaves estrangeiras e relacionamentos necessários
   - Exibir um relatório das tabelas criadas

## Passo 4: Criar as ferramentas terapêuticas

Execute o script `create-tools.js` para criar as ferramentas terapêuticas:

```
node create-tools.js
```

## Passo 5: Verificar se todas as tabelas foram criadas

Execute novamente o script de verificação:

```
node check-db.js
```

## Passo 6: Reiniciar o serviço

Após garantir que todas as tabelas foram criadas corretamente:

1. Saia do Shell usando o comando `exit`
2. Reinicie o serviço no painel do Render

## Resolução de problemas

- Se ocorrer algum erro durante a criação das tabelas, verifique os logs para identificar o problema específico
- Dependências: certifique-se de que o Prisma está instalado corretamente no ambiente
- Permissões: verifique se o usuário do banco de dados tem permissões para criar tabelas
- Conexão: certifique-se de que as variáveis de ambiente para conexão com o banco de dados estão configuradas corretamente

## Observações

Este script foi projetado para ser seguro e idempotente, ou seja, pode ser executado várias vezes sem causar problemas, pois utiliza a cláusula `IF NOT EXISTS`. 