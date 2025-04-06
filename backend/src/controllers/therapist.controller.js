/**
 * Controlador de terapeutas
 * 
 * Este controlador gerencia as operações relacionadas a terapeutas.
 */

const prisma = require('../utils/prisma');

// Função para verificar se uma string é um JSON válido
function isJsonString(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Obter todos os terapeutas aprovados
const getAllTherapists = async (req, res) => {
  try {
    console.log('Recebendo requisição para buscar terapeutas:', req.query);
    const {
      attendanceMode,
      maxPrice,
      minPrice,
      targetAudience,
      offersFreeSession,
      searchTerm
    } = req.query;

    // Buscar todos os terapeutas primeiro
    try {
      // Primeiro, buscar todos os terapeutas aprovados
      const therapists = await prisma.therapist.findMany({
        where: {
          // isApproved: true  // Removendo restrição para testes
        },
        include: {
          user: true
        }
      });

      // Depois, aplicar os filtros em memória
      let filteredTherapists = therapists;

      // Filtrar por modo de atendimento
      if (attendanceMode && attendanceMode !== 'ALL') {
        filteredTherapists = filteredTherapists.filter(t => 
          t.attendanceMode === attendanceMode
        );
      }

      // Filtrar por preço máximo
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice);
        filteredTherapists = filteredTherapists.filter(t => 
          t.baseSessionPrice <= maxPriceNum
        );
      }

      // Filtrar por sessão gratuita
      if (offersFreeSession === 'true') {
        filteredTherapists = filteredTherapists.filter(t => 
          t.offersFreeSession === true
        );
      }

      // Filtrar por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredTherapists = filteredTherapists.filter(t => 
          t.user.name.toLowerCase().includes(searchLower) ||
          (t.shortBio && t.shortBio.toLowerCase().includes(searchLower))
        );
      }

      console.log(`Encontrados ${filteredTherapists.length} terapeutas após filtros`);
      
      // Mapear para o formato esperado pela API
      const mappedTherapists = filteredTherapists
        .map(therapist => {
          try {
            return {
              id: therapist.id,
              name: therapist.user.name || 'Nome não disponível',
              email: therapist.user.email || '',
              shortBio: therapist.shortBio || '',
              bio: therapist.bio || '',
              niches: therapist.niches || '[]',
              customNiches: therapist.customNiches || '[]',
              education: therapist.education || '',
              experience: therapist.experience || '',
              targetAudience: therapist.targetAudience || '',
              differential: therapist.differential || '',
              baseSessionPrice: parseFloat(therapist.baseSessionPrice) || 0,
              servicePrices: therapist.servicePrices || '[]',
              sessionDuration: parseInt(therapist.sessionDuration) || 60,
              attendanceMode: therapist.attendanceMode || 'BOTH',
              city: therapist.city || '',
              state: therapist.state || '',
              offersFreeSession: Boolean(therapist.offersFreeSession),
              freeSessionDuration: parseInt(therapist.freeSessionDuration) || 0,
              rating: parseFloat(therapist.rating) || 0,
              isApproved: Boolean(therapist.isApproved),
              profilePicture: therapist.profilePicture || null,
              reviewCount: 0
            };
          } catch (error) {
            console.error('Erro ao processar terapeuta:', therapist.id, error);
            return null;
          }
        })
        .filter(Boolean);

      console.log(`Retornando ${mappedTherapists.length} terapeutas mapeados`);
      return res.json(mappedTherapists);
    } catch (error) {
      console.error('Erro detalhado ao listar terapeutas:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta
      });
      return res.status(500).json({ 
        message: 'Erro ao buscar terapeutas',
        error: error.message,
        code: error.code
      });
    }
  } catch (error) {
    console.error('Erro detalhado ao listar terapeutas:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    return res.status(500).json({ 
      message: 'Erro ao buscar terapeutas',
      error: error.message,
      code: error.code
    });
  }
};

