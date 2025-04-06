# Usar uma imagem mais leve do Node.js
FROM node:18-alpine

# Instalar dependências necessárias
RUN apk add --no-cache bash

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Remover "type": "module" do package.json
RUN sed -i 's/"type": "module",//g' package.json

# Instalar todas as dependências (incluindo de desenvolvimento para o Prisma)
RUN npm install

# Copiar os arquivos da aplicação
COPY . .

# Criar arquivo temporário para o index.js no formato CommonJS
RUN echo '// Versão CommonJS para contornar problemas com ESM' > src/index-temp.js && \
    echo 'require("dotenv").config();' >> src/index-temp.js && \
    echo 'const express = require("express");' >> src/index-temp.js && \
    echo 'const cors = require("cors");' >> src/index-temp.js && \
    echo 'const bodyParser = require("body-parser");' >> src/index-temp.js && \
    echo 'const morgan = require("morgan");' >> src/index-temp.js && \
    echo 'const path = require("path");' >> src/index-temp.js && \
    echo 'const prisma = require("./utils/prisma");' >> src/index-temp.js && \
    echo 'const http = require("http");' >> src/index-temp.js && \
    echo 'const socketIo = require("socket.io");' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Importação das rotas' >> src/index-temp.js && \
    echo 'const authRoutes = require("./routes/auth.routes");' >> src/index-temp.js && \
    echo 'const therapistRoutes = require("./routes/therapist.routes");' >> src/index-temp.js && \
    echo 'const clientRoutes = require("./routes/client.routes");' >> src/index-temp.js && \
    echo 'const appointmentRoutes = require("./routes/appointment.routes");' >> src/index-temp.js && \
    echo 'const userRoutes = require("./routes/user.routes");' >> src/index-temp.js && \
    echo 'const toolRoutes = require("./routes/tool.routes");' >> src/index-temp.js && \
    echo 'const uploadRoutes = require("./routes/upload.routes");' >> src/index-temp.js && \
    echo 'const sessionRoutes = require("./routes/session.routes");' >> src/index-temp.js && \
    echo 'const aiRoutes = require("./routes/ai.routes");' >> src/index-temp.js && \
    echo 'const transcriptRoutes = require("./routes/transcript.routes");' >> src/index-temp.js && \
    echo 'const insightRoutes = require("./routes/insight.routes");' >> src/index-temp.js && \
    echo 'const meetingRoutes = require("./routes/meeting.routes");' >> src/index-temp.js && \
    echo 'const trainingRoutes = require("./routes/training.routes");' >> src/index-temp.js && \
    echo 'const transcriptionRoutes = require("./routes/transcription.routes");' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Configuração da aplicação' >> src/index-temp.js && \
    echo 'const app = express();' >> src/index-temp.js && \
    echo 'const PORT = process.env.PORT || 3000;' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Criar servidor HTTP com Express' >> src/index-temp.js && \
    echo 'const server = http.createServer(app);' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Configurar Socket.IO' >> src/index-temp.js && \
    echo 'const io = socketIo(server, {' >> src/index-temp.js && \
    echo '  cors: {' >> src/index-temp.js && \
    echo '    origin: process.env.NODE_ENV === "production"' >> src/index-temp.js && \
    echo '      ? ["https://terapiaconect.com", "https://www.terapiaconect.com"]' >> src/index-temp.js && \
    echo '      : ["http://localhost:3001", "http://localhost:5173", "*"],' >> src/index-temp.js && \
    echo '    methods: ["GET", "POST", "OPTIONS"],' >> src/index-temp.js && \
    echo '    credentials: true,' >> src/index-temp.js && \
    echo '    allowedHeaders: ["Content-Type", "Authorization", "Accept"]' >> src/index-temp.js && \
    echo '  }' >> src/index-temp.js && \
    echo '});' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Middleware' >> src/index-temp.js && \
    echo 'app.use(cors({' >> src/index-temp.js && \
    echo '  origin: process.env.NODE_ENV === "production"' >> src/index-temp.js && \
    echo '    ? ["https://terapiaconect.com", "https://www.terapiaconect.com"]' >> src/index-temp.js && \
    echo '    : ["http://localhost:3001", "http://localhost:5173", "*"],' >> src/index-temp.js && \
    echo '  credentials: true,' >> src/index-temp.js && \
    echo '  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],' >> src/index-temp.js && \
    echo '  allowedHeaders: ["Content-Type", "Authorization", "Accept"]' >> src/index-temp.js && \
    echo '}));' >> src/index-temp.js && \
    echo 'app.use(express.json({ limit: "10mb" }));' >> src/index-temp.js && \
    echo 'app.use(express.urlencoded({ extended: true, limit: "10mb" }));' >> src/index-temp.js && \
    echo 'app.use(bodyParser.json({ limit: "10mb" }));' >> src/index-temp.js && \
    echo 'app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));' >> src/index-temp.js && \
    echo 'app.use(morgan("dev"));' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Servir arquivos estáticos da pasta uploads' >> src/index-temp.js && \
    echo 'app.use("/uploads", express.static(path.join(__dirname, "../uploads")));' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Definição das rotas' >> src/index-temp.js && \
    echo 'app.use("/api/auth", authRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/users", userRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/clients", clientRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/therapists", therapistRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/appointments", appointmentRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/tools", toolRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/upload", uploadRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/sessions", sessionRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/ai", aiRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/transcripts", transcriptRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/insights", insightRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/meetings", meetingRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/training", trainingRoutes);' >> src/index-temp.js && \
    echo 'app.use("/api/transcription", transcriptionRoutes);' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Rota padrão' >> src/index-temp.js && \
    echo 'app.get("/", (req, res) => {' >> src/index-temp.js && \
    echo '  res.send("API da Plataforma Terapeuta - Versão 1.0.0");' >> src/index-temp.js && \
    echo '});' >> src/index-temp.js && \
    echo '' >> src/index-temp.js && \
    echo '// Iniciar o servidor com socket.io' >> src/index-temp.js && \
    echo 'server.listen(PORT, () => {' >> src/index-temp.js && \
    echo '  console.log(`Servidor rodando na porta ${PORT} com suporte a Socket.IO`);' >> src/index-temp.js && \
    echo '});' >> src/index-temp.js

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar usando a versão CommonJS do index
CMD /bin/bash -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node src/index-temp.js" 