/**
 * Helper para gerenciar a inicialização única do TensorFlow.js
 * e evitar avisos de registro duplicado de kernels
 */

import * as tf from '@tensorflow/tfjs';

// Flag para controlar se o TensorFlow já foi inicializado
let isTensorFlowInitialized = false;

/**
 * Inicializa o TensorFlow.js apenas uma vez
 * @param {Object} options - Opções de inicialização
 * @returns {Promise<void>}
 */
export const initializeTensorFlow = async (options = {}) => {
  if (isTensorFlowInitialized) {
    console.log('TensorFlow.js já foi inicializado. Ignorando nova inicialização.');
    return;
  }

  console.log('Inicializando TensorFlow.js...');
  
  const defaultOptions = {
    useWasm: true,
    useWebgl: true,
    logLevel: 0, // 0 = silencioso, 1 = erro, 2 = aviso, 3 = info
  };

  const config = { ...defaultOptions, ...options };

  try {
    // Configura backend WASM se habilitado
    if (config.useWasm) {
      await tf.setBackend('wasm');
      console.log('Backend WASM configurado.');
    } 
    // Ou usa WebGL se habilitado
    else if (config.useWebgl) {
      await tf.setBackend('webgl');
      console.log('Backend WebGL configurado.');
    }
    // Ou usa o padrão
    else {
      await tf.ready();
      console.log(`Backend padrão configurado: ${tf.getBackend()}`);
    }

    // Define o nível de log
    tf.env().set('DEBUG', config.logLevel > 0);
    
    // Marca como inicializado
    isTensorFlowInitialized = true;
    console.log('TensorFlow.js inicializado com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar TensorFlow.js:', error);
    // Tentar fallback para CPU se outros backends falharem
    try {
      await tf.setBackend('cpu');
      isTensorFlowInitialized = true;
      console.log('Fallback para backend CPU realizado com sucesso.');
    } catch (fallbackError) {
      console.error('Erro ao usar backend de fallback:', fallbackError);
    }
  }
};

/**
 * Verifica se o TensorFlow.js está inicializado
 * @returns {boolean}
 */
export const isTfInitialized = () => isTensorFlowInitialized;

/**
 * Retorna o backend atual do TensorFlow.js
 * @returns {string}
 */
export const getCurrentBackend = () => tf.getBackend();

export default {
  initializeTensorFlow,
  isTfInitialized,
  getCurrentBackend
}; 