// Obter um terapeuta específico
const getTherapistById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const therapist = await prisma.therapist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tools: {
          include: {
            tool: true
          }
        }
      }
    });
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Verificação temporariamente desabilitada para testes
    // if (!therapist.isApproved) {
    //   return res.status(403).json({ message: 'Terapeuta não aprovado' });
    // }
    
    // Mapear para o formato esperado pela API
    const mappedTherapist = {
      id: therapist.id,
      userId: therapist.userId,
      name: therapist.user.name,
      email: therapist.user.email,
      shortBio: therapist.shortBio,
      niches: therapist.niches,
      customNiches: therapist.customNiches,
      customTools: therapist.customTools,
      education: therapist.education,
      experience: therapist.experience,
      targetAudience: therapist.targetAudience,
      differential: therapist.differential,
      baseSessionPrice: therapist.baseSessionPrice,
      servicePrices: therapist.servicePrices,
      sessionDuration: therapist.sessionDuration,
      profilePicture: therapist.profilePicture,
      // Adicionar ferramentas mapeadas
      tools: therapist.tools.map(tt => ({
        id: tt.tool.id,
        name: tt.tool.name,
        description: tt.tool.description || '',
        duration: tt.duration,
        price: tt.price
      }))
    };
    
    return res.json(mappedTherapist);
  } catch (error) {
    console.error('Erro ao buscar terapeuta:', error);
    return res.status(500).json({ message: 'Erro ao buscar dados do terapeuta' });
  }
};

// Obter disponibilidade de um terapeuta
const getTherapistAvailability = async (req, res) => {
  try {
    const { therapistId } = req.params;
    
    // Verificar se o terapeuta existe e está aprovado
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    });
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Verificação temporariamente desabilitada para testes
    // if (!therapist.isApproved) {
    //   return res.status(403).json({ message: 'Terapeuta não aprovado' });
    // }
    
    // Buscar disponibilidade
    const availability = await prisma.availability.findMany({
      where: { therapistId }
    });
    
    return res.json(availability);
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    return res.status(500).json({ message: 'Erro ao buscar disponibilidade do terapeuta' });
  }
};

// Atualizar disponibilidade do terapeuta
const updateTherapistAvailability = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { availability } = req.body;
    
    // Verificar se o terapeuta existe
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId }
    });
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Verificar se o usuário logado é o dono do perfil
    const userTherapist = await prisma.therapist.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!userTherapist || userTherapist.id !== therapistId) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este perfil' });
    }
    
    // Validar dados da disponibilidade
    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: 'A disponibilidade deve ser um array' });
    }
    
    // Atualizar disponibilidade (remover existente e adicionar nova)
    await prisma.$transaction([
      // Remover disponibilidade existente
      prisma.availability.deleteMany({
        where: { therapistId }
      }),
      
      // Adicionar nova disponibilidade
      ...availability.map(slot => 
        prisma.availability.create({
          data: {
            therapistId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isRecurring: slot.isRecurring || true
          }
        })
      )
    ]);
    
    // Buscar disponibilidade atualizada
    const updatedAvailability = await prisma.availability.findMany({
      where: { therapistId }
    });
    
    return res.json(updatedAvailability);
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    return res.status(500).json({ message: 'Erro ao atualizar disponibilidade do terapeuta' });
  }
};

