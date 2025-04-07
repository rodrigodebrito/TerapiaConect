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
        // Lê o conteúdo do arquivo
        let code = fs.readFileSync(srcPath, 'utf8');
        
        // Transformações de CommonJS para ESM
        
        // 1. Transforma require para import - variável única
        code = code.replace(/const\s+(\w+)\s*=\s*require\(['"]([@\w\d\-\/.]+)['"]\);?/g, 'import $1 from "$2.js";');
        
        // 2. Transforma require para import - múltiplas variáveis
        code = code.replace(/const\s+{\s*([^}]+)\s*}\s*=\s*require\(['"]([@\w\d\-\/.]+)['"]\);?/g, 'import { $1 } from "$2.js";');
        
        // 3. Ajusta imports especiais sem extensão
        const specialModules = ['express', 'cors', 'dotenv', 'path', 'fs', 'axios', 'http', 'socket.io', 
          'jsonwebtoken', 'bcryptjs', 'multer', 'morgan', 'cookie-parser', 'helmet', 'compression', 
          '@prisma/client', 'openai', 'crypto', 'util', 'url'];
        
        specialModules.forEach(module => {
          const moduleRegex = new RegExp(`from ['"](${module})\.js['"]`, 'g');
          code = code.replace(moduleRegex, `from "${module}"`);
        });
        
        // 4. Transforma module.exports para export default
        code = code.replace(/module\.exports\s*=\s*/g, 'export default ');
        
        // 5. Transforma exports.X para export const X
        code = code.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');
        
        // 6. Transformar importações relativas locais para incluir .js
        code = code.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, path) => {
          // Adicionar .js apenas se o caminho não tiver já uma extensão
          if (!path.match(/\.\w+$/)) {
            return `from "${path}.js"`;
          }
          return match;
        });
        
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