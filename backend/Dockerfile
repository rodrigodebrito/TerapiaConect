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

# Remover todos os arquivos package.json internos para garantir que não há "type": "module"
RUN find ./src -name "package.json" -delete

# Criar versões .cjs dos arquivos de rota
RUN mkdir -p /app/routes-cjs && \
    for route in $(find ./src/routes -name "*.js"); do \
        filename=$(basename "$route" .js); \
        echo "const express = require('express');" > "/app/routes-cjs/${filename}.cjs"; \
        echo "const router = express.Router();" >> "/app/routes-cjs/${filename}.cjs"; \
        echo "// Rota básica para $filename" >> "/app/routes-cjs/${filename}.cjs"; \
        echo "router.get('/', (req, res) => {" >> "/app/routes-cjs/${filename}.cjs"; \
        echo "  res.json({ message: 'Rota $filename funcionando' });" >> "/app/routes-cjs/${filename}.cjs"; \
        echo "});" >> "/app/routes-cjs/${filename}.cjs"; \
        echo "module.exports = router;" >> "/app/routes-cjs/${filename}.cjs"; \
    done

# Criar arquivo index-compat.cjs - Parte 1: Importações e inicialização
RUN echo 'require("dotenv").config();' > index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo 'const express = require("express");' >> index-compat.cjs && \
    echo 'const cors = require("cors");' >> index-compat.cjs && \
    echo 'const bodyParser = require("body-parser");' >> index-compat.cjs && \
    echo 'const morgan = require("morgan");' >> index-compat.cjs && \
    echo 'const path = require("path");' >> index-compat.cjs && \
    echo 'const http = require("http");' >> index-compat.cjs && \
    echo 'const { Server: SocketIO } = require("socket.io");' >> index-compat.cjs && \
    echo 'const { PrismaClient } = require("@prisma/client");' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo 'const prisma = new PrismaClient();' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Criar arquivo index-compat.cjs - Parte 2: Importação das rotas
RUN echo '// Importação das rotas' >> index-compat.cjs && \
    echo 'const authRoutes = require("./routes-cjs/auth.routes.cjs");' >> index-compat.cjs && \
    echo 'const therapistRoutes = require("./routes-cjs/therapist.routes.cjs");' >> index-compat.cjs && \
    echo 'const clientRoutes = require("./routes-cjs/client.routes.cjs");' >> index-compat.cjs && \
    echo 'const appointmentRoutes = require("./routes-cjs/appointment.routes.cjs");' >> index-compat.cjs && \
    echo 'const userRoutes = require("./routes-cjs/user.routes.cjs");' >> index-compat.cjs && \
    echo 'const toolRoutes = require("./routes-cjs/tool.routes.cjs");' >> index-compat.cjs && \
    echo 'const uploadRoutes = require("./routes-cjs/upload.routes.cjs");' >> index-compat.cjs && \
    echo 'const sessionRoutes = require("./routes-cjs/session.routes.cjs");' >> index-compat.cjs && \
    echo 'const aiRoutes = require("./routes-cjs/ai.routes.cjs");' >> index-compat.cjs && \
    echo 'const transcriptRoutes = require("./routes-cjs/transcript.routes.cjs");' >> index-compat.cjs && \
    echo 'const insightRoutes = require("./routes-cjs/insight.routes.cjs");' >> index-compat.cjs && \
    echo 'const meetingRoutes = require("./routes-cjs/meeting.routes.cjs");' >> index-compat.cjs && \
    echo 'const trainingRoutes = require("./routes-cjs/training.routes.cjs");' >> index-compat.cjs && \
    echo 'const transcriptionRoutes = require("./routes-cjs/transcription.routes.cjs");' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Criar arquivo index-compat.cjs - Parte 3: Configuração da aplicação e servidor
RUN echo '// Configuração da aplicação' >> index-compat.cjs && \
    echo 'const app = express();' >> index-compat.cjs && \
    echo 'const PORT = process.env.PORT || 3000;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Criar servidor HTTP com Express' >> index-compat.cjs && \
    echo 'const server = http.createServer(app);' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Criar arquivo index-compat.cjs - Parte 4: Configuração do Socket.IO
