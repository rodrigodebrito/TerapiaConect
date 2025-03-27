const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/training.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Rotas protegidas que requerem autenticação
router.use(authenticate);

// Adicionar novo material de treinamento
router.post('/materials', trainingController.addMaterial);

// Listar materiais por categoria
router.get('/materials/:category', trainingController.getMaterialsByCategory);

// Obter detalhes de um material específico
router.get('/materials/:id', trainingController.getMaterialById);

// Atualizar material
router.put('/materials/:id', trainingController.updateMaterial);

// Deletar material
router.delete('/materials/:id', trainingController.deleteMaterial);

// Processar material manualmente
router.post('/materials/:id/process', trainingController.processMaterial);

// Melhorar análise de sessão com materiais
router.post('/enhance-analysis', trainingController.enhanceSessionAnalysis);

module.exports = router; 