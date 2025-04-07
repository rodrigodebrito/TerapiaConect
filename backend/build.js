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

// Executa o script de transformação
console.log(chalk.blue('🔄 Transformando arquivos de CommonJS para ES Modules...'));
try {
  execSync('node scripts/transform-cjs-to-esm.js', { stdio: 'inherit' });
  console.log(chalk.green('✅ Transformação concluída com sucesso!'));
} catch (error) {
  console.error(chalk.red('❌ Erro durante a transformação:'), error);
  process.exit(1);
}

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