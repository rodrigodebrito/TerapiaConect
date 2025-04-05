import axios from 'axios';
import api, { uploadApi } from './api';

const BASE_URL = '/training';

export const getAllMaterials = async () => {
  console.log('Buscando todos os materiais');
  try {
    const response = await api.get(`${BASE_URL}/materials`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    throw error;
  }
};

export const getMaterialsByCategory = async (category) => {
  try {
    const response = await api.get(`${BASE_URL}/materials/${category}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar materiais da categoria ${category}:`, error);
    throw error;
  }
};

export const addMaterial = async (material) => {
  try {
    const response = await api.post(`${BASE_URL}/materials`, material);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar material:', error);
    throw error;
  }
};

export const uploadMaterial = async (materialData) => {
  try {
    const response = await uploadApi.post(`${BASE_URL}/materials/upload`, materialData);
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer upload de material:', error);
    throw error;
  }
};

export const updateMaterial = async (id, material) => {
  try {
    const response = await api.put(`${BASE_URL}/materials/${id}`, material);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar material ${id}:`, error);
    throw error;
  }
};

export const updateMaterialWithUpload = async (id, materialData) => {
  try {
    const response = await uploadApi.put(`${BASE_URL}/materials/${id}/upload`, materialData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar material ${id} com upload:`, error);
    throw error;
  }
};

export const deleteMaterial = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/materials/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao excluir material ${id}:`, error);
    throw error;
  }
};

export const processMaterial = async (id) => {
  try {
    const response = await api.post(`${BASE_URL}/materials/${id}/process`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao processar material ${id}:`, error);
    throw error;
  }
};

export const getMaterialById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/material/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar material ${id}:`, error);
    throw error;
  }
}; 