/**
 * tfHelper.js
 * Utilitário para inicialização e configuração do TensorFlow.js
 */

// Variáveis para controle de estado
let tfInitialized = false;
let tf = null;

/**
 * Verifica se o TensorFlow.js já foi inicializado
 * @returns {boolean} - Status de inicialização do TensorFlow
 */
export function isTfInitialized() {
  return tfInitialized;
}

/**
 * Inicializa o TensorFlow.js com as configurações fornecidas
 * @param {Object} options - Opções de inicialização
 * @param {number} options.logLevel - Nível de log (0-5)
 * @returns {Promise<Object>} - Instância do TensorFlow
 */
export async function initializeTensorFlow(options = { logLevel: 0 }) {
  // Se já estiver inicializado, apenas retornar a instância
  if (tfInitialized && tf) {
    return tf;
  }

  console.log('Inicializando TensorFlow.js...');

  try {
    // Importar dinamicamente para não bloquear
    tf = await import('@tensorflow/tfjs');
    
    // Configurar nível de log
    tf.setLogLevel(options.logLevel);
    
    // Tentar usar WASM se disponível (mais rápido em navegadores)
    try {
      await tf.setBackend('wasm');
      console.log('Backend WASM carregado com sucesso');
    } catch (error) {
      // Se WASM falhar, tentar WebGL
      try {
        await tf.setBackend('webgl');
        console.log('Fallback para backend WebGL realizado com sucesso');
      } catch (webglError) {
        // Se WebGL falhar, usar CPU (mais lento, mas funciona em qualquer lugar)
        await tf.setBackend('cpu');
        console.log('Fallback para backend CPU realizado com sucesso.');
      }
    }
    
    // Verificar qual backend está em uso
    console.log(`TensorFlow.js inicializado com sucesso. Backend: ${tf.getBackend()}`);
    
    // Marcar como inicializado
    tfInitialized = true;
    
    return tf;
  } catch (error) {
    console.error('Erro ao inicializar TensorFlow.js:', error);
    
    // Se houver falha, tentar inicializar apenas com CPU
    try {
      console.log('Tentando inicialização minimal com CPU...');
      tf = await import('@tensorflow/tfjs');
      await tf.setBackend('cpu');
      
      tfInitialized = true;
      console.log('Fallback para backend CPU realizado com sucesso.');
      return tf;
    } catch (fallbackError) {
      console.error('Falha completa ao inicializar TensorFlow:', fallbackError);
      throw new Error('Não foi possível inicializar o TensorFlow.js');
    }
  }
}

/**
 * Obtém a instância do TensorFlow, inicializando se necessário
 * @returns {Promise<Object>} - Instância do TensorFlow
 */
export async function getTensorFlow() {
  if (!tfInitialized) {
    return initializeTensorFlow();
  }
  return tf;
}

export default {
  initializeTensorFlow,
  isTfInitialized,
  getTensorFlow
}; 