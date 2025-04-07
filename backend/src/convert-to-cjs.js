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
  blue: '\x1b[34m'
};

// Obtém o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de rotas (relativo ao diretório atual)
const routesDir = path.join(__dirname, 'routes');

// Verifica se o diretório de rotas existe
if (!fs.existsSync(routesDir)) {
  console.error(`${colors.red}❌ Diretório não encontrado: ${routesDir}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.blue}🔍 Buscando arquivos .js em ${routesDir}...${colors.reset}`);

// Obtém todos os arquivos .js no diretório de rotas
const jsFiles = fs.readdirSync(routesDir)
  .filter(file => file.endsWith('.js') && !file.endsWith('.cjs'));

console.log(`${colors.green}✅ Encontrados ${jsFiles.length} arquivos .js para renomear.${colors.reset}`);

// Renomeia cada arquivo de .js para .cjs
let count = 0;
for (const file of jsFiles) {
  const oldPath = path.join(routesDir, file);
  const newPath = path.join(routesDir, file.replace('.js', '.cjs'));
  
  try {
    // Copia o conteúdo do arquivo
    fs.copyFileSync(oldPath, newPath);
    console.log(`${colors.green}✅ Renomeado: ${file} -> ${file.replace('.js', '.cjs')}${colors.reset}`);
    
    // Remove o arquivo .js original
    fs.unlinkSync(oldPath);
    console.log(`${colors.yellow}🗑️ Removido arquivo original: ${file}${colors.reset}`);
    
    count++;
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao processar ${file}: ${error.message}${colors.reset}`);
  }
}

console.log(`\n${colors.green}🎉 Processo concluído! ${count} arquivos foram convertidos para .cjs${colors.reset}`); 