#!/usr/bin/env node

/**
 * Este script converte arquivos JS de CommonJS para extensão .cjs
 * Para ser usado como parte do processo de build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Obtém o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de rotas (relativo ao diretório atual)
const routesDir = path.join(__dirname, 'routes');

// Variável para armazenar o caminho real do diretório de rotas
let routesDirPath;

// Verificar e registrar o ambiente
console.log(`${colors.magenta}🔍 Ambiente atual: ${process.env.NODE_ENV || 'development'}${colors.reset}`);
console.log(`${colors.magenta}🔍 Diretório de trabalho: ${process.cwd()}${colors.reset}`);
console.log(`${colors.magenta}🔍 Diretório do script: ${__dirname}${colors.reset}`);

// Verificar se o diretório de rotas existe
if (!fs.existsSync(routesDir)) {
  console.error(`${colors.red}❌ Diretório não encontrado: ${routesDir}${colors.reset}`);
  
  // Verificar caminhos alternativos
  const altPaths = [
    path.join(process.cwd(), 'src/routes'),
    path.join(process.cwd(), 'routes'),
  ];
  
  let foundPath = null;
  
  for (const altPath of altPaths) {
    console.log(`${colors.yellow}🔍 Verificando caminho alternativo: ${altPath}${colors.reset}`);
    if (fs.existsSync(altPath)) {
      console.log(`${colors.green}✅ Diretório encontrado em caminho alternativo: ${altPath}${colors.reset}`);
      foundPath = altPath;
      break;
    }
  }
  
  if (!foundPath) {
    console.error(`${colors.red}❌ Não foi possível encontrar o diretório de rotas em nenhum caminho alternativo.${colors.reset}`);
    process.exit(1);
  }
  
  // Usar o caminho alternativo encontrado
  routesDirPath = foundPath;
} else {
  console.log(`${colors.green}✅ Diretório de rotas encontrado: ${routesDir}${colors.reset}`);
  routesDirPath = routesDir;
}

console.log(`${colors.blue}🔍 Buscando arquivos .js em ${routesDirPath}...${colors.reset}`);

// Listar conteúdo do diretório para debug
try {
  const allFiles = fs.readdirSync(routesDirPath);
  console.log(`${colors.magenta}📑 Todos os arquivos no diretório (${allFiles.length}):${colors.reset}`);
  allFiles.forEach(file => console.log(`  - ${file}`));
} catch (error) {
  console.error(`${colors.red}❌ Erro ao listar diretório: ${error.message}${colors.reset}`);
}

// Obtém todos os arquivos .js no diretório de rotas
const jsFiles = fs.readdirSync(routesDirPath)
  .filter(file => file.endsWith('.js') && !file.endsWith('.cjs'));

console.log(`${colors.green}✅ Encontrados ${jsFiles.length} arquivos .js para renomear.${colors.reset}`);

// Garantir também que o diretório dist/routes exista para cópias
const distRoutesDir = path.join(process.cwd(), 'dist/routes');
if (!fs.existsSync(distRoutesDir)) {
  try {
    fs.mkdirSync(distRoutesDir, { recursive: true });
    console.log(`${colors.green}✅ Diretório criado: ${distRoutesDir}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao criar diretório dist/routes: ${error.message}${colors.reset}`);
  }
}

// Renomeia cada arquivo de .js para .cjs
let count = 0;
for (const file of jsFiles) {
  const oldPath = path.join(routesDirPath, file);
  const newPath = path.join(routesDirPath, file.replace('.js', '.cjs'));
  const distPath = path.join(distRoutesDir, file.replace('.js', '.cjs'));
  
  try {
    // Copia o conteúdo do arquivo
    fs.copyFileSync(oldPath, newPath);
    console.log(`${colors.green}✅ Renomeado: ${file} -> ${file.replace('.js', '.cjs')}${colors.reset}`);
    
    // Copia também para o diretório dist/routes
    fs.copyFileSync(oldPath, distPath);
    console.log(`${colors.blue}📋 Copiado para dist: ${distPath}${colors.reset}`);
    
    // Remove o arquivo .js original
    fs.unlinkSync(oldPath);
    console.log(`${colors.yellow}🗑️ Removido arquivo original: ${file}${colors.reset}`);
    
    count++;
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao processar ${file}: ${error.message}${colors.reset}`);
  }
}

// Verificação final
console.log(`\n${colors.magenta}📑 Verificando diretório final dist/routes:${colors.reset}`);
try {
  const finalFiles = fs.readdirSync(distRoutesDir);
  console.log(`${colors.magenta}📑 Arquivos encontrados (${finalFiles.length}):${colors.reset}`);
  finalFiles.forEach(file => console.log(`  - ${file}`));
} catch (error) {
  console.error(`${colors.red}❌ Erro ao verificar diretório final: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.green}🎉 Processo concluído! ${count} arquivos foram convertidos para .cjs${colors.reset}`); 