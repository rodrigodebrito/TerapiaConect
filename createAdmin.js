// Script para criar usuário administrador
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('rodrigo', saltRounds);
    
    // Verificar se o admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: 'admin@plataformaterapeuta.com'
      }
    });
    
    if (existingAdmin) {
      console.log('Admin já existe. Atualizando senha...');
      await prisma.user.update({
        where: {
          email: 'admin@plataformaterapeuta.com'
        },
        data: {
          password: hashedPassword
        }
      });
      console.log('Senha do admin atualizada com sucesso!');
    } else {
      // Criar novo usuário admin
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@plataformaterapeuta.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN'
        }
      });
      
      console.log('Usuário admin criado com sucesso!');
      console.log('ID:', newAdmin.id);
    }
  } catch (error) {
    console.error('Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 