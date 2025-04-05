import api, { uploadApi } from './api';

const BASE_URL = '/api/transcription';

/**
 * Envia um arquivo de áudio/vídeo para transcrição
 * @param {FormData} formData - Dados do formulário com arquivo e metadados
 * @returns {Promise<Object>} - Resposta da API
 */
export const transcribeMedia = async (formData) => {
  try {
    console.log('[TRANSCRIPTION API] Enviando arquivo para transcrição:', 
      {
        title: formData.get('title'),
        language: formData.get('language'),
        categories: formData.getAll('categories[]'),
        fileSize: formData.get('media')?.size,
        fileName: formData.get('media')?.name
      }
    );
    
    const response = await uploadApi.post(`${BASE_URL}`, formData);
    console.log('[TRANSCRIPTION API] Resposta recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error('[TRANSCRIPTION API] Erro ao enviar arquivo para transcrição:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Verifica o status de uma transcrição
 * @param {string} id - ID do material sendo transcrito
 * @returns {Promise<Object>} - Status da transcrição
 */
export const checkTranscriptionStatus = async (id) => {
  try {
    console.log(`[TRANSCRIPTION API] Verificando status da transcrição ID: ${id}`);
    const response = await api.get(`${BASE_URL}/${id}/status`);
    console.log(`[TRANSCRIPTION API] Status da transcrição ID ${id}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[TRANSCRIPTION API] Erro ao verificar status da transcrição ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
}; 