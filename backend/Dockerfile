# Usar uma imagem mais leve do Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Remover a configuração "type": "module" do package.json
RUN sed -i '/"type": "module"/d' package.json

# Instalar todas as dependências (incluindo de desenvolvimento para o Prisma)
RUN npm install

# Copiar os arquivos da aplicação
COPY . .

# Criar o index-temp.cjs que importa o arquivo original
RUN echo 'module.exports = require("./src/index.js");' > index-temp.cjs

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar usando a versão CommonJS do index
CMD /bin/bash -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node index-temp.cjs" 