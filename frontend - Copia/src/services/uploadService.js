import api from './api';

export const uploadImage = async (file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data.url;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw new Error('Não foi possível fazer o upload da imagem. Por favor, tente novamente.');
  }
};

export const deleteImage = async (imageUrl) => {
  try {
    await api.delete(`/upload?url=${encodeURIComponent(imageUrl)}`);
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    throw new Error('Não foi possível deletar a imagem. Por favor, tente novamente.');
  }
}; 