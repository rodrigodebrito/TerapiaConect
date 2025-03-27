const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar se já existe algum admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('Já existe um administrador:', existingAdmin.email);
      return;
    }

    // Criar um usuário admin
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@terapiaconect.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('Administrador criado com sucesso:');
    console.log('Email:', admin.email);
    console.log('Senha: Admin@123');
    console.log('ID:', admin.id);
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 