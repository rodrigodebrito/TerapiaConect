/**
 * Faz o parse seguro de uma string JSON para um objeto/array
 * @param {string|any} value - O valor a ser convertido
 * @param {any} defaultValue - Valor padrão caso o parse falhe
 * @returns {any} - O resultado do parse ou o valor padrão
 */
export const safeParseJSON = (value, defaultValue) => {
  if (!value) return defaultValue;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    console.warn('Erro ao fazer parse de JSON:', error);
    return defaultValue;
  }
};

/**
 * Verifica se uma string é um JSON válido
 * @param {string} str - String a ser verificada
 * @returns {boolean} - true se for um JSON válido, false caso contrário
 */
export const isJsonString = (str) => {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}; 