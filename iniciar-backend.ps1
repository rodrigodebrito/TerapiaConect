# Script para iniciar o backend do TerapiaConect

Write-Host "=== Iniciando Backend do TerapiaConect ===" -ForegroundColor Cyan

# Verificar se o backend existe
if (!(Test-Path "./backend")) {
    Write-Host "Diretorio backend nao encontrado!" -ForegroundColor Red
    exit
}

# Navegar para o diretorio backend
Set-Location ./backend

# Verificar se as dependencias estao instaladas
if (!(Test-Path "./node_modules")) {
    Write-Host "Instalando dependencias (pode demorar alguns minutos)..." -ForegroundColor Yellow
    npm install
}

# Verificar se o arquivo .env existe
if (!(Test-Path "./.env")) {
    Write-Host "Arquivo .env nao encontrado! Execute o script conectar-postgresql.ps1 primeiro." -ForegroundColor Red
    Set-Location ..
    exit
}

# Gerar o Prisma Client
Write-Host "Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Iniciar o backend
Write-Host "Iniciando servidor na porta 3000..." -ForegroundColor Green
Write-Host "Acesse http://localhost:3000 quando estiver pronto" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para encerrar o servidor" -ForegroundColor Yellow
npm start 