/**
 * Script para criar o usuário administrador inicial
 * 
 * Este script verifica se existe um usuário admin no sistema.
 * Se não existir, cria um novo usuário com as credenciais definidas no .env
 * 
 * Para executar:
 * node src/utils/createAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

async function createAdmin() {
  try {
    console.log('Verificando usuário admin existente...');
    
    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (existingAdmin) {
      console.log('Um usuário admin já existe no sistema.');
      console.log(`Nome: ${existingAdmin.name}`);
      console.log(`Email: ${existingAdmin.email}`);
      return;
    }
    
    // Obter dados do .env
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@plataformaterapeuta.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';
    const adminName = process.env.ADMIN_NAME || 'Administrador';
    
    // Preparar dados do usuário
    const userData = {
      name: adminName,
      email: adminEmail,
      role: 'ADMIN',
      password: await bcrypt.hash(adminPassword, 10)
    };
    
    // Criar o usuário admin
    const admin = await prisma.user.create({
      data: userData
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`Nome: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`ID: ${admin.id}`);
    console.log('⚠️ IMPORTANTE: Altere a senha após o primeiro login por questões de segurança.');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função
createAdmin(); 