// Atualizar perfil do terapeuta
const updateTherapistProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shortBio,
      bio,
      niches,
      customNiches,
      tools,
      customTools,
      education,
      experience,
      targetAudience,
      differential,
      baseSessionPrice,
      servicePrices,
      sessionDuration,
      attendanceMode,
      city,
      state,
      offersFreeSession,
      freeSessionDuration,
      profilePicture
    } = req.body;
    
    console.log('Received data for update:', {
      id,
      tools: JSON.stringify(tools),
      customTools: JSON.stringify(customTools),
      sessionDuration,
      baseSessionPrice
    });
    
    // Verificar se o terapeuta existe
    const therapist = await prisma.therapist.findUnique({
      where: { id }
    });
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Verificar se o usuário logado é o dono do perfil
    const userTherapist = await prisma.therapist.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!userTherapist || userTherapist.id !== id) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este perfil' });
    }

    // Preparar as conexões com ferramentas
    const toolConnections = Array.isArray(tools) ? tools.map(tool => ({
      toolId: tool.id,
      // Garantir que a duração e o preço são números válidos, caso contrário usar valor padrão
      duration: tool.duration ? parseInt(tool.duration) : (parseInt(sessionDuration) || 60),
      price: tool.price ? parseFloat(tool.price) : (parseFloat(baseSessionPrice) || 0)
    })) : [];

    console.log('Conexões de ferramentas a serem criadas:', JSON.stringify(toolConnections));

    // Atualizar perfil
    const updatedTherapist = await prisma.therapist.update({
      where: { id },
      data: {
        shortBio,
        bio,
        niches: Array.isArray(niches) ? JSON.stringify(niches) : niches,
        customNiches: Array.isArray(customNiches) ? JSON.stringify(customNiches) : customNiches,
        customTools: JSON.stringify(customTools || []),
        education,
        experience,
        targetAudience: Array.isArray(targetAudience) ? JSON.stringify(targetAudience) : targetAudience,
        differential,
        baseSessionPrice: parseFloat(baseSessionPrice) || 0,
        sessionDuration: parseInt(sessionDuration) || 60,
        attendanceMode,
        city,
        state,
        offersFreeSession,
        freeSessionDuration: parseInt(freeSessionDuration) || 30,
        profilePicture,
        // Primeiro excluir todas as ferramentas existentes e depois criar as novas
        tools: {
          deleteMany: {},  // Isso irá remover todas as relações existentes
          create: toolConnections  // Isso irá criar as novas relações
        }
      },
      include: {
        tools: {
          include: {
            tool: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Mapear a resposta para incluir as ferramentas com suas durações
    const response = {
      ...updatedTherapist,
      niches: JSON.parse(updatedTherapist.niches || '[]'),
      customNiches: JSON.parse(updatedTherapist.customNiches || '[]'),
      customTools: JSON.parse(updatedTherapist.customTools || '[]'),
      targetAudience: isJsonString(updatedTherapist.targetAudience) 
        ? JSON.parse(updatedTherapist.targetAudience || '[]') 
        : updatedTherapist.targetAudience || '',
      baseSessionPrice: parseFloat(updatedTherapist.baseSessionPrice) || 0,
      tools: updatedTherapist.tools.map(t => ({
        id: t.tool.id,
        name: t.tool.name,
        duration: t.duration,
        price: t.price
      }))
    };

    console.log('Resposta final (ferramentas atualizadas):', 
      JSON.stringify(response.tools));

    return res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil do terapeuta' });
  }
};

// Obter terapeuta pelo ID do usuário
const getTherapistByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário é o próprio ou um admin
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso não autorizado' });
    }
    
    const therapist = await prisma.therapist.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tools: {
          include: {
            tool: true
          }
        }
      }
    });
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Mapear para o formato esperado pela API
    const mappedTherapist = {
      id: therapist.id,
      userId: therapist.userId,
      name: therapist.user.name,
      email: therapist.user.email,
      shortBio: therapist.shortBio,
      niches: therapist.niches,
      customNiches: therapist.customNiches,
      customTools: therapist.customTools,
      education: therapist.education,
      experience: therapist.experience,
      targetAudience: therapist.targetAudience,
      differential: therapist.differential,
      baseSessionPrice: therapist.baseSessionPrice,
      servicePrices: therapist.servicePrices,
      sessionDuration: therapist.sessionDuration,
      profilePicture: therapist.profilePicture,
      isApproved: therapist.isApproved,
      attendanceMode: therapist.attendanceMode,
      city: therapist.city,
      state: therapist.state,
      offersFreeSession: therapist.offersFreeSession,
      freeSessionDuration: therapist.freeSessionDuration,
      // Adicionar ferramentas mapeadas
      tools: therapist.tools.map(tt => ({
        id: tt.tool.id,
        name: tt.tool.name,
        description: tt.tool.description || '',
        duration: tt.duration,
        price: tt.price
      }))
    };
    
    return res.json(mappedTherapist);
  } catch (error) {
    console.error('Erro ao buscar terapeuta por ID de usuário:', error);
    return res.status(500).json({ message: 'Erro ao buscar dados do terapeuta' });
  }
};

