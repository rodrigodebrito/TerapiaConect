FROM node:20-alpine

WORKDIR /usr/src/app

# Instala pacotes essenciais e ferramentas de build
RUN apk add --no-cache python3 make g++ git

# Copia arquivos de configuração do projeto
COPY package*.json ./
COPY prisma ./prisma/
COPY .env .env.example ./

# Instala dependências
RUN npm ci

# Copia scripts de build e transformação
COPY scripts ./scripts/
COPY build.js ./

# Copia código fonte
COPY src ./src/

# Builds the application
RUN npm run build

# Gera o cliente Prisma
RUN npm run prisma:generate

# Porta que o servidor vai escutar
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]