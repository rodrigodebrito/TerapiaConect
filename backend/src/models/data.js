/**
 * Dados de exemplo para desenvolvimento
 * 
 * Este arquivo contém dados para testes e desenvolvimento.
 * Em um ambiente de produção, esses dados estariam em um banco de dados PostgreSQL.
 */

// Usuários
let users = [
  {
    id: "1",
    email: "admin@example.com",
    password: "$2a$10$EwtnOBXlfTfnqR2gJvdKeuV0YoWxJ4xEYBQjL7.5YUNNyR7kLVP5m", // "admin123"
    name: "Administrador",
    role: "ADMIN",
    createdAt: new Date("2023-01-01")
  },
  {
    id: "2",
    email: "terapeuta@example.com",
    password: "$2a$10$EwtnOBXlfTfnqR2gJvdKeuV0YoWxJ4xEYBQjL7.5YUNNyR7kLVP5m", // "terapeuta123"
    name: "João Silva",
    role: "THERAPIST",
    createdAt: new Date("2023-01-15")
  },
  {
    id: "3",
    email: "cliente@example.com",
    password: "$2a$10$EwtnOBXlfTfnqR2gJvdKeuV0YoWxJ4xEYBQjL7.5YUNNyR7kLVP5m", // "cliente123"
    name: "Maria Oliveira",
    role: "CLIENT",
    createdAt: new Date("2023-02-01")
  },
  {
    id: "4",
    email: "terapeuta2@example.com",
    password: "$2a$10$EwtnOBXlfTfnqR2gJvdKeuV0YoWxJ4xEYBQjL7.5YUNNyR7kLVP5m", // "terapeuta123"
    name: "Ana Souza",
    role: "THERAPIST",
    createdAt: new Date("2023-02-15")
  },
  {
    id: "5",
    email: "cliente2@example.com",
    password: "$2a$10$EwtnOBXlfTfnqR2gJvdKeuV0YoWxJ4xEYBQjL7.5YUNNyR7kLVP5m", // "cliente123"
    name: "Carlos Santos",
    role: "CLIENT",
    createdAt: new Date("2023-03-01")
  }
];

// Perfis de terapeutas
let therapists = [
  {
    id: "1",
    userId: "2",
    bio: "Terapeuta especializado em terapia cognitivo-comportamental com 10 anos de experiência.",
    specialties: ["Ansiedade", "Depressão", "Estresse"],
    education: "Doutorado em Psicologia Clínica",
    experience: "10 anos de atuação em clínica particular",
    sessionPrice: 200.00,
    sessionDuration: 50, // em minutos
    isApproved: true,
    createdAt: new Date("2023-01-15")
  },
  {
    id: "2",
    userId: "4",
    bio: "Especialista em terapia familiar sistêmica e constelação familiar.",
    specialties: ["Terapia familiar", "Constelação familiar", "Relacionamentos"],
    education: "Mestrado em Terapia Familiar",
    experience: "7 anos de experiência com casais e famílias",
    sessionPrice: 180.00,
    sessionDuration: 60, // em minutos
    isApproved: true,
    createdAt: new Date("2023-02-15")
  }
];

// Perfis de clientes
let clients = [
  {
    id: "1",
    userId: "3",
    preferences: ["Terapia online", "Horário noturno"],
    notes: "Prefere sessões pela manhã",
    createdAt: new Date("2023-02-01")
  },
  {
    id: "2",
    userId: "5",
    preferences: ["Terapia presencial", "Terapia de casal"],
    notes: "Disponível apenas nos fins de semana",
    createdAt: new Date("2023-03-01")
  }
];

// Disponibilidade dos terapeutas
let availability = [
  {
    id: "1",
    therapistId: "1",
    dayOfWeek: 1, // Segunda-feira
    startTime: "09:00",
    endTime: "17:00",
    isRecurring: true
  },
  {
    id: "2",
    therapistId: "1",
    dayOfWeek: 3, // Quarta-feira
    startTime: "10:00",
    endTime: "19:00",
    isRecurring: true
  },
  {
    id: "3",
    therapistId: "1",
    dayOfWeek: 5, // Sexta-feira
    startTime: "08:00",
    endTime: "15:00",
    isRecurring: true
  },
  {
    id: "4",
    therapistId: "2",
    dayOfWeek: 2, // Terça-feira
    startTime: "13:00",
    endTime: "20:00",
    isRecurring: true
  },
  {
    id: "5",
    therapistId: "2",
    dayOfWeek: 4, // Quinta-feira
    startTime: "09:00",
    endTime: "17:00",
    isRecurring: true
  },
  {
    id: "6",
    therapistId: "2",
    dayOfWeek: 6, // Sábado
    startTime: "09:00",
    endTime: "12:00",
    isRecurring: true
  }
];

