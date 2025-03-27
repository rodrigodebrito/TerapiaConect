const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/training.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar o multer para upload de documentos
const uploadDir = path.join(__dirname, '../../uploads/documents');

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'document-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Rota para adicionar um material (sem arquivo)
router.post('/materials', authenticateToken, trainingController.addMaterial);

// Rota para adicionar um material com upload de documento
router.post('/materials/upload', authenticateToken, upload.single('document'), trainingController.uploadMaterial);

// Rota para atualizar um material com upload de documento
router.put('/materials/:id/upload', authenticateToken, upload.single('document'), trainingController.updateMaterialWithUpload);

// Buscar todos os materiais
router.get('/materials', authenticateToken, trainingController.getAllMaterials);

// Buscar materiais por categoria
router.get('/materials/:category', authenticateToken, trainingController.getMaterialsByCategory);

// Buscar material específico
router.get('/material/:id', authenticateToken, trainingController.getMaterialById);

// Atualizar material
router.put('/materials/:id', authenticateToken, trainingController.updateMaterial);

// Excluir material
router.delete('/materials/:id', authenticateToken, trainingController.deleteMaterial);

// Processar material com IA
router.post('/materials/:id/process', authenticateToken, trainingController.processMaterial);

module.exports = router; 