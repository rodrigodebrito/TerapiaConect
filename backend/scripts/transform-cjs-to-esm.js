#!/usr/bin/env node

/**
 * Script para transformar arquivos CommonJS para ES Modules
 * 
 * Este script percorrerá todos os arquivos .js em src/ e converterá:
 * - require() para import
 * - module.exports para export
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as glob from 'glob';
import { transformFileSync } from '@babel/core';
import chalk from 'chalk';

// Obtém o diretório do script atual usando ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configurações
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

// Certifique-se de que o diretório de saída existe
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Função principal
async function transform() {
  try {
    console.log(chalk.blue('🔍 Buscando arquivos JavaScript para transformar...'));
    
    // Encontra todos os arquivos .js no diretório src
    const files = glob.sync('**/*.js', { cwd: srcDir });
    
    if (files.length === 0) {
      console.log(chalk.yellow('⚠️ Nenhum arquivo JavaScript encontrado no diretório src.'));
      return;
    }
    
    console.log(chalk.green(`✅ Encontrados ${files.length} arquivos para transformar.`));
    
    // Transforma cada arquivo
    const transformedCount = files.reduce((count, file) => {
      const srcPath = path.join(srcDir, file);
      const distPath = path.join(distDir, file);
      
      // Certifica-se de que o diretório de destino existe
      const distDirPath = path.dirname(distPath);
      if (!fs.existsSync(distDirPath)) {
        fs.mkdirSync(distDirPath, { recursive: true });
      }
      
      try {
        // Transforma o código com Babel para ES Modules
        const result = transformFileSync(srcPath, {
          presets: [
            ['@babel/preset-env', {
              targets: {
                node: 'current'
              },
              modules: false
            }]
          ],
          plugins: [
            '@babel/plugin-transform-modules-commonjs',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-object-rest-spread'
          ],
          sourceType: 'module'
        });
        
        // Aplica transformações adicionais para ESM
        let code = result.code;
        
        // Substitui require por import
        code = code.replace(/const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\);?/g, 'import $1 from "$2";');
        code = code.replace(/const\s+{\s*(.+?)\s*}\s*=\s*require\(['"](.+?)['"]\);?/g, 'import { $1 } from "$2";');
        
        // Substitui module.exports por export default
        code = code.replace(/module\.exports\s*=\s*/g, 'export default ');
        
        // Substitui exports.X por export const X
        code = code.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');
        
        // Escreve o arquivo transformado
        fs.writeFileSync(distPath, code);
        
        console.log(chalk.green(`✅ Transformado: ${file}`));
        return count + 1;
      } catch (err) {
        console.error(chalk.red(`❌ Erro ao transformar ${file}:`), err);
        return count;
      }
    }, 0);
    
    console.log(chalk.blue(`🎉 Transformação concluída. ${transformedCount} de ${files.length} arquivos transformados com sucesso.`));
    
    // Copia arquivos não-JavaScript (como .json, etc.)
    const nonJsFiles = glob.sync('**/*.!(js)', { cwd: srcDir });
    if (nonJsFiles.length > 0) {
      console.log(chalk.blue(`📝 Copiando ${nonJsFiles.length} arquivos não-JavaScript...`));
      
      nonJsFiles.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const distPath = path.join(distDir, file);
        
        // Certifica-se de que o diretório de destino existe
        const distDirPath = path.dirname(distPath);
        if (!fs.existsSync(distDirPath)) {
          fs.mkdirSync(distDirPath, { recursive: true });
        }
        
        fs.copyFileSync(srcPath, distPath);
        console.log(chalk.green(`✅ Copiado: ${file}`));
      });
    }
    
    console.log(chalk.blue('✨ Processo completo!'));
  } catch (error) {
    console.error(chalk.red('❌ Erro durante a transformação:'), error);
    process.exit(1);
  }
}

// Executa a função principal
transform().catch(err => {
  console.error(chalk.red('❌ Erro fatal:'), err);
  process.exit(1);
});