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

# Corrija específicamente importações de auth.middleware em todos os arquivos de rota
RUN find /app/src-cjs/routes -name "*.cjs" -exec sed -i 's/require("..\/middleware\/auth.middleware")/require("..\/middleware\/auth.middleware.cjs")/g' {} \;
RUN find /app/src-cjs/routes -name "*.cjs" -exec sed -i 's/require("..\/src-cjs\/middleware\/auth.middleware")/require("..\/middleware\/auth.middleware.cjs")/g' {} \;
RUN find /app/src-cjs/routes -name "*.cjs" -exec sed -i 's/require("..\/controllers\/[^"]*")/require("..\/controllers\/\$2.cjs")/g' {} \;

# Criar manualmente arquivos de módulos essenciais
RUN mkdir -p /app/src-cjs/middleware

# Criar arquivos de middleware e controller para auth manualmente
RUN mkdir -p /app/src-cjs/middleware /app/src-cjs/controllers

# Substituir a forma antiga de criar o arquivo auth.middleware.cjs por um método mais robusto
RUN echo 'const jwt = require("jsonwebtoken");' > /app/src-cjs/middleware/auth.middleware.cjs && \
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

# Substituir a forma antiga de criar o arquivo auth.controller.cjs por um método mais robusto
RUN echo 'const jwt = require("jsonwebtoken");' > /app/src-cjs/controllers/auth.controller.cjs && \
    echo 'const bcrypt = require("bcryptjs");' >> /app/src-cjs/controllers/auth.controller.cjs && \
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

# Criar therapist.routes.cjs usando echo em vez de heredoc
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

# Corrigir importações em todos os arquivos de rota
RUN find /app/src-cjs/routes -name "*.cjs" -type f -exec sed -i "s/require('..\/middleware\/auth.middleware')/require('..\/middleware\/auth.middleware.cjs')/g" {} \;
RUN find /app/src-cjs/routes -name "*.cjs" -type f -exec sed -i 's/require("..\/middleware\/auth.middleware")/require("..\/middleware\/auth.middleware.cjs")/g' {} \;

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
    echo '' >> index-compat.cjs

# Configuração e inicialização do aplicativo
RUN echo '// Configuração da aplicação' >> index-compat.cjs && \
    echo 'const app = express();' >> index-compat.cjs && \
    echo 'const PORT = process.env.PORT || 3000;' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Criar servidor HTTP com Express' >> index-compat.cjs && \
    echo 'const server = http.createServer(app);' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Middleware' >> index-compat.cjs && \
    echo 'app.use(cors());' >> index-compat.cjs && \
    echo 'app.use(express.json());' >> index-compat.cjs && \
    echo 'app.use(express.urlencoded({ extended: true }));' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Definição das rotas' >> index-compat.cjs && \
    echo 'app.use("/api/auth", authRoutes);' >> index-compat.cjs && \
    echo 'app.use("/api/therapists", therapistRoutes);' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Rota padrão' >> index-compat.cjs && \
    echo 'app.get("/", (req, res) => {' >> index-compat.cjs && \
    echo '  res.send("API da Plataforma Terapeuta - Versão simplificada");' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs && \
    echo '' >> index-compat.cjs && \
    echo '// Iniciar o servidor' >> index-compat.cjs && \
    echo 'server.listen(PORT, () => {' >> index-compat.cjs && \
    echo '  console.log(`Servidor rodando na porta ${PORT}`);' >> index-compat.cjs && \
    echo '});' >> index-compat.cjs

# Copiar arquivo de ambiente Docker para .env
COPY .env.docker .env

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Comando para iniciar usando a versão CommonJS compatível
CMD /bin/sh -c "echo 'Aguardando conexão com o banco de dados...' && npx prisma migrate deploy && echo 'Iniciando o servidor...' && node index-compat.cjs" 