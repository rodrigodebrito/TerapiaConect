FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar os arquivos da aplicação
COPY . .

# Construir a aplicação
RUN npm run build

# Stage 2: Imagem de execução
FROM node:18-alpine

# Definir variáveis de ambiente
ENV NODE_ENV=production

# Definir diretório de trabalho
WORKDIR /app

# Instalar serve para hospedar a aplicação
RUN npm install -g serve

# Copiar build da etapa anterior
COPY --from=builder /app/dist ./dist

# Expor a porta
EXPOSE 3001

# Iniciar servidor
CMD ["serve", "-s", "dist", "-l", "3001"] 