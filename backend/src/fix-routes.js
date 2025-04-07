#!/usr/bin/env node

/**
 * Este script corrige os arquivos de rota para garantir que eles estejam
 * no formato CommonJS compatível e funcionem corretamente quando carregados.
 * 
 * O script:
 * 1. Converte router exports para o formato CommonJS
 * 2. Atualiza require/import conforme necessário
 * 3. Garante que os arquivos resultantes tenham o formato correto
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Configurações de diretórios
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distRoutesDir = path.join(process.cwd(), 'dist/routes');

// Garantir que distRoutesDir exista
if (!fs.existsSync(distRoutesDir)) {
  fs.mkdirSync(distRoutesDir, { recursive: true });
  console.log(`${colors.green}✅ Diretório criado:${colors.reset} ${distRoutesDir}`);
}

// Criar um arquivo de rota de exemplo para garantir que pelo menos uma rota funcione
function createExampleRoute() {
  console.log(`${colors.blue}📝 Criando arquivo de rota de exemplo...${colors.reset}`);
  
  const exampleRoutePath = path.join(distRoutesDir, 'example.routes.cjs');
  const content = `/**
 * Arquivo de rota de exemplo no formato CJS
 * Criado pelo script fix-routes.js
 */

const express = require('express');
const router = express.Router();

// Rota básica para teste
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Rota de teste funcionando!',
    success: true,
    timestamp: new Date().toISOString()
  });
});

// Rota com parâmetro
router.get('/test/:id', (req, res) => {
  res.status(200).json({
    message: 'Rota com parâmetro funcionando!',
    id: req.params.id,
    success: true,
    timestamp: new Date().toISOString()
  });
});

// Exportação CommonJS
module.exports = router;`;

  fs.writeFileSync(exampleRoutePath, content);
  console.log(`${colors.green}✅ Arquivo de rota de exemplo criado:${colors.reset} ${exampleRoutePath}`);
}

// Criar uma rota mínima diretamente no dist
function createMinimalRoute() {
  console.log(`${colors.blue}📝 Criando rota mínima diretamente no dist...${colors.reset}`);
  
  const minimalPath = path.join(distRoutesDir, 'minimal.route.cjs');
  const content = `// Rota mínima criada por fix-routes.js
// Esta é a rota mais simples possível, garantida funcional

const express = require('express');
const router = express.Router();

router.get('/minimal', (req, res) => {
  res.json({
    message: 'Rota mínima funcionando!',
    success: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;`;

  try {
    fs.writeFileSync(minimalPath, content, { mode: 0o644 });
    console.log(`${colors.green}✅ Rota mínima criada:${colors.reset} ${minimalPath}`);
    
    // Verificar conteúdo do arquivo 
    const fileContent = fs.readFileSync(minimalPath, 'utf8');
    console.log(`${colors.blue}📄 Conteúdo do arquivo:${colors.reset}`);
    console.log(fileContent);
    
    // Verificar permissões
    const stats = fs.statSync(minimalPath);
    const fileMode = stats.mode.toString(8).slice(-3);
    console.log(`${colors.blue}🔐 Permissões do arquivo:${colors.reset} ${fileMode}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao criar rota mínima:${colors.reset} ${error.message}`);
  }
}

// Modificar arquivos de rota existentes
function modifyExistingRoutes() {
  console.log(`${colors.blue}🔍 Buscando arquivos de rota existentes...${colors.reset}`);
  
  if (!fs.existsSync(distRoutesDir)) {
    console.log(`${colors.yellow}⚠️ Diretório de rotas não encontrado:${colors.reset} ${distRoutesDir}`);
    return;
  }
  
  const routeFiles = fs.readdirSync(distRoutesDir)
    .filter(file => file.endsWith('.cjs'));
  
  console.log(`${colors.blue}🔍 Encontrados ${routeFiles.length} arquivos de rota${colors.reset}`);
  
  for (const file of routeFiles) {
    const filePath = path.join(distRoutesDir, file);
    console.log(`${colors.yellow}🔄 Processando:${colors.reset} ${file}`);
    
    try {
      // Ler o arquivo
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Verificar se o arquivo já está no formato CommonJS
      if (content.includes('module.exports')) {
        console.log(`${colors.green}✅ Arquivo já está no formato CommonJS:${colors.reset} ${file}`);
        continue;
      }
      
      // Modificar conteúdo para formato CommonJS
      content = content.replace(/import\s+express\s+from\s+['"]express['"];?/g, 'const express = require("express");');
      content = content.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"];?/g, 'const { $1 } = require("$2");');
      content = content.replace(/import\s+\*\s+as\s+([^\s]+)\s+from\s+['"]([^'"]+)['"];?/g, 'const $1 = require("$2");');
      content = content.replace(/import\s+([^\s]+)\s+from\s+['"]([^'"]+)['"];?/g, 'const $1 = require("$2");');
      
      // Substituir export default pelo padrão CommonJS
      content = content.replace(/export\s+default\s+router;?/g, 'module.exports = router;');
      content = content.replace(/export\s+\{\s*([^}]+)\s*\};?/g, 'module.exports = { $1 };');
      
      // Salvar o arquivo modificado
      fs.writeFileSync(filePath, content);
      console.log(`${colors.green}✅ Arquivo convertido para CommonJS:${colors.reset} ${file}`);
    } catch (error) {
      console.error(`${colors.red}❌ Erro ao processar ${file}:${colors.reset} ${error.message}`);
    }
  }
}

// Executar as funções
createExampleRoute();
createMinimalRoute();
modifyExistingRoutes();

console.log(`${colors.green}🎉 Script de correção de rotas concluído!${colors.reset}`); 