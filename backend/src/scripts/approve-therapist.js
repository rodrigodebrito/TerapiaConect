/**
 * Script para aprovar o terapeuta com email britoforex@gmail.com
 * Execute com: node src/scripts/approve-therapist.js
 */

const prisma = require('../utils/prisma');

async function main() {
  try {
    console.log('Iniciando script de aprovação de terapeuta');
    
    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: 'britoforex@gmail.com' },
      include: { therapist: true }
    });
    
    if (!user) {
      console.log('Usuário com email britoforex@gmail.com não encontrado');
      return;
    }
    
    console.log(`Usuário encontrado: ${user.name} (ID: ${user.id})`);
    
    // Verificar se já é terapeuta
    if (!user.therapist) {
      console.log('Este usuário não tem perfil de terapeuta');
      return;
    }
    
    console.log(`Terapeuta encontrado: ID ${user.therapist.id}, Status de aprovação: ${user.therapist.isApproved ? 'Aprovado' : 'Pendente'}`);
    
    // Atualizar status para aprovado
    if (!user.therapist.isApproved) {
      const updatedTherapist = await prisma.therapist.update({
        where: { id: user.therapist.id },
        data: { isApproved: true }
      });
      
      console.log('Terapeuta aprovado com sucesso!');
      console.log('Detalhes atualizados:', updatedTherapist);
    } else {
      console.log('O terapeuta já está aprovado, nenhuma alteração necessária');
    }
    
    // Listar todos os terapeutas aprovados para verificação
    const approvedTherapists = await prisma.therapist.findMany({
      where: { isApproved: true },
      include: { user: true }
    });
    
    console.log(`\nTotal de terapeutas aprovados: ${approvedTherapists.length}`);
    
    approvedTherapists.forEach((t, index) => {
      console.log(`${index + 1}. ${t.user.name} (${t.user.email})`);
    });
    
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 