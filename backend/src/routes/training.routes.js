const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/training.controller');
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar o multer para upload de documentos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Criar o diretório se não existir
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Usar timestamp + nome original para evitar conflitos
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Rotas que requerem autenticação
router.use(authenticate);

// Adicionar material de treinamento (texto)
router.post('/materials', trainingController.addMaterial);

// Adicionar material com upload
router.post('/materials/upload', upload.single('document'), trainingController.uploadMaterial);

// Atualizar material com upload
router.put('/materials/:id/upload', upload.single('document'), trainingController.updateMaterialWithUpload);

// Buscar materiais por categoria
router.get('/materials/category/:category', trainingController.getMaterialsByCategory);

// Processar material
router.post('/materials/:id/process', trainingController.processMaterial);

// Melhorar análise de sessão com materiais relevantes
router.post('/enhance-analysis', trainingController.enhanceSessionAnalysis);

// Gerar embedding para um material específico
router.post('/materials/:id/embedding', trainingController.generateEmbedding);

// Gerar embeddings para todos os materiais processados
router.post('/embeddings/generate-all', trainingController.generateAllEmbeddings);

// Busca semântica de materiais
router.post('/search/semantic', trainingController.searchSemantic);

// Obter detalhes de um material
router.get('/materials/:id', trainingController.getMaterialById);

// Atualizar material
router.put('/materials/:id', trainingController.updateMaterial);

// Remover material
router.delete('/materials/:id', trainingController.deleteMaterial);

// Listar todos os materiais
router.get('/materials', trainingController.getAllMaterials);

module.exports = router; 