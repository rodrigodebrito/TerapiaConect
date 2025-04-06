# Usar uma imagem mais leve do Node.js
FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache bash

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo de desenvolvimento para o Prisma)
RUN npm install

# Copiar os arquivos da aplicação
COPY . .

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Criar script de inicialização
RUN echo '#!/bin/bash\n\
echo "Aguardando conexão com o banco de dados..."\n\
npx prisma migrate deploy\n\
echo "Iniciando o servidor..."\n\
npm start\n\
' > /app/docker-entrypoint.sh

# Tornar o script executável
RUN chmod +x /app/docker-entrypoint.sh

# Expor porta
EXPOSE 3000

# Comando para iniciar usando o script
CMD ["/app/docker-entrypoint.sh"] 