// Agendamentos
let appointments = [
  {
    id: "1",
    therapistId: "1",
    clientId: "1",
    date: new Date("2023-04-10T10:00:00"),
    endDate: new Date("2023-04-10T11:00:00"),
    status: "CONFIRMED",
    notes: "Primeira sessão",
    createdAt: new Date("2023-04-01")
  },
  {
    id: "2",
    therapistId: "1",
    clientId: "1",
    date: new Date("2023-04-17T10:00:00"),
    endDate: new Date("2023-04-17T11:00:00"),
    status: "CONFIRMED",
    notes: "Sessão de acompanhamento",
    createdAt: new Date("2023-04-05")
  },
  {
    id: "3",
    therapistId: "2",
    clientId: "2",
    date: new Date("2023-04-11T14:00:00"),
    endDate: new Date("2023-04-11T15:00:00"),
    status: "CONFIRMED",
    notes: "Terapia de casal - trazer parceiro(a)",
    createdAt: new Date("2023-04-03")
  }
];

// Notificações
let notifications = [
  {
    id: "1",
    userId: "3",
    title: "Agendamento confirmado",
    message: "Sua sessão com João Silva foi confirmada para 10/04/2023 às 10:00",
    isRead: false,
    createdAt: new Date("2023-04-01")
  },
  {
    id: "2",
    userId: "2",
    title: "Novo agendamento",
    message: "Maria Oliveira agendou uma sessão para 10/04/2023 às 10:00",
    isRead: true,
    createdAt: new Date("2023-04-01")
  },
  {
    id: "3",
    userId: "3",
    title: "Lembrete de sessão",
    message: "Sua sessão com João Silva será amanhã às 10:00",
    isRead: false,
    createdAt: new Date("2023-04-09")
  }
];

module.exports = {
  users,
  therapists,
  clients,
  availability,
  appointments,
  notifications,
  
  // Funções para manipular os dados (simulando um banco de dados)
  findUserByEmail: (email) => users.find(u => u.email === email),
  findUserById: (id) => users.find(u => u.id === id),
  
  findTherapistById: (id) => therapists.find(t => t.id === id),
  findTherapistByUserId: (userId) => therapists.find(t => t.userId === userId),
  getAllTherapists: () => therapists.filter(t => t.isApproved),
  
  findClientById: (id) => clients.find(c => c.id === id),
  findClientByUserId: (userId) => clients.find(c => c.userId === userId),
  
  getTherapistAvailability: (therapistId) => availability.filter(a => a.therapistId === therapistId),
  updateTherapistAvailability: (therapistId, newAvailability) => {
    // Remover disponibilidade existente
    availability = availability.filter(a => a.therapistId !== therapistId);
    // Adicionar nova disponibilidade
    availability = [...availability, ...newAvailability.map((a, index) => ({
      id: `${Date.now()}-${index}`,
      therapistId,
      ...a
    }))];
    return availability.filter(a => a.therapistId === therapistId);
  },
  
  getAppointmentsByTherapist: (therapistId) => {
    const therapistAppointments = appointments.filter(a => a.therapistId === therapistId);
    return therapistAppointments.map(appointment => {
      const client = clients.find(c => c.id === appointment.clientId);
      const user = client ? users.find(u => u.id === client.userId) : null;
      
      return {
        ...appointment,
        client: user ? {
          id: client.id,
          name: user.name
        } : null
      };
    });
  },
  
  getAppointmentsByClient: (clientId) => appointments.filter(a => a.clientId === clientId),
  
  createAppointment: (appointment) => {
    const newAppointment = {
      id: `${Date.now()}`,
      ...appointment,
      createdAt: new Date()
    };
    appointments.push(newAppointment);
    return newAppointment;
  },
  
  getUserNotifications: (userId) => notifications.filter(n => n.userId === userId),
  createNotification: (notification) => {
    const newNotification = {
      id: `${Date.now()}`,
      ...notification,
      isRead: false,
      createdAt: new Date()
    };
    notifications.push(newNotification);
    return newNotification;
  },
  markNotificationAsRead: (id) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
    }
    return notification;
  }
}; 