#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Obtém o diretório atual 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de diretórios
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');
const routesDir = path.join(srcDir, 'routes');
const distRoutesDir = path.join(distDir, 'routes');

/**
 * Função para criar um diretório se não existir
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${colors.green}✅ Diretório criado:${colors.reset} ${dir}`);
  }
}

/**
 * Função para limpar o diretório de distribuição
 */
function cleanDistDirectory() {
  console.log(`\n${colors.yellow}🧹 Limpando o diretório de distribuição...${colors.reset}`);
  
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(distDir, file.name);
      
      if (file.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    
    console.log(`${colors.green}✅ Diretório limpo:${colors.reset} ${distDir}`);
  } else {
    ensureDirectoryExists(distDir);
  }
}

/**
 * Função para compilar o código com SWC
 */
function compileWithSWC() {
  console.log(`\n${colors.yellow}🔄 Compilando o código com SWC...${colors.reset}`);
  
  try {
    // Verificar se o SWC está disponível
    try {
      execSync('npx swc --version', { stdio: 'ignore' });
      console.log(`${colors.green}✅ SWC encontrado, usando para compilação${colors.reset}`);
      execSync('npx swc ./src -d ./dist --ignore "**/*.cjs"', { stdio: 'inherit' });
    } catch (swcError) {
      console.log(`${colors.yellow}⚠️ SWC não encontrado, usando método alternativo de cópia...${colors.reset}`);
      // Método alternativo: copiar os arquivos JS e ignorar arquivos CJS
      copyJsFiles();
    }
    console.log(`${colors.green}✅ Código compilado/copiado com sucesso${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao processar o código:${colors.reset}`, error.message);
    process.exit(1);
  }
}

/**
 * Função alternativa para copiar arquivos JS quando SWC não estiver disponível
 */
function copyJsFiles() {
  const copyDir = (srcPath, destPath) => {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcFilePath = path.join(srcPath, entry.name);
      const destFilePath = path.join(destPath, entry.name);
      
      if (entry.isDirectory()) {
        // Se for o diretório de rotas, tratamento especial
        if (entry.name === 'routes') {
          // Para a pasta routes, apenas copia os arquivos .cjs (que serão copiados depois)
          // Cria a pasta de destino, mas não copia os arquivos agora
          if (!fs.existsSync(path.join(destPath, entry.name))) {
            fs.mkdirSync(path.join(destPath, entry.name), { recursive: true });
          }
          console.log(`${colors.blue}🔹 Diretório de rotas: arquivos .js ignorados, apenas .cjs serão copiados${colors.reset}`);
        } else {
          copyDir(srcFilePath, destFilePath);
        }
      } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.cjs')) {
        // Não copiar arquivos .js que estão no diretório routes
        const isInRoutesDir = srcFilePath.includes(path.join('src', 'routes'));
        if (!isInRoutesDir) {
          fs.copyFileSync(srcFilePath, destFilePath);
          console.log(`${colors.green}✅ Copiado:${colors.reset} ${srcFilePath} -> ${destFilePath}`);
        } else {
          console.log(`${colors.yellow}⚠️ Ignorando arquivo .js em routes:${colors.reset} ${srcFilePath}`);
        }
      }
    }
  };
  
  copyDir(srcDir, distDir);
}

/**
 * Função para copiar arquivos CJS diretamente para o diretório de distribuição
 */
