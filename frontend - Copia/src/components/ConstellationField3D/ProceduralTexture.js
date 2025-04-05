import * as THREE from 'three';

/**
 * Cria uma textura procedural para o campo de constelação com design de bússola
 * @param {number} size - Tamanho da textura (largura e altura em pixels)
 * @param {object} options - Opções para customizar a textura
 * @returns {THREE.CanvasTexture} - Textura procedural
 */
export function createCompassFieldTexture(size = 1024, options = {}) {
  const {
    backgroundColor = '#f5f5f5',
    gridColor = '#e0e0e0',
    compassRoseColor = '#63C5DA',
    markersColor = '#aaaaaa',
    gridLineWidth = 1,
    compassLineWidth = 2,
  } = options;

  // Criar um canvas para desenhar a textura
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  
  // Garantir que o contexto foi criado corretamente
  if (!ctx) {
    console.error("Não foi possível obter o contexto do canvas para gerar a textura");
    // Criar uma textura vazia como fallback
    return createFallbackTexture(size);
  }
  
  // Preencher o fundo
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);
  
  const center = size / 2;
  const radius = (size / 2) * 0.95; // 95% do tamanho para deixar uma margem
  
  // Desenhar círculo externo
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = markersColor;
  ctx.lineWidth = gridLineWidth * 2;
  ctx.stroke();
  
  // Desenhar círculo interno
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.2, 0, Math.PI * 2);
  ctx.strokeStyle = markersColor;
  ctx.lineWidth = gridLineWidth;
  ctx.stroke();
  
  // Desenhar círculos intermediários
  for (let r = 0.4; r <= 0.8; r += 0.2) {
    ctx.beginPath();
    ctx.arc(center, center, radius * r, 0, Math.PI * 2);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = gridLineWidth;
    ctx.stroke();
  }
  
  // Desenhar marcações radiais (linhas angulares)
  for (let i = 0; i < 36; i++) {
    const angle = (i * 10 * Math.PI) / 180;
    const startRadius = radius * 0.2;
    const endRadius = radius;
    
    ctx.beginPath();
    ctx.moveTo(
      center + Math.cos(angle) * startRadius,
      center + Math.sin(angle) * startRadius
    );
    ctx.lineTo(
      center + Math.cos(angle) * endRadius,
      center + Math.sin(angle) * endRadius
    );
    
    if (i % 9 === 0) {
      // Linhas principais (N, S, L, O)
      ctx.strokeStyle = markersColor;
      ctx.lineWidth = gridLineWidth * 2;
    } else {
      // Linhas secundárias
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = gridLineWidth;
    }
    
    ctx.stroke();
  }
  
  // Desenhar rosa dos ventos estilizada
  // Pontas principais (N, S, L, O)
  const drawCompassArm = (angle, length, width) => {
    const tipRadius = radius * length;
    const baseRadius = radius * 0.2;
    const midRadius = baseRadius + (tipRadius - baseRadius) * 0.2;
    const widthFactor = width;
    
    ctx.beginPath();
    // Centro
    ctx.moveTo(
      center + Math.cos(angle) * baseRadius,
      center + Math.sin(angle) * baseRadius
    );
    
    // Ponta direita
    ctx.lineTo(
      center + Math.cos(angle + widthFactor) * midRadius,
      center + Math.sin(angle + widthFactor) * midRadius
    );
    
    // Ponta
    ctx.lineTo(
      center + Math.cos(angle) * tipRadius,
      center + Math.sin(angle) * tipRadius
    );
    
    // Ponta esquerda
    ctx.lineTo(
      center + Math.cos(angle - widthFactor) * midRadius,
      center + Math.sin(angle - widthFactor) * midRadius
    );
    
    // Volta ao centro
    ctx.closePath();
    
    ctx.fillStyle = compassRoseColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = compassLineWidth;
    ctx.stroke();
  };
  
  // Desenhar os quatro braços principais da rosa dos ventos
  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]; // 0, 90, 180, 270 graus
  angles.forEach(angle => {
    drawCompassArm(angle, 0.8, 0.1);
  });
  
  // Adicionar letras de direção
  ctx.font = `bold ${size * 0.04}px Arial`;
  ctx.fillStyle = markersColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const letters = [
    { letter: 'N', angle: 0 },
    { letter: 'E', angle: Math.PI / 2 },
    { letter: 'S', angle: Math.PI },
    { letter: 'W', angle: Math.PI * 1.5 }
  ];
  
  letters.forEach(({ letter, angle }) => {
    const letterRadius = radius * 0.92;
    ctx.fillText(
      letter,
      center + Math.cos(angle) * letterRadius,
      center + Math.sin(angle) * letterRadius
    );
  });
  
  try {
    // Criar uma textura a partir do canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Configurar corretamente os parâmetros da textura
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.needsUpdate = true;
    
    return texture;
  } catch (error) {
    console.error("Erro ao criar textura:", error);
    return createFallbackTexture(size);
  }
}

/**
 * Cria uma textura simples de fallback no caso de erro
 * @param {number} size - Tamanho da textura
 * @returns {THREE.Texture} - Textura simples de fallback
 */
function createFallbackTexture(size = 1024) {
  // Criar um canvas simples
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Desenhar um gradiente simples
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f0f0f0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Adicionar um círculo básico
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;
  texture.needsUpdate = true;
  
  return texture;
}

export default createCompassFieldTexture; 