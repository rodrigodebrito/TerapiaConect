// Constantes para o perfil do terapeuta

// Nichos de atuação
export const THERAPY_NICHES = [
  { id: 'ansiedade', label: 'Ansiedade' },
  { id: 'depressao', label: 'Depressão' },
  { id: 'autoestima', label: 'Autoestima' },
  { id: 'relacionamentos', label: 'Relacionamentos' },
  { id: 'estresse', label: 'Estresse' },
  { id: 'trauma', label: 'Trauma' },
  { id: 'desenvolvimento', label: 'Desenvolvimento Pessoal' },
  { id: 'carreira', label: 'Carreira' },
  { id: 'familia', label: 'Família' },
  { id: 'luto', label: 'Luto' }
];

// Ferramentas terapêuticas
export const THERAPY_TOOLS = [
  { id: 'constellations', label: 'Constelação Familiar' },
  { id: 'thetahealing', label: 'Thetahealing' },
  { id: 'cbt', label: 'Terapia Cognitivo-Comportamental (TCC)' },
  { id: 'hypnotherapy', label: 'Hipnoterapia' },
  { id: 'reiki', label: 'Reiki' },
  { id: 'nlp', label: 'PNL (Programação Neurolinguística)' },
  { id: 'meditation', label: 'Meditação Guiada' },
  { id: 'eft', label: 'EFT (Técnica de Libertação Emocional)' },
  { id: 'psychotherapy', label: 'Psicoterapia Tradicional' },
  { id: 'aromatherapy', label: 'Aromaterapia' },
  { id: 'tarot', label: 'Tarô' },
  { id: 'radionic-table', label: 'Mesa Radiônica' }
];

// Formatar preço 
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para construir URL completa de imagens
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Se já for uma URL completa, retorna como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Se começar com barra, remove para evitar dupla barra
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // Detectar se está em localhost e usar a porta do backend (3000)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const baseUrl = window.location.origin.replace('3001', '3000');
    return `${baseUrl}/${cleanPath}`;
  }
  
  // Retorna a URL completa usando a URL base da API
  return `${import.meta.env.VITE_API_URL}/${cleanPath}`;
}; 