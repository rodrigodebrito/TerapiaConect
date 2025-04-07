# TerapiaConect - Guia de Deploy e Manutenção

Este guia documenta o processo de deploy da aplicação TerapiaConect no Render e fornece instruções importantes para manutenção do código.

## Configuração de Deploy no Render

A aplicação TerapiaConect está configurada para ser deployada no Render usando Docker, com conversão automática de ES Modules para CommonJS.

### Arquivos Importantes para Deploy

- `backend/Dockerfile` - Contém todas as instruções para build da imagem Docker
- `.env.docker` - Variáveis de ambiente para o ambiente de produção

## Estrutura do Dockerfile

O Dockerfile implementa uma estratégia de conversão automática do formato ES Modules (ESM) para CommonJS (CJS), devido a limitações no ambiente de deploy. As principais etapas são:

1. Uso de uma imagem base Node.js (Alpine)
2. Instalação de dependências para processamento de arquivos
3. Remoção de `"type": "module"` do `package.json`
4. Conversão de todos os arquivos `.js` para `.cjs`
5. Correção de caminhos de importação
6. Criação manual de arquivos críticos para garantir compatibilidade

## Adicionando Novas Rotas

Ao adicionar novas rotas à aplicação, siga estas instruções para garantir compatibilidade com o ambiente de deploy:

### 1. Criação do Arquivo de Rota (Desenvolvimento Local)

Crie seu arquivo normalmente usando ES Modules no diretório `backend/src/routes/`:

```javascript
// exemplo: backend/src/routes/nova-rota.js
import express from 'express';
import { validateToken } from '../middleware/auth.middleware.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

router.get('/', validateToken, async (req, res) => {
  try {
    // Lógica da rota
    res.json({ message: 'Nova rota funcionando!' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
```

### 2. Registrar no Arquivo Principal

Registre sua rota no arquivo `backend/index.js`:

```javascript
import novaRota from './src/routes/nova-rota.js';
app.use('/api/nova-rota', novaRota);
```

### 3. Adaptar para Compatibilidade com o Render

Para garantir que sua rota funcione no ambiente de produção, adicione ao Dockerfile a criação manual do arquivo CommonJS correspondente:

```dockerfile
# Adicionar no backend/Dockerfile antes do CMD
RUN echo 'const express = require("express");' > /app/src-cjs/routes/nova-rota.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo '' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo '// Rota básica' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo 'router.get("/", validateToken, (req, res) => {' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo '  res.json({ message: "Nova rota funcionando!" });' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo '});' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo '' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/nova-rota.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/nova-rota.cjs
```

### 4. Registrar no index-compat.cjs

Você também precisa certificar-se de que sua rota está registrada no arquivo `index-compat.cjs` que é gerado no Dockerfile:

- Localize a seção `try { ... }` no Dockerfile onde os imports são adicionados
- Adicione sua rota nessa lista
- Certifique-se de que ela também é registrada no bloco de rotas mais abaixo

## Lidando com Middleware

Ao criar novas rotas que usam middleware de autenticação, sempre:

1. Use a extensão `.cjs` ao importar o middleware no arquivo CommonJS:
```javascript
const { validateToken } = require("../middleware/auth.middleware.cjs");
```

2. Importe prisma com a extensão correta:
```javascript
const prisma = require("../utils/prisma.cjs");
```

## Lidando com Controllers

Para adicionar novos controllers:

1. Crie o arquivo controller em `backend/src/controllers/` usando ES Modules
2. Adicione ao Dockerfile a criação manual da versão CommonJS desse controller:

```dockerfile
RUN echo 'const prisma = require("../utils/prisma.cjs");' > /app/src-cjs/controllers/novo-controller.cjs && \
    echo '' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo 'exports.nomeDaFuncao = async (req, res) => {' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '    // Lógica do controller' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '    res.status(200).json({ message: "Sucesso" });' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '    console.error("Erro:", error);' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '    res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/novo-controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/novo-controller.cjs
```

## Testando o Deploy Localmente

Você pode testar se suas alterações funcionarão no ambiente de produção rodando:

```bash
docker build -t terapiaconect-backend -f backend/Dockerfile ./backend
docker run -p 3000:3000 terapiaconect-backend
```

## Troubleshooting Comum

### Erro: "Cannot find module '../middleware/auth.middleware'"

Este erro ocorre quando uma rota está usando o caminho incorreto para o middleware de autenticação. Solução:

1. Verifique se o arquivo da rota está importando o middleware com a extensão `.cjs`
2. Adicione manualmente a criação do arquivo da rota no Dockerfile

### Erro: "Cannot find module '../utils/prisma'"

Este erro ocorre quando um arquivo está tentando importar o prisma sem a extensão `.cjs`. Solução:

1. Certifique-se de que todos os arquivos criados manualmente importam prisma com `require("../utils/prisma.cjs")`
2. Verifique se o comando sed no Dockerfile está corretamente substituindo todas as importações

## Processo de Deploy

1. Faça suas alterações no código local (ES Modules)
2. Se você adicionou novas rotas ou controllers, atualize o Dockerfile conforme instruções acima
3. Faça commit de suas alterações
4. Push para o repositório GitHub
5. O Render detectará automaticamente as alterações e iniciará um novo deploy

## Monitoramento e Logs

Após o deploy, monitore os logs no Render para detectar possíveis erros. Preste atenção especial a mensagens como:

- "Algumas rotas não puderam ser carregadas" - Indica problemas com importações
- Erros de "Cannot find module" - Geralmente relacionados a caminhos incorretos
- Falhas de conexão com o banco de dados - Verificar se as migrações foram aplicadas

---

Este guia será atualizado conforme novas funcionalidades e configurações forem implementadas. 