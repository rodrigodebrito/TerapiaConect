FROM node:20-alpine

WORKDIR /usr/src/app

# Instala pacotes essenciais e ferramentas de build
# Adicionamos as bibliotecas necessárias para o Prisma (libssl e openssl)
RUN apk add --no-cache python3 make g++ git openssl openssl-dev

# Copia arquivos de configuração do projeto
COPY package*.json ./
COPY prisma ./prisma/
COPY .env.example ./
# Cria um .env vazio - será substituído pelo volume em runtime
RUN cp .env.example .env || touch .env

# Instala dependências
RUN npm install

# Copia scripts de build e transformação
COPY scripts ./scripts/
COPY build.js ./

# Copia código fonte
COPY src ./src/

# Prepara os arquivos de rota convertendo-os para .cjs
RUN npm run prepare-routes

# Builds the application
RUN npm run build

# Gera o cliente Prisma
RUN npm run prisma:generate

# Porta que o servidor vai escutar
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]