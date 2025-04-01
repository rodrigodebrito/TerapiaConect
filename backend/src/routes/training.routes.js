const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/training.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas GET - Ordem é importante!
router.get('/materials', trainingController.getAllMaterials);
router.get('/materials/category/:category', trainingController.getMaterialsByCategory);
router.get('/materials/:id', trainingController.getMaterialById);

// Rotas POST
router.post('/materials', trainingController.addMaterial);
router.post('/materials/upload', upload.single('document'), trainingController.uploadMaterial);
router.post('/materials/:id/process', trainingController.processMaterial);
router.post('/materials/:id/embedding', trainingController.generateEmbedding);
router.post('/embeddings/generate-all', trainingController.generateAllEmbeddings);
router.post('/search/semantic', trainingController.searchSemantic);
router.post('/enhance-analysis', trainingController.enhanceSessionAnalysis);

// Rotas PUT
router.put('/materials/:id', trainingController.updateMaterial);
router.put('/materials/:id/upload', upload.single('document'), trainingController.updateMaterialWithUpload);

// Rotas DELETE
router.delete('/materials/:id', trainingController.deleteMaterial);

module.exports = router; 