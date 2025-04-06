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

# Criar o arquivo index-compat.cjs para lidar com as importações de rota em formato CommonJS
RUN cat > index-compat.cjs << 'EOF'
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const { Server: SocketIO } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Importação das rotas
const authRoutes = require("./src/routes/auth.routes");
const therapistRoutes = require("./src/routes/therapist.routes");
const clientRoutes = require("./src/routes/client.routes");
const appointmentRoutes = require("./src/routes/appointment.routes");
const userRoutes = require("./src/routes/user.routes");
const toolRoutes = require("./src/routes/tool.routes");
const uploadRoutes = require("./src/routes/upload.routes");
const sessionRoutes = require("./src/routes/session.routes");
const aiRoutes = require("./src/routes/ai.routes");
const transcriptRoutes = require("./src/routes/transcript.routes");
const insightRoutes = require("./src/routes/insight.routes");
const meetingRoutes = require("./src/routes/meeting.routes");
const trainingRoutes = require("./src/routes/training.routes");
const transcriptionRoutes = require("./src/routes/transcription.routes");

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3000;

// Criar servidor HTTP com Express
const server = http.createServer(app);

// Configurar Socket.IO com configurações otimizadas
const io = new SocketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? ["https://terapiaconect.com", "https://www.terapiaconect.com"]
      : ["http://localhost:3001", "http://localhost:5173", "*"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  },
  allowEIO3: true,
  pingTimeout: 60000,
  transports: ["polling", "websocket"]
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Socket.IO básico
io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);
});

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} com suporte a Socket.IO`);
});
EOF

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar usando a versão CommonJS compatível
CMD /bin/sh -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node index-compat.cjs" 