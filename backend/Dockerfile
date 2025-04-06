# Usar uma imagem mais leve do Node.js
FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache bash

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Remover "type": "module" do package.json para manter CommonJS
RUN cat package.json | grep -v '"type": "module"' > package.temp.json && mv package.temp.json package.json

# Instalar todas as dependências (incluindo de desenvolvimento para o Prisma)
RUN npm install

# Copiar os arquivos da aplicação
COPY . .

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar diretamente (sem script separado)
CMD /bin/bash -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && npm start" 