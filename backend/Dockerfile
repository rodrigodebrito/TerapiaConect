FROM node:20-alpine

# Configuração do diretório de trabalho
WORKDIR /usr/src/app

# Instalação das dependências necessárias para o Prisma
RUN apk add --no-cache openssl

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala as dependências do projeto (usando install em vez de ci)
RUN npm install

# Copia os arquivos do projeto
COPY . .

# Define a variável de ambiente para produção
ENV NODE_ENV=production

# Executa o script de build que agora tem fallback quando SWC não estiver disponível
RUN npm run build

# Gera o cliente Prisma
RUN npx prisma generate

# Expõe a porta que a API irá utilizar
EXPOSE 3000

# Comando para iniciar a aplicação quando o container for executado
CMD ["npm", "start"]