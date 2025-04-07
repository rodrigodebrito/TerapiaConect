/**
 * Exemplo de arquivo de rota no formato CommonJS (CJS)
 * Este arquivo serve como referência para o formato correto de rotas
 */

const express = require('express');
const router = express.Router();

// Rota de exemplo
router.get('/exemplo', (req, res) => {
  res.status(200).json({ message: 'Rota de exemplo funcionando!' });
});

// Exportação no formato CommonJS
module.exports = router; 