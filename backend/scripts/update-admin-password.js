const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    // Buscar o usuário admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('Não foi encontrado nenhum usuário administrador');
      return;
    }

    // Criptografar a nova senha
    const newPassword = 'rodrigo';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar a senha no banco de dados
    const updatedAdmin = await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });

    console.log('==== SENHA ATUALIZADA COM SUCESSO ====');
    console.log('Email:', admin.email);
    console.log('ID:', admin.id);
    console.log('Nova senha: rodrigo');

  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword(); 