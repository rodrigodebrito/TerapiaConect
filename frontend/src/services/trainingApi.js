import api from './api';

const trainingApi = {
  // Buscar todos os materiais
  getAllMaterials: async () => {
    const response = await api.get('/api/training/materials');
    return response.data;
  },

  // Buscar material por ID
  getMaterialById: async (id) => {
    const response = await api.get(`/api/training/materials/${id}`);
    return response.data;
  },

  // Criar novo material
  createMaterial: async (data) => {
    const response = await api.post('/api/training/materials', data);
    return response.data;
  },

  // Atualizar material
  updateMaterial: async (id, data) => {
    const response = await api.put(`/api/training/materials/${id}`, data);
    return response.data;
  },

  // Excluir material
  deleteMaterial: async (id) => {
    const response = await api.delete(`/api/training/materials/${id}`);
    return response.data;
  },

  // Processar material
  processMaterial: async (id) => {
    const response = await api.post(`/api/training/materials/${id}/process`);
    return response.data;
  }
};

export default trainingApi; 