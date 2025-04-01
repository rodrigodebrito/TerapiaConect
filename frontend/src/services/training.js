import api from './api';

// Serviço para gerenciar materiais de treinamento
const training = {
  // Buscar todos os materiais
  getAllMaterials: async () => {
    console.log('Buscando todos os materiais');
    try {
      const response = await api.get('/api/training/materials');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      throw error;
    }
  },

  // Buscar material por ID
  getMaterialById: async (id) => {
    try {
      const response = await api.get(`/api/training/materials/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar material ${id}:`, error);
      throw error;
    }
  },

  // Criar novo material
  createMaterial: async (data) => {
    try {
      const response = await api.post('/api/training/materials', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar material:', error);
      throw error;
    }
  },

  // Atualizar material
  updateMaterial: async (id, data) => {
    try {
      const response = await api.put(`/api/training/materials/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar material ${id}:`, error);
      throw error;
    }
  },

  // Excluir material
  deleteMaterial: async (id) => {
    try {
      const response = await api.delete(`/api/training/materials/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir material ${id}:`, error);
      throw error;
    }
  },

  // Processar material
  processMaterial: async (id) => {
    try {
      const response = await api.post(`/api/training/materials/${id}/process`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao processar material ${id}:`, error);
      throw error;
    }
  },

  // Upload de material
  uploadMaterial: async (formData) => {
    try {
      const response = await api.post('/api/training/materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload do material:', error);
      throw error;
    }
  }
};

export default training; 