// Criar novo perfil de terapeuta
const createTherapist = async (req, res) => {
  try {
    const {
      shortBio,
      bio,
      niches,
      customNiches,
      tools,
      customTools,
      education,
      experience,
      targetAudience,
      differential,
      baseSessionPrice,
      servicePrices,
      sessionDuration,
      attendanceMode,
      city,
      state,
      offersFreeSession,
      freeSessionDuration
    } = req.body;

    // Verificar se já existe um perfil para este usuário
    const existingTherapist = await prisma.therapist.findUnique({
      where: { userId: req.user.id }
    });

    if (existingTherapist) {
      return res.status(400).json({ message: 'Você já possui um perfil de terapeuta' });
    }

    // Preparar as conexões com ferramentas
    const toolConnections = tools ? tools.map(tool => ({
      toolId: tool.id,
      duration: parseInt(tool.duration) || parseInt(sessionDuration) || 60,
      price: parseFloat(tool.price) || parseFloat(baseSessionPrice) || 0
    })) : [];

    console.log('Conexões de ferramentas:', toolConnections);

    // Criar o perfil do terapeuta
    const therapist = await prisma.therapist.create({
      data: {
        userId: req.user.id,
        shortBio,
        bio,
        niches: Array.isArray(niches) ? JSON.stringify(niches) : niches,
        customNiches: Array.isArray(customNiches) ? JSON.stringify(customNiches) : customNiches,
        customTools: JSON.stringify(customTools || []),
        education,
        experience,
        targetAudience: Array.isArray(targetAudience) ? JSON.stringify(targetAudience) : targetAudience,
        differential,
        baseSessionPrice: baseSessionPrice ? parseFloat(baseSessionPrice) : null,
        servicePrices: typeof servicePrices === 'object' ? JSON.stringify(servicePrices) : servicePrices,
        sessionDuration: parseInt(sessionDuration) || 60,
        attendanceMode: attendanceMode || 'BOTH',
        city,
        state,
        offersFreeSession: offersFreeSession || false,
        freeSessionDuration: freeSessionDuration ? parseInt(freeSessionDuration) : null,
        isApproved: false,
        rating: 0,
        tools: {
          create: toolConnections
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        tools: {
          include: {
            tool: true
          }
        }
      }
    });

    // Mapear para o formato esperado pela API
    const mappedTherapist = {
      id: therapist.id,
      userId: therapist.userId,
      name: therapist.user.name,
      email: therapist.user.email,
      shortBio: therapist.shortBio,
      bio: therapist.bio,
      niches: JSON.parse(therapist.niches || '[]'),
      customNiches: JSON.parse(therapist.customNiches || '[]'),
      tools: therapist.tools.map(tt => ({
        id: tt.tool.id,
        name: tt.tool.name,
        description: tt.tool.description,
        duration: tt.duration,
        price: tt.price
      })),
      customTools: JSON.parse(therapist.customTools || '[]'),
      education: therapist.education,
      experience: therapist.experience,
      targetAudience: isJsonString(therapist.targetAudience) 
        ? JSON.parse(therapist.targetAudience || '[]') 
        : therapist.targetAudience || '',
      differential: therapist.differential,
      baseSessionPrice: therapist.baseSessionPrice,
      servicePrices: therapist.servicePrices,
      sessionDuration: therapist.sessionDuration,
      attendanceMode: therapist.attendanceMode,
      city: therapist.city,
      state: therapist.state,
      offersFreeSession: therapist.offersFreeSession,
      freeSessionDuration: therapist.freeSessionDuration,
      profilePicture: therapist.profilePicture,
      isApproved: therapist.isApproved,
      rating: therapist.rating
    };

    return res.status(201).json(mappedTherapist);
  } catch (error) {
    console.error('Erro ao criar perfil de terapeuta:', error);
    return res.status(500).json({ message: 'Erro ao criar perfil de terapeuta' });
  }
};

// Upload de imagem de perfil
const uploadProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
    }
    
    // Verificar se o terapeuta existe
    const therapist = await prisma.therapist.findUnique({
      where: { id }
    });
    
    if (!therapist) {
      return res.status(404).json({ message: 'Terapeuta não encontrado' });
    }
    
    // Verificar se o usuário logado é o dono do perfil
    const userTherapist = await prisma.therapist.findUnique({
      where: { userId: req.user.id }
    });
    
    if (!userTherapist || userTherapist.id !== id) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar este perfil' });
    }
    
    // Construir a URL para a imagem
    const baseUrl = req.protocol + '://' + req.get('host');
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
    
    // Atualizar o perfil com a URL da imagem
    const updatedTherapist = await prisma.therapist.update({
      where: { id },
      data: {
        profilePicture: profilePictureUrl
      }
    });
    
    return res.json({
      message: 'Imagem de perfil atualizada com sucesso',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return res.status(500).json({ message: 'Erro ao fazer upload de imagem' });
  }
};

module.exports = {
  getAllTherapists,
  getTherapistById,
  getTherapistAvailability,
  updateTherapistAvailability,
  updateTherapistProfile,
  getTherapistByUserId,
  createTherapist,
  uploadProfilePicture
}; 