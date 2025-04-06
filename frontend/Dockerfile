# Estágio de build
FROM node:18 AS build

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos da aplicação
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Estágio de produção com NGINX
FROM nginx:alpine

# Copiar arquivos de build do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Copiar configuração personalizada do NGINX
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Comando para iniciar NGINX
CMD ["nginx", "-g", "daemon off;"] 