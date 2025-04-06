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
    echo '' >> index-compat.cjs && \
    echo '// Importação das rotas' >> index-compat.cjs && \
    echo 'const authRoutes = require("./src/routes/auth.routes");' >> index-compat.cjs && \
    echo 'const therapistRoutes = require("./src/routes/therapist.routes");' >> index-compat.cjs && \
    echo 'const clientRoutes = require("./src/routes/client.routes");' >> index-compat.cjs && \
    echo 'const appointmentRoutes = require("./src/routes/appointment.routes");' >> index-compat.cjs && \
    echo 'const userRoutes = require("./src/routes/user.routes");' >> index-compat.cjs && \
    echo 'const toolRoutes = require("./src/routes/tool.routes");' >> index-compat.cjs && \
    echo 'const uploadRoutes = require("./src/routes/upload.routes");' >> index-compat.cjs && \
    echo 'const sessionRoutes = require("./src/routes/session.routes");' >> index-compat.cjs && \
    echo 'const aiRoutes = require("./src/routes/ai.routes");' >> index-compat.cjs && \
    echo 'const transcriptRoutes = require("./src/routes/transcript.routes");' >> index-compat.cjs && \
    echo 'const insightRoutes = require("./src/routes/insight.routes");' >> index-compat.cjs && \
    echo 'const meetingRoutes = require("./src/routes/meeting.routes");' >> index-compat.cjs && \
    echo 'const trainingRoutes = require("./src/routes/training.routes");' >> index-compat.cjs && \
    echo 'const transcriptionRoutes = require("./src/routes/transcription.routes");' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Configuração da aplicação' >> index-compat.cjs && \
    echo 'const app = express();' >> index-compat.cjs && \
    echo 'const PORT = process.env.PORT || 3000;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Criar servidor HTTP com Express' >> index-compat.cjs && \
    echo 'const server = http.createServer(app);' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Configurar Socket.IO com configurações otimizadas' >> index-compat.cjs && \
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
    echo '' >> index-compat.cjs && \
    echo '// Middleware' >> index-compat.cjs && \
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
    echo '' >> index-compat.cjs && \
    echo '// Definição das rotas' >> index-compat.cjs && \
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
    echo '' >> index-compat.cjs && \
    echo '// Rota padrão' >> index-compat.cjs && \
    echo 'app.get("/", (req, res) => {' >> index-compat.cjs && \
    echo '  res.send("API da Plataforma Terapeuta - Versão 1.0.0");' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Iniciar o servidor' >> index-compat.cjs && \
    echo 'server.listen(PORT, () => {' >> index-compat.cjs && \
    echo '  console.log(`Servidor rodando na porta ${PORT} com suporte a Socket.IO`);' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Manipulador básico de Socket.IO' >> index-compat.cjs && \
    echo 'io.on("connection", (socket) => {' >> index-compat.cjs && \
    echo '  console.log("Novo cliente conectado:", socket.id);' >> index-compat.cjs && \
    echo '});'

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar usando a versão CommonJS compatível
CMD /bin/sh -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Verificando arquivo index-compat.cjs...' && cat index-compat.cjs && echo 'Iniciando o servidor...' && node index-compat.cjs" 