#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import * as rimraf from 'rimraf';

// Obtém o diretório do script atual usando ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const distDir = path.join(__dirname, 'dist');
const uploadsDir = path.join(distDir, 'uploads');

console.log(chalk.blue('🚀 Iniciando o processo de build...'));

// Limpa o diretório dist se existir
if (fs.existsSync(distDir)) {
  console.log(chalk.yellow('🧹 Limpando diretório de distribuição...'));
  rimraf.sync(distDir);
}

// Cria o diretório dist
fs.mkdirSync(distDir, { recursive: true });

// Copia os arquivos diretamente para dist
console.log(chalk.blue('📋 Copiando arquivos do projeto...'));

// Função para copiar um diretório recursivamente
function copyDir(src, dest) {
  // Cria o diretório de destino se não existir
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Lê o conteúdo do diretório de origem
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // Processa cada item no diretório
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Se for um diretório, copia recursivamente
    if (entry.isDirectory()) {
      // Se for o diretório de rotas, tratamento especial
      if (entry.name === 'routes') {
        copyRoutesDir(srcPath, destPath);
      } else {
        copyDir(srcPath, destPath);
      }
    } 
    // Se for um arquivo, copia diretamente
    else {
      fs.copyFileSync(srcPath, destPath);
      console.log(chalk.green(`✅ Copiado: ${srcPath} -> ${destPath}`));
    }
  }
}

// Função especial para copiar diretório de rotas
function copyRoutesDir(src, dest) {
  // Cria o diretório de destino se não existir
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Lê o conteúdo do diretório de origem
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // Processa cada item no diretório
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Se for um diretório, copia recursivamente
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } 
    // Se for um arquivo .cjs, copia, mas ignora arquivos .js
    else if (entry.name.endsWith('.cjs')) {
      fs.copyFileSync(srcPath, destPath);
      console.log(chalk.green(`✅ Copiado: ${srcPath} -> ${destPath}`));
    } else if (entry.name.endsWith('.js')) {
      console.log(chalk.yellow(`⚠️ Ignorando arquivo JS em routes: ${srcPath}`));
    } else {
      // Outros tipos de arquivos são copiados normalmente
      fs.copyFileSync(srcPath, destPath);
      console.log(chalk.green(`✅ Copiado: ${srcPath} -> ${destPath}`));
    }
  }
}

// Copia o diretório src para dist
copyDir(path.join(__dirname, 'src'), distDir);

// Cria o diretório de uploads
console.log(chalk.blue('📁 Criando diretório de uploads...'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Copia arquivos estáticos adicionais (se necessário)
console.log(chalk.blue('📋 Copiando arquivos estáticos...'));
const staticFiles = [
  { source: '.env', dest: 'dist/.env' },
  { source: 'prisma/schema.prisma', dest: 'dist/prisma/schema.prisma' }
];

staticFiles.forEach(file => {
  try {
    const sourcePath = path.join(__dirname, file.source);
    const destPath = path.join(__dirname, file.dest);
    
    // Certifica-se de que o diretório de destino existe
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(chalk.green(`✅ Copiado: ${file.source} -> ${file.dest}`));
    } else {
      console.log(chalk.yellow(`⚠️ Arquivo não encontrado: ${file.source}`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao copiar ${file.source}:`), error);
  }
});

console.log(chalk.green('✨ Build concluído com sucesso!'));
console.log(chalk.blue('📝 Para iniciar o servidor, execute: npm start')); 