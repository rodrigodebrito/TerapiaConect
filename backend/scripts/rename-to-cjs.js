#!/usr/bin/env node

/**
 * Script para renomear arquivos .js para .cjs
 * 
 * Este script renomeia todos os arquivos .js na pasta routes para .cjs,
 * permitindo que eles sejam carregados corretamente em um ambiente ES Modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const routesDir = path.join(rootDir, 'src', 'routes');

console.log(`🔍 Buscando arquivos .js em ${routesDir}...`);

try {
  // Verificar se o diretório existe
  if (!fs.existsSync(routesDir)) {
    console.error(`❌ Diretório ${routesDir} não encontrado!`);
    process.exit(1);
  }

  // Listar todos os arquivos no diretório
  const files = fs.readdirSync(routesDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  console.log(`✅ Encontrados ${jsFiles.length} arquivos .js para renomear.`);

  // Renomear cada arquivo .js para .cjs
  jsFiles.forEach(file => {
    const oldPath = path.join(routesDir, file);
    const newPath = path.join(routesDir, file.replace('.js', '.cjs'));
    
    // Verificar se já existe um arquivo .cjs com o mesmo nome
    if (fs.existsSync(newPath)) {
      console.log(`⚠️ ${newPath} já existe, será substituído`);
      fs.unlinkSync(newPath);
    }
    
    // Copiar conteúdo em vez de renomear para manter o original
    fs.copyFileSync(oldPath, newPath);
    console.log(`✅ Renomeado: ${file} -> ${file.replace('.js', '.cjs')}`);
  });

  console.log(`\n🎉 Processo concluído! ${jsFiles.length} arquivos foram convertidos para .cjs`);
} catch (error) {
  console.error(`❌ Erro durante o processo:`, error);
  process.exit(1);
} 