# Usar uma imagem mais leve do Node.js
FROM node:18-alpine

# Instalar dependências para processamento de arquivos
RUN apk add --no-cache bash sed grep

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

# Criar diretório para versões convertidas
RUN mkdir -p /app/src-cjs/routes /app/src-cjs/controllers /app/src-cjs/middleware /app/src-cjs/utils /app/src-cjs/services

# Converter arquivos de middleware primeiro
RUN for file in $(find ./src/middleware -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/export {/module.exports = {/g' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Converter arquivos de utils 
RUN for file in $(find ./src/utils -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/export {/module.exports = {/g' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Converter arquivos de services
RUN for file in $(find ./src/services -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/export {/module.exports = {/g' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Converter arquivos de controllers
RUN for file in $(find ./src/controllers -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/export {/module.exports = {/g' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Por último, converter arquivos de rotas quando tudo já estiver convertido
RUN for file in $(find ./src/routes -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export default/module.exports =/' \
            -e 's/export {/module.exports = {/g' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Ajustar caminhos relativos para todos os arquivos CommonJS
RUN find /app/src-cjs -name "*.cjs" -exec sed -i 's/from ".\.\//from "..\/src-cjs\//g' {} \;
RUN find /app/src-cjs -name "*.cjs" -exec sed -i 's/from ".\//from ".\/src-cjs\//g' {} \;
RUN find /app/src-cjs -name "*.cjs" -exec sed -i 's/require(".\.\//require("..\/src-cjs\//g' {} \;
RUN find /app/src-cjs -name "*.cjs" -exec sed -i 's/require(".\//require(".\/src-cjs\//g' {} \;

# Criar manualmente o arquivo utils/prisma.cjs que é usado por muitas rotas
RUN mkdir -p /app/src-cjs/utils
RUN echo 'const { PrismaClient } = require("@prisma/client");' > /app/src-cjs/utils/prisma.cjs && \
    echo '' >> /app/src-cjs/utils/prisma.cjs && \
    echo '// Configurar o cliente Prisma com logs apropriados' >> /app/src-cjs/utils/prisma.cjs && \
    echo 'const prisma = global.prisma || new PrismaClient({' >> /app/src-cjs/utils/prisma.cjs && \
    echo '  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],' >> /app/src-cjs/utils/prisma.cjs && \
    echo '});' >> /app/src-cjs/utils/prisma.cjs && \
    echo '' >> /app/src-cjs/utils/prisma.cjs && \
    echo '// Adicionar prisma ao objeto global para reutilização entre requests no desenvolvimento' >> /app/src-cjs/utils/prisma.cjs && \
    echo 'if (process.env.NODE_ENV === "development") global.prisma = prisma;' >> /app/src-cjs/utils/prisma.cjs && \
    echo '' >> /app/src-cjs/utils/prisma.cjs && \
    echo 'module.exports = prisma;' >> /app/src-cjs/utils/prisma.cjs

# Criar manualmente o arquivo middleware/auth.middleware.cjs com referências corretas
RUN mkdir -p /app/src-cjs/middleware && \
    echo 'const jwt = require("jsonwebtoken");' > /app/src-cjs/middleware/auth.middleware.cjs && \
    echo 'const prisma = require("../utils/prisma.cjs");' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '// Função para validar token JWT' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo 'exports.validateToken = (req, res, next) => {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  const token = req.headers.authorization?.split(" ")[1];' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  if (!token) {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    return res.status(401).json({ message: "Token não fornecido" });' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  }' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  try {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    const decoded = jwt.verify(token, process.env.JWT_SECRET);' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    req.user = decoded;' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    next();' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    return res.status(401).json({ message: "Token inválido" });' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  }' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '};' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '// Função para validar refresh token' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo 'exports.validateRefreshToken = (req, res, next) => {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  const { refreshToken } = req.body;' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  if (!refreshToken) {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    return res.status(401).json({ message: "Refresh token não fornecido" });' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  }' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  try {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    req.user = decoded;' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    next();' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '    return res.status(401).json({ message: "Refresh token inválido" });' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '  }' >> /app/src-cjs/middleware/auth.middleware.cjs && \
    echo '};' >> /app/src-cjs/middleware/auth.middleware.cjs

# Corrigir referências ao módulo prisma em todos os arquivos
RUN find /app/src-cjs -name "*.cjs" -exec sed -i 's/require("..\/utils\/prisma")/require("..\/utils\/prisma.cjs")/g' {} \;
RUN find /app/src-cjs -name "*.cjs" -exec sed -i 's/require("..\/src-cjs\/utils\/prisma")/require("..\/utils\/prisma.cjs")/g' {} \;
RUN find /app/src-cjs -name "*.cjs" -exec sed -i 's/require(".\/prisma")/require(".\/prisma.cjs")/g' {} \;

# Corrija específicamente importações de auth.middleware em todos os arquivos de rota
RUN find /app/src-cjs/routes -name "*.cjs" -exec sed -i 's/require("..\/middleware\/auth.middleware")/require("..\/middleware\/auth.middleware.cjs")/g' {} \;
RUN find /app/src-cjs/routes -name "*.cjs" -exec sed -i 's/require("..\/src-cjs\/middleware\/auth.middleware")/require("..\/middleware\/auth.middleware.cjs")/g' {} \;
RUN find /app/src-cjs/routes -name "*.cjs" -exec sed -i 's/require("..\/controllers\/[^"]*")/require("..\/controllers\/\$2.cjs")/g' {} \;

# Criar arquivo index-compat.cjs para compatibilidade
RUN echo 'require("dotenv").config();' > index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo 'const express = require("express");' >> index-compat.cjs && \
    echo 'const cors = require("cors");' >> index-compat.cjs && \
    echo 'const bodyParser = require("body-parser");' >> index-compat.cjs && \
    echo 'const morgan = require("morgan");' >> index-compat.cjs && \
    echo 'const path = require("path");' >> index-compat.cjs && \
    echo 'const http = require("http");' >> index-compat.cjs && \
    echo 'const { Server: SocketIO } = require("socket.io");' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Adicionar configuração do banco de dados
RUN echo 'const { PrismaClient } = require("@prisma/client");' >> index-compat.cjs && \
    echo 'const prisma = new PrismaClient({' >> index-compat.cjs && \
    echo '  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"]' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo 'global.prisma = prisma;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Importar rotas convertidas
RUN echo '// Importação das rotas' >> index-compat.cjs && \
    echo 'const authRoutes = require("./src-cjs/routes/auth.routes.cjs");' >> index-compat.cjs && \
    echo 'const therapistRoutes = require("./src-cjs/routes/therapist.routes.cjs");' >> index-compat.cjs && \
    echo 'try {' >> index-compat.cjs && \
    echo '  const clientRoutes = require("./src-cjs/routes/client.routes.cjs");' >> index-compat.cjs && \
    echo '  const appointmentRoutes = require("./src-cjs/routes/appointment.routes.cjs");' >> index-compat.cjs && \
    echo '  const userRoutes = require("./src-cjs/routes/user.routes.cjs");' >> index-compat.cjs && \
    echo '  const toolRoutes = require("./src-cjs/routes/tool.routes.cjs");' >> index-compat.cjs && \
    echo '  const uploadRoutes = require("./src-cjs/routes/upload.routes.cjs");' >> index-compat.cjs && \
    echo '  const sessionRoutes = require("./src-cjs/routes/session.routes.cjs");' >> index-compat.cjs && \
    echo '  const aiRoutes = require("./src-cjs/routes/ai.routes.cjs");' >> index-compat.cjs && \
    echo '  const transcriptRoutes = require("./src-cjs/routes/transcript.routes.cjs");' >> index-compat.cjs && \
    echo '  const insightRoutes = require("./src-cjs/routes/insight.routes.cjs");' >> index-compat.cjs && \
    echo '  const meetingRoutes = require("./src-cjs/routes/meeting.routes.cjs");' >> index-compat.cjs && \
    echo '  const trainingRoutes = require("./src-cjs/routes/training.routes.cjs");' >> index-compat.cjs && \
    echo '  const transcriptionRoutes = require("./src-cjs/routes/transcription.routes.cjs");' >> index-compat.cjs && \
    echo '  global.routesAvailable = {' >> index-compat.cjs && \
    echo '    clientRoutes, appointmentRoutes, userRoutes, toolRoutes, uploadRoutes, sessionRoutes,' >> index-compat.cjs && \
    echo '    aiRoutes, transcriptRoutes, insightRoutes, meetingRoutes, trainingRoutes, transcriptionRoutes' >> index-compat.cjs && \
    echo '  };' >> index-compat.cjs && \
    echo '} catch (error) {' >> index-compat.cjs && \
    echo '  console.warn("Algumas rotas não puderam ser carregadas:", error.message);' >> index-compat.cjs && \
    echo '  global.routesAvailable = {};' >> index-compat.cjs && \
    echo '}' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Configuração e inicialização do aplicativo
RUN echo '// Configuração da aplicação' >> index-compat.cjs && \
    echo 'const app = express();' >> index-compat.cjs && \
    echo 'const PORT = process.env.PORT || 3000;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Criar servidor HTTP com Express' >> index-compat.cjs && \
    echo 'const server = http.createServer(app);' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Adicionar configuração do Socket.IO
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
    echo 'global.io = io;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Melhorar configuração de middleware
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

# Definir rotas com tratamento de erro
RUN echo '// Definição das rotas' >> index-compat.cjs && \
    echo 'app.use("/api/auth", authRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/therapists", therapistRoutes);' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Configurar dinamicamente as rotas disponíveis' >> index-compat.cjs && \
    echo 'if (global.routesAvailable) {' >> index-compat.cjs && \
    echo '  const { clientRoutes, userRoutes, appointmentRoutes, toolRoutes, uploadRoutes,' >> index-compat.cjs && \
    echo '          sessionRoutes, aiRoutes, transcriptRoutes, insightRoutes, meetingRoutes,' >> index-compat.cjs && \
    echo '          trainingRoutes, transcriptionRoutes } = global.routesAvailable;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '  // Adicionar rotas se estiverem disponíveis' >> index-compat.cjs && \
    echo '  if (userRoutes) app.use("/api/users", userRoutes);' >> index-compat.cjs && \
    echo '  if (clientRoutes) app.use("/api/clients", clientRoutes);' >> index-compat.cjs && \
    echo '  if (appointmentRoutes) app.use("/api/appointments", appointmentRoutes);' >> index-compat.cjs && \
    echo '  if (toolRoutes) app.use("/api/tools", toolRoutes);' >> index-compat.cjs && \
    echo '  if (uploadRoutes) app.use("/api/upload", uploadRoutes);' >> index-compat.cjs && \
    echo '  if (sessionRoutes) app.use("/api/sessions", sessionRoutes);' >> index-compat.cjs && \
    echo '  if (aiRoutes) app.use("/api/ai", aiRoutes);' >> index-compat.cjs && \
    echo '  if (transcriptRoutes) app.use("/api/transcripts", transcriptRoutes);' >> index-compat.cjs && \
    echo '  if (insightRoutes) app.use("/api/insights", insightRoutes);' >> index-compat.cjs && \
    echo '  if (meetingRoutes) app.use("/api/meetings", meetingRoutes);' >> index-compat.cjs && \
    echo '  if (trainingRoutes) app.use("/api/training", trainingRoutes);' >> index-compat.cjs && \
    echo '  if (transcriptionRoutes) app.use("/api/transcription", transcriptionRoutes);' >> index-compat.cjs && \
    echo '}' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Melhorar rota padrão
RUN echo '// Rota padrão' >> index-compat.cjs && \
    echo 'app.get("/", (req, res) => {' >> index-compat.cjs && \
    echo '  res.send("API da Plataforma Terapeuta - Versão 1.0.0");' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Configuração completa do Socket.IO' >> index-compat.cjs && \
    echo 'io.on("connection", (socket) => {' >> index-compat.cjs && \
    echo '  console.log("Novo cliente conectado:", socket.id);' >> index-compat.cjs && \
    echo '  ' >> index-compat.cjs && \
    echo '  // Manipular entrada em uma sala de sessão' >> index-compat.cjs && \
    echo '  socket.on("join-session", (data) => {' >> index-compat.cjs && \
    echo '    if (data && data.sessionId) {' >> index-compat.cjs && \
    echo '      console.log(`Cliente ${socket.id} entrou na sala: ${data.sessionId}`);' >> index-compat.cjs && \
    echo '      socket.join(data.sessionId);' >> index-compat.cjs && \
    echo '      ' >> index-compat.cjs && \
    echo '      // Notificar outros na sala que um novo cliente entrou' >> index-compat.cjs && \
    echo '      socket.to(data.sessionId).emit("user-joined", {' >> index-compat.cjs && \
    echo '        socketId: socket.id,' >> index-compat.cjs && \
    echo '        sessionId: data.sessionId,' >> index-compat.cjs && \
    echo '        timestamp: Date.now()' >> index-compat.cjs && \
    echo '      });' >> index-compat.cjs && \
    echo '    }' >> index-compat.cjs && \
    echo '  });' >> index-compat.cjs && \
    echo '  ' >> index-compat.cjs && \
    echo '  // Manipular rotação específica de representantes' >> index-compat.cjs && \
    echo '  socket.on("representative_rotated", (data) => {' >> index-compat.cjs && \
    echo '    if (data && data.sessionId && data.representativeId) {' >> index-compat.cjs && \
    echo '      const numericRotation = typeof data.rotation === "object" ? data.rotation.y || 0 : Number(data.rotation);' >> index-compat.cjs && \
    echo '      ' >> index-compat.cjs && \
    echo '      console.log(`[${socket.id}] Rotação de representante recebida para ID ${data.representativeId} na sessão ${data.sessionId}: ${numericRotation}`);' >> index-compat.cjs && \
    echo '      ' >> index-compat.cjs && \
    echo '      const eventData = {' >> index-compat.cjs && \
    echo '        ...data,' >> index-compat.cjs && \
    echo '        rotation: numericRotation,' >> index-compat.cjs && \
    echo '        forwardedBy: socket.id,' >> index-compat.cjs && \
    echo '        timestamp: Date.now()' >> index-compat.cjs && \
    echo '      };' >> index-compat.cjs && \
    echo '      ' >> index-compat.cjs && \
    echo '      socket.to(data.sessionId).emit("representative_rotated", eventData);' >> index-compat.cjs && \
    echo '    }' >> index-compat.cjs && \
    echo '  });' >> index-compat.cjs && \
    echo '  ' >> index-compat.cjs && \
    echo '  // Manipular sincronização completa de representantes' >> index-compat.cjs && \
    echo '  socket.on("representatives_updated", (data) => {' >> index-compat.cjs && \
    echo '    if (data && data.sessionId && data.representatives) {' >> index-compat.cjs && \
    echo '      console.log(`[${socket.id}] Atualização completa de representantes para sessão ${data.sessionId}: ${data.representatives.length} representantes`);' >> index-compat.cjs && \
    echo '      ' >> index-compat.cjs && \
    echo '      socket.to(data.sessionId).emit("representatives_updated", {' >> index-compat.cjs && \
    echo '        ...data,' >> index-compat.cjs && \
    echo '        forwardedBy: socket.id,' >> index-compat.cjs && \
    echo '        timestamp: Date.now()' >> index-compat.cjs && \
    echo '      });' >> index-compat.cjs && \
    echo '    }' >> index-compat.cjs && \
    echo '  });' >> index-compat.cjs && \
    echo '  ' >> index-compat.cjs && \
    echo '  // Lidar com desconexão do cliente' >> index-compat.cjs && \
    echo '  socket.on("disconnect", () => {' >> index-compat.cjs && \
    echo '    console.log(`Cliente desconectado: ${socket.id}`);' >> index-compat.cjs && \
    echo '  });' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Iniciar o servidor com verificação de APIs externas
RUN echo '// Iniciar o servidor' >> index-compat.cjs && \
    echo 'server.listen(PORT, () => {' >> index-compat.cjs && \
    echo '  console.log(`Servidor rodando na porta ${PORT} com suporte a Socket.IO`);' >> index-compat.cjs && \
    echo '  console.log(`Ambiente: ${process.env.NODE_ENV}`);' >> index-compat.cjs && \
    echo '  console.log(`OpenAI ativada: ${!!process.env.OPENAI_API_KEY}`);' >> index-compat.cjs && \
    echo '  console.log(`Daily.co ativado: ${!!process.env.DAILY_API_KEY}`);' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Criar auth.routes.cjs usando echo em vez de heredoc
RUN echo 'const express = require("express");' > /app/src-cjs/routes/auth.routes.cjs && \
    echo 'const { validateRefreshToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo 'const { login, refreshToken, register } = require("../controllers/auth.controller.cjs");' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '/**' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @route POST /login' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @desc Autenticar usuário e retornar token' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @access Público' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' */' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo 'router.post("/", login);' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '/**' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @route POST /login/refresh' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @desc Atualizar token de acesso usando refresh token' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @access Público' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' */' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo 'router.post("/refresh", validateRefreshToken, refreshToken);' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '/**' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @route POST /login/register' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @desc Registrar um novo usuário' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' * @access Público' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo ' */' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo 'router.post("/register", register);' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo '' >> /app/src-cjs/routes/auth.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/auth.routes.cjs

# Criar therapist.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/therapist.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo '' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo '// Rota básica para terapeutas' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo 'router.get("/", validateToken, (req, res) => {' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo '  res.json({ message: "Lista de terapeutas - rota funcionando" });' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo '});' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo '' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/therapist.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/therapist.routes.cjs

# Substituir a forma antiga de criar o arquivo auth.controller.cjs por um método mais robusto
RUN echo 'const jwt = require("jsonwebtoken");' > /app/src-cjs/controllers/auth.controller.cjs && \
    echo 'const bcrypt = require("bcryptjs");' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo 'const prisma = require("../utils/prisma.cjs");' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '// Função para autenticar usuário e gerar token' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo 'exports.login = async (req, res) => {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const { email, password } = req.body;' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Validar entradas' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    if (!email || !password) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      return res.status(400).json({ message: "Email e senha são obrigatórios" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Buscar usuário no banco de dados' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const user = await prisma.user.findUnique({' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      where: { email },' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      include: {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '        therapist: true,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '        client: true' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    if (!user) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      return res.status(401).json({ message: "Credenciais inválidas" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Verificar senha' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const isPasswordValid = await bcrypt.compare(password, user.password);' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    if (!isPasswordValid) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      return res.status(401).json({ message: "Credenciais inválidas" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Gerar tokens' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const token = jwt.sign(' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { id: user.id, email: user.email, role: user.role },' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      process.env.JWT_SECRET,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { expiresIn: "1h" }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    );' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const refreshToken = jwt.sign(' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { id: user.id, email: user.email, role: user.role },' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { expiresIn: "7d" }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    );' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Remover senha do objeto de resposta' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const { password: _, ...userWithoutPassword } = user;' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Retornar dados do usuário e tokens' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    return res.status(200).json({' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      user: userWithoutPassword,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      token,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      refreshToken' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    console.error("Erro ao fazer login:", error);' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '// Função para renovar o token de acesso usando refresh token' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo 'exports.refreshToken = (req, res) => {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Gerar novo token de acesso' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const token = jwt.sign(' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { id: req.user.id, email: req.user.email, role: req.user.role },' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      process.env.JWT_SECRET,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { expiresIn: "1h" }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    );' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Retornar novo token' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    return res.status(200).json({ token });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    console.error("Erro ao renovar token:", error);' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '// Função para registrar novo usuário' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo 'exports.register = async (req, res) => {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const { name, email, password, role } = req.body;' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Validar entradas' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    if (!name || !email || !password || !role) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      return res.status(400).json({ message: "Todos os campos são obrigatórios" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Verificar se usuário já existe' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const existingUser = await prisma.user.findUnique({' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      where: { email }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    if (existingUser) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      return res.status(400).json({ message: "Este email já está em uso" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Criptografar senha' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const salt = await bcrypt.genSalt(10);' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const hashedPassword = await bcrypt.hash(password, salt);' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Criar usuário' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const newUser = await prisma.user.create({' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '        name,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '        email,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '        password: hashedPassword,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '        role' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Remover senha do objeto de resposta' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const { password: _, ...userWithoutPassword } = newUser;' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Gerar tokens' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const token = jwt.sign(' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { id: newUser.id, email: newUser.email, role: newUser.role },' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      process.env.JWT_SECRET,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { expiresIn: "1h" }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    );' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    const refreshToken = jwt.sign(' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { id: newUser.id, email: newUser.email, role: newUser.role },' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      { expiresIn: "7d" }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    );' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    // Retornar dados do novo usuário e tokens' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    return res.status(201).json({' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      user: userWithoutPassword,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      token,' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '      refreshToken' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    console.error("Erro ao registrar usuário:", error);' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/auth.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/auth.controller.cjs

# Comando para iniciar usando a versão CommonJS compatível
CMD /bin/sh -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node index-compat.cjs" 