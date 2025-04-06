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

# Converter arquivos de rotas de ESM para CommonJS
RUN for file in $(find ./src/routes -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export default/module.exports =/' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.js"/g' \
            -e 's/\.js'"'"'/.js'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Converter arquivos de controllers de ESM para CommonJS
RUN for file in $(find ./src/controllers -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Converter arquivos de middleware de ESM para CommonJS
RUN for file in $(find ./src/middleware -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Converter arquivos de utils de ESM para CommonJS
RUN for file in $(find ./src/utils -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Converter arquivos de services de ESM para CommonJS
RUN for file in $(find ./src/services -name "*.js"); do \
        filename=$(basename "$file"); \
        dirname=$(dirname "$file" | sed 's/\.\/src/\/app\/src-cjs/g'); \
        mkdir -p "$dirname"; \
        sed -e 's/export const/exports./' \
            -e 's/export default/module.exports =/' \
            -e 's/import \(.*\) from \(.*\);/const \1 = require(\2);/g' \
            -e 's/import {/const {/g' \
            -e 's/} from \(.*\);/} = require(\1);/g' \
            -e 's/\.js"/.cjs"/g' \
            -e 's/\.js'"'"'/.cjs'"'"'/g' \
            "$file" > "${dirname}/${filename%.js}.cjs"; \
    done

# Verificar e corrigir manualmente alguns arquivos CommonJS críticos
RUN sed -i 's/\.js"/.cjs"/g' /app/src-cjs/routes/*.cjs && \
    sed -i 's/\.js'"'"'/.cjs'"'"'/g' /app/src-cjs/routes/*.cjs && \
    sed -i 's/import/const/g' /app/src-cjs/routes/*.cjs || true

# Criar arquivo index-compat.cjs para compatibilidade
RUN echo 'require("dotenv").config();' > index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo 'const express = require("express");' >> index-compat.cjs && \
    echo 'const cors = require("cors");' >> index-compat.cjs && \
    echo 'const bodyParser = require("body-parser");' >> index-compat.cjs && \
    echo 'const morgan = require("morgan");' >> index-compat.cjs && \
    echo 'const path = require("path");' >> index-compat.cjs && \
    echo 'const http = require("http");' >> index-compat.cjs && \
    echo 'const { Server: SocketIO } = require("socket.io");' >> index-compat.cjs

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
    echo 'const clientRoutes = require("./src-cjs/routes/client.routes.cjs");' >> index-compat.cjs && \
    echo 'const appointmentRoutes = require("./src-cjs/routes/appointment.routes.cjs");' >> index-compat.cjs && \
    echo 'const userRoutes = require("./src-cjs/routes/user.routes.cjs");' >> index-compat.cjs && \
    echo 'const toolRoutes = require("./src-cjs/routes/tool.routes.cjs");' >> index-compat.cjs && \
    echo 'const uploadRoutes = require("./src-cjs/routes/upload.routes.cjs");' >> index-compat.cjs && \
    echo 'const sessionRoutes = require("./src-cjs/routes/session.routes.cjs");' >> index-compat.cjs && \
    echo 'const aiRoutes = require("./src-cjs/routes/ai.routes.cjs");' >> index-compat.cjs && \
    echo 'const transcriptRoutes = require("./src-cjs/routes/transcript.routes.cjs");' >> index-compat.cjs && \
    echo 'const insightRoutes = require("./src-cjs/routes/insight.routes.cjs");' >> index-compat.cjs && \
    echo 'const meetingRoutes = require("./src-cjs/routes/meeting.routes.cjs");' >> index-compat.cjs && \
    echo 'const trainingRoutes = require("./src-cjs/routes/training.routes.cjs");' >> index-compat.cjs && \
    echo 'const transcriptionRoutes = require("./src-cjs/routes/transcription.routes.cjs");' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Configuração e inicialização do aplicativo
RUN echo '// Configuração da aplicação' >> index-compat.cjs && \
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
    echo 'global.io = io;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs

# Configurar middleware
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

# Configurar rotas
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

# Adicionar Socket.IO e inicialização do servidor
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
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Iniciar o servidor' >> index-compat.cjs && \
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

# Comando para iniciar usando a versão CommonJS compatível
CMD /bin/sh -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node index-compat.cjs" 