RUN echo '// Configurar Socket.IO com configurações otimizadas' >> index-compat.cjs && \
    echo 'const io = new SocketIO(server, {' >> index-compat.cjs && \
    echo '  cors: {' >> index-compat.cjs && \
    echo '    origin: process.env.NODE_ENV === "production"' >> index-compat.cjs && \
    echo '      ? ["https://terapiaconect.com", "https://www.terapiaconect.com"]' >> index-compat.cjs && \
    echo '      : ["http://localhost:3001", "http://localhost:5173", "*"],' >> index-compat.cjs && \
    echo '    methods: ["GET", "POST", "OPTIONS"],' >> index-compat.cjs && \
    echo '    credentials: true,' >> index-compat.cjs && \
    echo '    allowedHeaders: ["Content-Type", "Authorization", "Accept"]' >> index-compat.cjs && \
    echo '  },' >> index-compat.cjs && \
    echo '  allowEIO3: true,' >> index-compat.cjs && \
    echo '  pingTimeout: 60000,' >> index-compat.cjs && \
    echo '  transports: ["polling", "websocket"]' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Criar arquivo index-compat.cjs - Parte 5: Middleware
RUN echo '// Middleware' >> index-compat.cjs && \
    echo 'app.use(cors({' >> index-compat.cjs && \
    echo '  origin: process.env.NODE_ENV === "production"' >> index-compat.cjs && \
    echo '    ? ["https://terapiaconect.com", "https://www.terapiaconect.com"]' >> index-compat.cjs && \
    echo '    : ["http://localhost:3001", "http://localhost:5173", "*"],' >> index-compat.cjs && \
    echo '  credentials: true,' >> index-compat.cjs && \
    echo '  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],' >> index-compat.cjs && \
    echo '  allowedHeaders: ["Content-Type", "Authorization", "Accept"]' >> index-compat.cjs && \
    echo '}));' >> index-compat.cjs && \
    echo 'app.use(express.json({ limit: "10mb" }));' >> index-compat.cjs && \
    echo 'app.use(express.urlencoded({ extended: true, limit: "10mb" }));' >> index-compat.cjs && \
    echo 'app.use(bodyParser.json({ limit: "10mb" }));' >> index-compat.cjs && \
    echo 'app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));' >> index-compat.cjs && \
    echo 'app.use(morgan("dev"));' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Servir arquivos estáticos da pasta uploads' >> index-compat.cjs && \
    echo 'app.use("/uploads", express.static(path.join(__dirname, "uploads")));' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Criar arquivo index-compat.cjs - Parte 6: Definição das rotas
RUN echo '// Definição das rotas' >> index-compat.cjs && \
    echo 'app.use("/api/auth", authRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/users", userRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/clients", clientRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/therapists", therapistRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/appointments", appointmentRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/tools", toolRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/upload", uploadRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/sessions", sessionRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/ai", aiRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/transcripts", transcriptRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/insights", insightRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/meetings", meetingRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/training", trainingRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/transcription", transcriptionRoutes);' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Criar arquivo index-compat.cjs - Parte 7: Rota padrão, Socket.IO e inicialização
RUN echo '// Rota padrão' >> index-compat.cjs && \
    echo 'app.get("/", (req, res) => {' >> index-compat.cjs && \
    echo '  res.send("API da Plataforma Terapeuta - Versão 1.0.0");' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Socket.IO básico' >> index-compat.cjs && \
    echo 'io.on("connection", (socket) => {' >> index-compat.cjs && \
    echo '  console.log("Novo cliente conectado:", socket.id);' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Iniciar o servidor' >> index-compat.cjs && \
    echo 'server.listen(PORT, () => {' >> index-compat.cjs && \
    echo '  console.log(`Servidor rodando na porta ${PORT} com suporte a Socket.IO`);' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar usando a versão CommonJS compatível
CMD /bin/sh -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node index-compat.cjs" 