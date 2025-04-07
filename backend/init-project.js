#!/usr/bin/env node

/**
 * Script de inicialização do projeto TerapiaConect
 * 
 * Este script executa as etapas necessárias para configurar o projeto:
 * 1. Instala as dependências
 * 2. Configura o ambiente
 * 3. Executa a conversão para ES Modules
 * 4. Gera o cliente Prisma
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Função para executar comandos e mostrar saída
function runCommand(command, message) {
  console.log(`\n${colors.cyan}${colors.bright}${message}${colors.reset}`);
  console.log(`${colors.dim}> ${command}${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Erro ao executar o comando: ${error.message}${colors.reset}`);
    return false;
  }
}

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Função para criar arquivo .env se não existir
function setupEnvFile() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  const envDockerPath = path.join(__dirname, '.env.docker');
  
  if (!fileExists(envPath)) {
    if (fileExists(envExamplePath)) {
      console.log(`${colors.yellow}Criando arquivo .env a partir de .env.example${colors.reset}`);
      fs.copyFileSync(envExamplePath, envPath);
    } else if (fileExists(envDockerPath)) {
      console.log(`${colors.yellow}Criando arquivo .env a partir de .env.docker${colors.reset}`);
      fs.copyFileSync(envDockerPath, envPath);
    } else {
      console.log(`${colors.yellow}Criando arquivo .env básico${colors.reset}`);
      const basicEnv = `# Configurações do servidor
NODE_ENV=development
PORT=3000

# Banco de dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/terapiaconect

# JWT
JWT_SECRET=jwt_secret_dev_local
JWT_REFRESH_SECRET=jwt_refresh_secret_dev_local
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:5173`;
      
      fs.writeFileSync(envPath, basicEnv);
    }
    
    console.log(`${colors.green}Arquivo .env criado com sucesso!${colors.reset}`);
  } else {
    console.log(`${colors.blue}Arquivo .env já existe.${colors.reset}`);
  }
}

// Função principal
async function init() {
  console.log(`
${colors.cyan}${colors.bright}===============================================
  Inicialização do Projeto TerapiaConect Backend
===============================================${colors.reset}
  
Este script irá configurar o projeto para desenvolvimento.
`);
  
  // Verificar instalação de dependências
  if (!fileExists(path.join(__dirname, 'node_modules'))) {
    if (!runCommand('npm install', 'Instalando dependências...')) {
      console.error(`${colors.red}${colors.bright}Falha ao instalar dependências. Abortando.${colors.reset}`);
      process.exit(1);
    }
  } else {
    console.log(`${colors.blue}Dependências já instaladas.${colors.reset}`);
  }
  
  // Configurar arquivo .env
  setupEnvFile();
  
  // Executar conversão para ES Modules
  if (!runCommand('npm run convert-to-esm', 'Convertendo arquivos para ES Modules...')) {
    console.log(`${colors.yellow}Aviso: Conversão para ES Modules falhou. Isso pode ser normal se o código já estiver em formato ESM.${colors.reset}`);
  }
  
  // Gerar cliente Prisma
  if (!runCommand('npx prisma generate', 'Gerando cliente Prisma...')) {
    console.error(`${colors.red}${colors.bright}Falha ao gerar cliente Prisma. Abortando.${colors.reset}`);
    process.exit(1);
  }
  
  // Criar pasta uploads se não existir
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fileExists(uploadsDir)) {
    console.log(`${colors.yellow}Criando diretório uploads...${colors.reset}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  console.log(`
${colors.green}${colors.bright}✓ Inicialização concluída com sucesso!${colors.reset}

Para iniciar o servidor em modo de desenvolvimento:
${colors.cyan}npm run dev${colors.reset}

Para construir o projeto para produção:
${colors.cyan}npm run build${colors.reset}

Para iniciar o servidor em modo de produção:
${colors.cyan}npm start${colors.reset}
  `);
}

// Executar função principal
init().catch(error => {
  console.error(`${colors.red}${colors.bright}Erro fatal:${colors.reset} ${error.message}`);
  process.exit(1); 