const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Função para gerar token JWT
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h' // Token válido por 24 horas
  });
}

async function loginAdmin() {
  try {
    // Configurar JWT_SECRET se não estiver definido
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'senha_secreta_para_desenvolvimento';
      console.log('AVISO: Usando chave JWT padrão para desenvolvimento. Em produção, defina JWT_SECRET no .env');
    }

    // Buscar o usuário admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('Não foi encontrado nenhum usuário administrador');
      return;
    }

    // Gerar token JWT
    const token = generateToken(admin);

    console.log('==== INFORMAÇÕES DE ACESSO ADMIN ====');
    console.log('Email:', admin.email);
    console.log('ID:', admin.id);
    console.log('Role:', admin.role);
    console.log('\n==== TOKEN JWT ====');
    console.log(token);
    console.log('\n==== COMO USAR ====');
    console.log('Copie esse token e use-o no cabeçalho de suas requisições:');
    console.log('Authorization: Bearer <token>');

    // Exemplo de uso com curl
    console.log('\n==== EXEMPLO COM CURL ====');
    console.log(`curl -X GET http://localhost:3000/api/training/materials -H "Authorization: Bearer ${token}"`);

    // Exemplo de uso com Postman
    console.log('\n==== EXEMPLO COM POSTMAN ====');
    console.log('1. Abra o Postman');
    console.log('2. Crie uma nova requisição GET para http://localhost:3000/api/training/materials');
    console.log('3. Na aba "Headers", adicione:');
    console.log('   - Key: Authorization');
    console.log(`   - Value: Bearer ${token}`);
    console.log('4. Clique em "Send"');

  } catch (error) {
    console.error('Erro ao gerar token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loginAdmin(); 