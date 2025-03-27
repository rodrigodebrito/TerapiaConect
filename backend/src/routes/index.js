const express = require('express');
const router = express.Router();

// Importar rotas
const aiRoutes = require('./ai.routes');

// Usar rotas da IA
router.use('/api/ai', aiRoutes);

// ... resto das rotas existentes ...

module.exports = router; 