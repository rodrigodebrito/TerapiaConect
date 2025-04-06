const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('rodrigo', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: { 
        password: hashedPassword,
        role: 'ADMIN'
      },
      create: {
        email: 'admin@admin.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN'
      }
    });
    
    console.log('Admin criado com sucesso:', admin);
  } catch (error) {
    console.error('Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 