function copyCJSFiles() {
  console.log(`\n${colors.yellow}📂 Copiando arquivos .cjs para o diretório de distribuição...${colors.reset}`);
  
  if (!fs.existsSync(routesDir)) {
    console.error(`${colors.red}⚠️ Diretório de rotas não encontrado:${colors.reset} ${routesDir}`);
    return;
  }
  
  ensureDirectoryExists(distRoutesDir);
  
  // Obtém todos os arquivos .cjs do diretório de rotas
  const cjsFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.cjs'));
  
  if (cjsFiles.length === 0) {
    console.log(`${colors.red}⚠️ Nenhum arquivo .cjs encontrado em:${colors.reset} ${routesDir}`);
    return;
  }
  
  console.log(`${colors.blue}🔍 Encontrados ${cjsFiles.length} arquivos .cjs para copiar${colors.reset}`);
  
  // Para debug: lista todos os arquivos nos diretórios
  console.log(`${colors.magenta}🔍 Conteúdo do diretório de origem (${routesDir}):${colors.reset}`);
  fs.readdirSync(routesDir).forEach(file => console.log(`  - ${file}`));
  
  console.log(`${colors.magenta}🔍 Conteúdo do diretório de destino antes da cópia (${distRoutesDir}):${colors.reset}`);
  if (fs.existsSync(distRoutesDir)) {
    fs.readdirSync(distRoutesDir).forEach(file => console.log(`  - ${file}`));
  } else {
    console.log(`  (diretório não existe)`);
  }
  
  for (const file of cjsFiles) {
    const srcFile = path.join(routesDir, file);
    const destFile = path.join(distRoutesDir, file);
    
    try {
      // Verificações adicionais
      if (!fs.existsSync(srcFile)) {
        console.error(`${colors.red}❌ Arquivo de origem não existe:${colors.reset} ${srcFile}`);
        continue;
      }
      
      fs.copyFileSync(srcFile, destFile);
      console.log(`${colors.green}✅ Copiado:${colors.reset} ${file}`);
      
      // Verificação após cópia
      if (fs.existsSync(destFile)) {
        const size = fs.statSync(destFile).size;
        console.log(`${colors.green}   → Verificado: ${destFile} (${size} bytes)${colors.reset}`);
      } else {
        console.error(`${colors.red}❌ Verificação falhou: arquivo não existe após cópia: ${destFile}${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Erro ao copiar ${file}:${colors.reset}`, error.message);
    }
  }
  
  // Verificação final do conteúdo do diretório de destino
  console.log(`${colors.magenta}🔍 Conteúdo do diretório de destino após a cópia (${distRoutesDir}):${colors.reset}`);
  if (fs.existsSync(distRoutesDir)) {
    fs.readdirSync(distRoutesDir).forEach(file => console.log(`  - ${file}`));
  } else {
    console.log(`  (diretório não existe)`);
  }
}

/**
 * Função para copiar outros arquivos estáticos (se necessário)
 */
function copyStaticFiles() {
  console.log(`\n${colors.yellow}📂 Copiando arquivos estáticos...${colors.reset}`);
  
  // Criar diretório de uploads
  const uploadsDir = path.join(distDir, 'uploads');
  ensureDirectoryExists(uploadsDir);
  console.log(`${colors.green}✅ Diretório de uploads criado${colors.reset}`);
  
  // Arquivos estáticos a serem copiados
  const staticFiles = [
    { source: '.env', dest: path.join(distDir, '.env') },
    { source: 'prisma/schema.prisma', dest: path.join(distDir, 'prisma/schema.prisma') }
  ];
  
  for (const file of staticFiles) {
    try {
      const sourcePath = path.join(__dirname, file.source);
      const destPath = file.dest;
      
      // Certifica-se de que o diretório de destino existe
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`${colors.green}✅ Copiado:${colors.reset} ${file.source} -> ${destPath}`);
      } else {
        console.log(`${colors.yellow}⚠️ Arquivo não encontrado:${colors.reset} ${file.source}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Erro ao copiar ${file.source}:${colors.reset}`, error.message);
    }
  }
  
  console.log(`${colors.green}✅ Arquivos estáticos copiados${colors.reset}`);
}

/**
 * Função principal
 */
function build() {
  console.log(`\n${colors.magenta}🚀 Iniciando processo de build...${colors.reset}`);
  
  // Limpar diretório dist
  cleanDistDirectory();
  
  // Compilar código com SWC
  compileWithSWC();
  
  // Copiar arquivos CJS
  copyCJSFiles();
  
  // Copiar outros arquivos estáticos
  copyStaticFiles();
  
  console.log(`\n${colors.magenta}🎉 Build concluído com sucesso!${colors.reset}`);
}

// Executa o build
build();