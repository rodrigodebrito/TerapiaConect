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

# Criar versão CommonJS do arquivo principal
RUN echo 'require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const prisma = require("./utils/prisma");
const http = require("http");
const socketIo = require("socket.io");

// Importação das rotas
const authRoutes = require("./routes/auth.routes");
const therapistRoutes = require("./routes/therapist.routes");
const clientRoutes = require("./routes/client.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const userRoutes = require("./routes/user.routes");
const toolRoutes = require("./routes/tool.routes");
const uploadRoutes = require("./routes/upload.routes");
const sessionRoutes = require("./routes/session.routes");
const aiRoutes = require("./routes/ai.routes");
const transcriptRoutes = require("./routes/transcript.routes");
const insightRoutes = require("./routes/insight.routes");
const meetingRoutes = require("./routes/meeting.routes");
const trainingRoutes = require("./routes/training.routes");
const transcriptionRoutes = require("./routes/transcription.routes");

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Criar servidor HTTP com Express
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? ["https://terapiaconect.com", "https://www.terapiaconect.com"]
      : ["http://localhost:3001", "http://localhost:5173", "*"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://terapiaconect.com", "https://www.terapiaconect.com"]
    : ["http://localhost:3001", "http://localhost:5173", "*"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Definição das rotas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/therapists", therapistRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/transcripts", transcriptRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/transcription", transcriptionRoutes);

// Rota padrão
app.get("/", (req, res) => {
  res.send("API da Plataforma Terapeuta - Versão 1.0.0");
});

// Iniciar o servidor com socket.io
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} com suporte a Socket.IO`);
});' > src/index-temp.js

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar usando a versão CommonJS do index
CMD /bin/bash -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node src/index-temp.js" 