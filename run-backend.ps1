# Script para iniciar o backend do TerapiaConect localmente
Write-Host "Iniciando backend do TerapiaConect..." -ForegroundColor Green

# Verificar se o container do PostgreSQL está rodando
$dbRunning = docker ps | Select-String "terapiaconect-db"
if (!$dbRunning) {
    Write-Host "Atenção: O banco de dados PostgreSQL não parece estar rodando." -ForegroundColor Yellow
    Write-Host "Execute primeiro o script ./run-postgresql.ps1" -ForegroundColor Yellow
    
    $continue = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

# Navegar para o diretório do backend
Set-Location ./backend

# Verificar se as dependências estão instaladas
if (!(Test-Path "./node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Configurar variável de ambiente para conexão com o PostgreSQL no Docker
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/terapiaconect"

# Gerar Prisma Client se necessário
npx prisma generate

# Iniciar o backend
Write-Host "Iniciando o backend na porta 3000..." -ForegroundColor Yellow
npm start 