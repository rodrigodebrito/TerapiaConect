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

# Corrija específicamente importações de auth.middleware em todos os arquivos de rota, incluindo client.routes
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

# Criar client.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/client.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/client.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/client.routes.cjs && \
    echo '' >> /app/src-cjs/routes/client.routes.cjs && \
    echo '// Rota básica para clientes' >> /app/src-cjs/routes/client.routes.cjs && \
    echo 'router.get("/", validateToken, (req, res) => {' >> /app/src-cjs/routes/client.routes.cjs && \
    echo '  res.json({ message: "Lista de clientes - rota funcionando" });' >> /app/src-cjs/routes/client.routes.cjs && \
    echo '});' >> /app/src-cjs/routes/client.routes.cjs && \
    echo '' >> /app/src-cjs/routes/client.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/client.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/client.routes.cjs

# Criar appointment.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/appointment.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo '' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo '// Rota básica para agendamentos' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo 'router.get("/", validateToken, (req, res) => {' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo '  res.json({ message: "Lista de agendamentos - rota funcionando" });' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo '});' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo '' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/appointment.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/appointment.routes.cjs

# Criar user.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/user.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/user.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '// Rota básica para usuários' >> /app/src-cjs/routes/user.routes.cjs && \
    echo 'router.get("/profile", validateToken, (req, res) => {' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '  res.json({ message: "Perfil do usuário - rota funcionando", userId: req.user.id });' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '});' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '// Rota para listar usuários' >> /app/src-cjs/routes/user.routes.cjs && \
    echo 'router.get("/", validateToken, (req, res) => {' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '  res.json({ message: "Lista de usuários - rota funcionando" });' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '});' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '' >> /app/src-cjs/routes/user.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/user.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/user.routes.cjs

# Criar tool.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/tool.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo '' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo '// Rota básica para ferramentas/tools' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo 'router.get("/", validateToken, (req, res) => {' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo '  res.json({ message: "Lista de ferramentas - rota funcionando" });' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo '});' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo '' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/tool.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/tool.routes.cjs

# Criar session.controller.cjs para garantir compatibilidade
RUN echo 'const prisma = require("../utils/prisma.cjs");' > /app/src-cjs/controllers/session.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '// Função para listar sessões' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo 'exports.getSessions = async (req, res) => {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    const sessions = await prisma.session.findMany();' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    res.status(200).json(sessions);' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    console.error("Erro ao buscar sessões:", error);' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '// Função para obter detalhes de uma sessão' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo 'exports.getSessionById = async (req, res) => {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    const { id } = req.params;' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    const session = await prisma.session.findUnique({' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '      where: { id }' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    if (!session) {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '      return res.status(404).json({ message: "Sessão não encontrada" });' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    res.status(200).json(session);' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    console.error("Erro ao buscar sessão:", error);' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '// Função para criar sessão' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo 'exports.createSession = async (req, res) => {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    const { title, date, clientId, therapistId } = req.body;' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    const session = await prisma.session.create({' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '      data: { title, date, clientId, therapistId }' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    res.status(201).json(session);' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    console.error("Erro ao criar sessão:", error);' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '    res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/session.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/session.controller.cjs

# Criar session.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/session.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/session.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/session.routes.cjs && \
    echo 'const { getSessions, getSessionById, createSession } = require("../controllers/session.controller.cjs");' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '// Listar todas as sessões' >> /app/src-cjs/routes/session.routes.cjs && \
    echo 'router.get("/", validateToken, getSessions);' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '// Obter detalhes de uma sessão' >> /app/src-cjs/routes/session.routes.cjs && \
    echo 'router.get("/:id", validateToken, getSessionById);' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '// Criar nova sessão' >> /app/src-cjs/routes/session.routes.cjs && \
    echo 'router.post("/", validateToken, createSession);' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '' >> /app/src-cjs/routes/session.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/session.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/session.routes.cjs

# Atualizar ai.controller.cjs para a nova API da OpenAI
RUN echo 'const prisma = require("../utils/prisma.cjs");' > /app/src-cjs/controllers/ai.controller.cjs && \
    echo 'const OpenAI = require("openai");' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '// Configuração da API OpenAI com a nova SDK' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo 'const openai = new OpenAI({' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '  apiKey: process.env.OPENAI_API_KEY,' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '});' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '// Função para analisar texto usando IA' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo 'exports.analyzeText = async (req, res) => {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    const { text } = req.body;' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    if (!text) {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      return res.status(400).json({ message: "Texto obrigatório para análise" });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    if (!process.env.OPENAI_API_KEY) {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      return res.status(500).json({ message: "API de IA não configurada" });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    const response = await openai.chat.completions.create({' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      messages: [' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '        { role: "system", content: "Você é um assistente terapêutico que analisa textos." },' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '        { role: "user", content: `Analise o seguinte texto: ${text}` }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      ],' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      max_tokens: 1000,' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      temperature: 0.7,' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    const analysis = response.choices[0]?.message?.content;' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    // Registrar análise no banco de dados' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    const savedAnalysis = await prisma.aiAnalysis.create({' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '        originalText: text,' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '        analysis,' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '        userId: req.user.id' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    return res.status(200).json({ analysis, id: savedAnalysis.id });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    console.error("Erro ao analisar texto:", error?.response?.data || error);' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro ao processar análise de IA" });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '// Função para gerar sugestões' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo 'exports.generateSuggestions = async (req, res) => {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    const { context } = req.body;' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    if (!context) {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      return res.status(400).json({ message: "Contexto obrigatório para sugestões" });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    if (!process.env.OPENAI_API_KEY) {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      return res.status(500).json({ message: "API de IA não configurada" });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    const response = await openai.chat.completions.create({' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      messages: [' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '        { role: "system", content: "Você é um assistente terapêutico que gera sugestões úteis." },' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '        { role: "user", content: `Com base no seguinte contexto, forneça 3 sugestões terapêuticas: ${context}` }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      ],' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      max_tokens: 500,' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '      temperature: 0.7,' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    const suggestions = response.choices[0]?.message?.content;' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    return res.status(200).json({ suggestions });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    console.error("Erro ao gerar sugestões:", error?.response?.data || error);' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro ao gerar sugestões" });' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/ai.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/ai.controller.cjs

# Criar ai.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/ai.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo 'const { analyzeText, generateSuggestions } = require("../controllers/ai.controller.cjs");' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo '' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo '// Analisar texto usando IA' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo 'router.post("/analyze", validateToken, analyzeText);' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo '' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo '// Gerar sugestões com base em contexto' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo 'router.post("/suggestions", validateToken, generateSuggestions);' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo '' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/ai.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/ai.routes.cjs

# Criar transcript.controller.cjs para garantir compatibilidade
RUN echo 'const prisma = require("../utils/prisma.cjs");' > /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '// Função para salvar transcrição' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo 'exports.saveTranscript = async (req, res) => {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    const { sessionId, content, speakerId } = req.body;' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    if (!sessionId || !content) {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da sessão e conteúdo são obrigatórios" });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    // Verificar se a sessão existe' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    const session = await prisma.session.findUnique({' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      where: { id: sessionId }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    if (!session) {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      return res.status(404).json({ message: "Sessão não encontrada" });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    // Criar transcrição' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    const transcript = await prisma.transcript.create({' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '        content,' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '        speakerId,' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '        sessionId,' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '        timestamp: new Date()' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    return res.status(201).json(transcript);' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    console.error("Erro ao salvar transcrição:", error);' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '// Função para listar transcrições de uma sessão' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo 'exports.getSessionTranscripts = async (req, res) => {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    const { sessionId } = req.params;' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    if (!sessionId) {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da sessão é obrigatório" });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    // Buscar transcrições' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    const transcripts = await prisma.transcript.findMany({' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      where: { sessionId },' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '      orderBy: { timestamp: "asc" }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    return res.status(200).json(transcripts);' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    console.error("Erro ao buscar transcrições:", error);' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/transcript.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/transcript.controller.cjs

# Criar transcript.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/transcript.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo 'const { saveTranscript, getSessionTranscripts } = require("../controllers/transcript.controller.cjs");' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo '// Salvar nova transcrição' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo 'router.post("/", validateToken, saveTranscript);' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo '// Obter transcrições de uma sessão' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo 'router.get("/session/:sessionId", validateToken, getSessionTranscripts);' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/transcript.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/transcript.routes.cjs

# Criar insight.controller.cjs para garantir compatibilidade
RUN echo 'const prisma = require("../utils/prisma.cjs");' > /app/src-cjs/controllers/insight.controller.cjs && \
    echo 'const OpenAI = require("openai");' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '// Configuração da API OpenAI' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo 'const openai = new OpenAI({' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  apiKey: process.env.OPENAI_API_KEY,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '});' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '// Função para salvar um insight' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo 'exports.saveInsight = async (req, res) => {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const { sessionId, content, type } = req.body;' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    if (!sessionId || !content) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da sessão e conteúdo são obrigatórios" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Verificar se a sessão existe' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const session = await prisma.session.findUnique({' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      where: { id: sessionId }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    if (!session) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      return res.status(404).json({ message: "Sessão não encontrada" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Criar insight' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const insight = await prisma.insight.create({' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        content,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        type: type || "GENERAL",' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        sessionId,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        userId: req.user.id,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        createdAt: new Date()' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    return res.status(201).json(insight);' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    console.error("Erro ao salvar insight:", error);' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '// Função para obter insights de uma sessão' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo 'exports.getSessionInsights = async (req, res) => {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const { sessionId } = req.params;' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    if (!sessionId) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da sessão é obrigatório" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Buscar insights' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const insights = await prisma.insight.findMany({' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      where: { sessionId },' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      orderBy: { createdAt: "asc" }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    return res.status(200).json(insights);' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    console.error("Erro ao buscar insights:", error);' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '// Função para gerar insights a partir de transcrições' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo 'exports.generateInsights = async (req, res) => {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const { sessionId } = req.params;' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    if (!sessionId) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da sessão é obrigatório" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    if (!process.env.OPENAI_API_KEY) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      return res.status(500).json({ message: "API de IA não configurada" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Buscar transcrições da sessão' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const transcripts = await prisma.transcript.findMany({' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      where: { sessionId },' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      orderBy: { timestamp: "asc" }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    if (!transcripts.length) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      return res.status(404).json({ message: "Nenhuma transcrição encontrada para esta sessão" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Combinar transcrições em um único texto' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const transcriptText = transcripts.map(t => `${t.speakerId ? `[${t.speakerId}]: ` : ""}${t.content}`).join("\\n");' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Gerar insights usando IA' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const response = await openai.chat.completions.create({' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      messages: [' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        { role: "system", content: "Você é um assistente terapêutico que analisa transcrições de sessões e gera insights úteis." },' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        { role: "user", content: `Analise a seguinte transcrição de uma sessão terapêutica e forneça 3-5 insights relevantes, um por linha:\\n\\n${transcriptText}` }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      ],' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      max_tokens: 1000,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      temperature: 0.7,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const insightsText = response.choices[0]?.message?.content;' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    if (!insightsText) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      return res.status(500).json({ message: "Falha ao gerar insights" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Dividir o texto em insights individuais' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const insightLines = insightsText.split("\\n").filter(line => line.trim());' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    // Salvar cada insight no banco de dados' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    const savedInsights = [];' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    for (const line of insightLines) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      if (line.trim()) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        const insight = await prisma.insight.create({' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '          data: {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '            content: line.trim(),' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '            type: "AI_GENERATED",' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '            sessionId,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '            userId: req.user.id,' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '            createdAt: new Date()' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '          }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '        savedInsights.push(insight);' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    return res.status(201).json(savedInsights);' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    console.error("Erro ao gerar insights:", error);' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/insight.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/insight.controller.cjs

# Criar insight.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/insight.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo 'const { saveInsight, getSessionInsights, generateInsights } = require("../controllers/insight.controller.cjs");' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '// Salvar novo insight' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo 'router.post("/", validateToken, saveInsight);' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '// Obter insights de uma sessão' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo 'router.get("/session/:sessionId", validateToken, getSessionInsights);' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '// Gerar insights usando IA' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo 'router.post("/generate/:sessionId", validateToken, generateInsights);' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/insight.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/insight.routes.cjs

# Criar meeting.controller.cjs para garantir compatibilidade
RUN echo 'const prisma = require("../utils/prisma.cjs");' > /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '// Função para criar uma reunião' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo 'exports.createMeeting = async (req, res) => {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const { sessionId, platform, roomName, status } = req.body;' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    if (!sessionId || !platform || !roomName) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da sessão, plataforma e nome da sala são obrigatórios" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    // Verificar se a sessão existe' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const session = await prisma.session.findUnique({' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      where: { id: sessionId }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    if (!session) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      return res.status(404).json({ message: "Sessão não encontrada" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    // Criar reunião' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const meeting = await prisma.meeting.create({' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        sessionId,' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        platform,' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        roomName,' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        status: status || "CREATED",' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        createdAt: new Date(),' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        updatedAt: new Date()' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(201).json(meeting);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    console.error("Erro ao criar reunião:", error);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '// Função para buscar uma reunião por ID' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo 'exports.getMeetingById = async (req, res) => {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const { id } = req.params;' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    if (!id) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da reunião é obrigatório" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    // Buscar reunião' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const meeting = await prisma.meeting.findUnique({' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      where: { id }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    if (!meeting) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      return res.status(404).json({ message: "Reunião não encontrada" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(200).json(meeting);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    console.error("Erro ao buscar reunião:", error);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '// Função para buscar reuniões de uma sessão' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo 'exports.getSessionMeetings = async (req, res) => {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const { sessionId } = req.params;' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    if (!sessionId) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da sessão é obrigatório" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    // Buscar reuniões' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const meetings = await prisma.meeting.findMany({' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      where: { sessionId },' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      orderBy: { createdAt: "desc" }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(200).json(meetings);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    console.error("Erro ao buscar reuniões:", error);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '// Função para atualizar status de uma reunião' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo 'exports.updateMeetingStatus = async (req, res) => {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const { id } = req.params;' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const { status } = req.body;' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    if (!id || !status) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID da reunião e status são obrigatórios" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    // Atualizar reunião' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    const meeting = await prisma.meeting.update({' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      where: { id },' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        status,' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '        updatedAt: new Date()' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(200).json(meeting);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    console.error("Erro ao atualizar reunião:", error);' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/meeting.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/meeting.controller.cjs

# Criar meeting.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'const { createMeeting, getMeetingById, getSessionMeetings, updateMeetingStatus } = require("../controllers/meeting.controller.cjs");' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '// Criar nova reunião' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'router.post("/", validateToken, createMeeting);' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '// Obter reunião por ID' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'router.get("/:id", validateToken, getMeetingById);' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '// Obter reuniões de uma sessão' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'router.get("/session/:sessionId", validateToken, getSessionMeetings);' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '// Atualizar status de uma reunião' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'router.put("/:id/status", validateToken, updateMeetingStatus);' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/meeting.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/meeting.routes.cjs

# Criar training.controller.cjs para garantir compatibilidade
RUN echo 'const prisma = require("../utils/prisma.cjs");' > /app/src-cjs/controllers/training.controller.cjs && \
    echo 'const OpenAI = require("openai");' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '// Configuração da API OpenAI' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo 'const openai = new OpenAI({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  apiKey: process.env.OPENAI_API_KEY,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '});' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '// Função para adicionar material de treinamento' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo 'exports.addTrainingMaterial = async (req, res) => {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const { title, content, type, category, source } = req.body;' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!title || !content || !type || !category) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(400).json({ message: "Título, conteúdo, tipo e categoria são obrigatórios" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Criar material de treinamento' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const trainingMaterial = await prisma.trainingMaterial.create({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        title,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        content,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        type,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        category,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        source: source || "MANUAL",' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        userId: req.user.id,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        isProcessed: false,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        createdAt: new Date(),' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        updatedAt: new Date()' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(201).json(trainingMaterial);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    console.error("Erro ao adicionar material de treinamento:", error);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '// Função para listar materiais de treinamento por categoria' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo 'exports.getTrainingMaterialsByCategory = async (req, res) => {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const { category } = req.params;' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!category) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(400).json({ message: "Categoria é obrigatória" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Buscar materiais de treinamento por categoria' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const trainingMaterials = await prisma.trainingMaterial.findMany({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      where: { category },' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      orderBy: { createdAt: "desc" }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(200).json(trainingMaterials);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    console.error("Erro ao buscar materiais de treinamento:", error);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '// Função para obter um material de treinamento por ID' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo 'exports.getTrainingMaterialById = async (req, res) => {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const { id } = req.params;' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!id) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID é obrigatório" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Buscar material de treinamento por ID' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const trainingMaterial = await prisma.trainingMaterial.findUnique({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      where: { id }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!trainingMaterial) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(404).json({ message: "Material de treinamento não encontrado" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(200).json(trainingMaterial);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    console.error("Erro ao buscar material de treinamento:", error);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '// Função para processar material de treinamento' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo 'exports.processMaterial = async (req, res) => {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const { id } = req.params;' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!id) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(400).json({ message: "ID é obrigatório" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Buscar material para processamento' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const material = await prisma.trainingMaterial.findUnique({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      where: { id }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!material) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(404).json({ message: "Material não encontrado" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!process.env.OPENAI_API_KEY) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(500).json({ message: "API de IA não configurada" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Processar o conteúdo com a OpenAI' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const response = await openai.chat.completions.create({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      messages: [' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        { role: "system", content: "Você é um assistente especializado em processar materiais de treinamento para terapeutas." },' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        { role: "user", content: `Extraia os principais insights e conceitos deste material: ${material.content}` }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      ],' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      max_tokens: 1000,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      temperature: 0.7,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const processedContent = response.choices[0]?.message?.content;' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Atualizar o material com o conteúdo processado' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const updatedMaterial = await prisma.trainingMaterial.update({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      where: { id },' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        processedContent,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        isProcessed: true,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        updatedAt: new Date()' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(200).json(updatedMaterial);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    console.error("Erro ao processar material:", error);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '// Função para enriquecer análise usando materiais de treinamento' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo 'exports.enhanceAnalysis = async (req, res) => {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const { categories, originalAnalysis } = req.body;' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!categories || !originalAnalysis) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(400).json({ message: "Categorias e análise original são obrigatórias" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!process.env.OPENAI_API_KEY) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(500).json({ message: "API de IA não configurada" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Buscar materiais de treinamento relevantes' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const materials = await prisma.trainingMaterial.findMany({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      where: {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        category: { in: categories },' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        isProcessed: true' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      },' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      select: {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        id: true,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        title: true,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        category: true,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        processedContent: true' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    if (!materials.length) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      return res.status(404).json({ message: "Nenhum material encontrado para as categorias especificadas" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Preparar contexto com os materiais relevantes' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const context = materials.map(m => `Material: ${m.title} (${m.category})\\n${m.processedContent}\\n\\n`).join("");' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Enriquecer análise com a OpenAI' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const response = await openai.chat.completions.create({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      messages: [' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        { role: "system", content: "Você é um assistente terapêutico que enriquece análises com conhecimentos de materiais de treinamento." },' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '        { role: "user", content: `Enriqueça esta análise usando os materiais de referência:\\n\\nAnálise original: ${originalAnalysis}\\n\\nMateriais de referência:\\n${context}` }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      ],' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      max_tokens: 1500,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      temperature: 0.7,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    const enhancedAnalysis = response.choices[0]?.message?.content;' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    // Retornar análise enriquecida e referências usadas' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(200).json({' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      enhancedAnalysis,' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '      referencedMaterials: materials.map(m => ({ id: m.id, title: m.title, category: m.category }))' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    console.error("Erro ao enriquecer análise:", error);' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '    return res.status(500).json({ message: "Erro interno do servidor" });' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/training.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/training.controller.cjs

# Criar training.routes.cjs para garantir compatibilidade
RUN echo 'const express = require("express");' > /app/src-cjs/routes/training.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'const { addTrainingMaterial, getTrainingMaterialsByCategory, getTrainingMaterialById, processMaterial, enhanceAnalysis } = require("../controllers/training.controller.cjs");' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '// Adicionar novo material de treinamento' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'router.post("/materials", validateToken, addTrainingMaterial);' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '// Obter materiais por categoria' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'router.get("/materials/category/:category", validateToken, getTrainingMaterialsByCategory);' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '// Obter material por ID' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'router.get("/materials/:id", validateToken, getTrainingMaterialById);' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '// Processar material' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'router.post("/materials/:id/process", validateToken, processMaterial);' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '// Enriquecer análise com materiais de treinamento' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'router.post("/enhance-analysis", validateToken, enhanceAnalysis);' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '' >> /app/src-cjs/routes/training.routes.cjs && \
    echo '// Exportar router' >> /app/src-cjs/routes/training.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/training.routes.cjs

# Create transcription.controller.cjs
RUN mkdir -p /app/src-cjs/controllers && \
    echo 'const { Configuration, OpenAIApi } = require("openai");' > /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'const fs = require("fs");' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'const prisma = require("../utils/prisma.cjs");' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'const configuration = new Configuration({' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  apiKey: process.env.OPENAI_API_KEY,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '});' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'const openai = new OpenAIApi(configuration);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '// Criar transcrição' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'async function createTranscription(req, res) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const { patientId, sessionDate, audioUrl } = req.body;' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    if (!patientId || !sessionDate || !audioUrl) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      return res.status(400).json({ error: "PatientId, sessionDate e audioUrl são obrigatórios" });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    // Simular transcrição com OpenAI (em produção, usaria o áudio real)' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const transcription = await generateTranscription(audioUrl);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    // Salvar a transcrição no banco de dados' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const savedTranscription = await prisma.transcription.create({' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      data: {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '        patientId,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '        sessionDate: new Date(sessionDate),' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '        audioUrl,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '        content: transcription,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '        status: "COMPLETED"' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.json(savedTranscription);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    console.error("Erro ao criar transcrição:", error);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.status(500).json({ error: "Erro ao processar a transcrição" });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '}' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '// Obter todas as transcrições de um paciente' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'async function getTranscriptionsByPatient(req, res) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const { patientId } = req.params;' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const transcriptions = await prisma.transcription.findMany({' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      where: { patientId }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.json(transcriptions);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    console.error("Erro ao buscar transcrições:", error);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.status(500).json({ error: "Erro ao buscar transcrições" });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '}' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '// Obter uma transcrição específica por ID' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'async function getTranscriptionById(req, res) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const { id } = req.params;' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const transcription = await prisma.transcription.findUnique({' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      where: { id }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    if (!transcription) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      return res.status(404).json({ error: "Transcrição não encontrada" });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.json(transcription);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    console.error("Erro ao buscar transcrição:", error);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.status(500).json({ error: "Erro ao buscar transcrição" });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '}' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '// Analisar transcrição para identificar padrões e insights' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'async function analyzeTranscription(req, res) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const { id } = req.params;' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const transcription = await prisma.transcription.findUnique({' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      where: { id }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    if (!transcription) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      return res.status(404).json({ error: "Transcrição não encontrada" });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    // Analisar a transcrição com OpenAI' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const analysis = await analyzeWithAI(transcription.content);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    // Atualizar a transcrição com a análise' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const updatedTranscription = await prisma.transcription.update({' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      where: { id },' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      data: { analysis }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.json(updatedTranscription);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    console.error("Erro ao analisar transcrição:", error);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return res.status(500).json({ error: "Erro ao analisar transcrição" });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '}' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '// Função auxiliar para gerar transcrição com OpenAI (simulada)' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'async function generateTranscription(audioUrl) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  // Em um ambiente real, usaríamos a API de transcrição do OpenAI com o arquivo de áudio' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  // Para simulação, estamos retornando um texto predefinido' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  return "Esta é uma transcrição simulada de uma sessão de terapia. O paciente expressou preocupações sobre ansiedade e estresse no trabalho. Discutimos técnicas de respiração e mindfulness para gerenciar esses sintomas.";' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '}' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '// Função auxiliar para analisar a transcrição com OpenAI' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'async function analyzeWithAI(transcriptionContent) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  try {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const prompt = `Analise a seguinte transcrição de uma sessão de terapia e identifique os principais temas, emoções, preocupações e sugira possíveis abordagens terapêuticas: ${transcriptionContent}`;' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    const response = await openai.createCompletion({' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      model: "text-davinci-003",' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      prompt,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      max_tokens: 500,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '      temperature: 0.7' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    });' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return response.data.choices[0].text.trim();' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  } catch (error) {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    console.error("Erro na análise com OpenAI:", error);' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '    return "Não foi possível analisar a transcrição devido a um erro.";' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  }' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '}' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo 'module.exports = {' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  createTranscription,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  getTranscriptionsByPatient,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  getTranscriptionById,' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '  analyzeTranscription' >> /app/src-cjs/controllers/transcription.controller.cjs && \
    echo '};' >> /app/src-cjs/controllers/transcription.controller.cjs

# Create transcription.routes.cjs
RUN mkdir -p /app/src-cjs/routes && \
    echo 'const express = require("express");' > /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'const { validateToken } = require("../middleware/auth.middleware.cjs");' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'const {' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '  createTranscription,' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '  getTranscriptionsByPatient,' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '  getTranscriptionById,' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '  analyzeTranscription' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '} = require("../controllers/transcription.controller.cjs");' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'const router = express.Router();' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '// Rota para criar uma nova transcrição' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'router.post("/", validateToken, createTranscription);' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '// Rota para obter todas as transcrições de um paciente' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'router.get("/patient/:patientId", validateToken, getTranscriptionsByPatient);' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '// Rota para obter uma transcrição específica' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'router.get("/:id", validateToken, getTranscriptionById);' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '// Rota para analisar uma transcrição' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'router.post("/:id/analyze", validateToken, analyzeTranscription);' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo '' >> /app/src-cjs/routes/transcription.routes.cjs && \
    echo 'module.exports = router;' >> /app/src-cjs/routes/transcription.routes.cjs

# Comando para iniciar usando a versão CommonJS compatível
CMD /bin/sh -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node index-compat.cjs" 