# Script simplificado para TerapiaConect

Write-Host "=== TerapiaConect - Menu Simples ===" -ForegroundColor Cyan
Write-Host "1: Iniciar Backend" -ForegroundColor Green
Write-Host "2: Verificar Requisitos" -ForegroundColor Yellow
Write-Host "Q: Sair" -ForegroundColor Red

$opcao = Read-Host "Escolha uma opcao"

if ($opcao -eq "1") {
    Write-Host "Iniciando backend..." -ForegroundColor Green
    Set-Location ./backend
    
    # Configurar PostgreSQL local
    $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/terapiaconect"
    
    # Gerar Prisma Client
    npx prisma generate
    
    # Iniciar o backend
    npm start
}
elseif ($opcao -eq "2") {
    Write-Host "Verificando requisitos..." -ForegroundColor Yellow
    
    # Verificar Node.js
    try {
        $nodeVersion = node -v
        Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "Node.js nao encontrado" -ForegroundColor Red
    }
    
    # Verificar PostgreSQL
    try {
        $pgVersion = psql --version
        Write-Host "PostgreSQL: $pgVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "PostgreSQL nao encontrado" -ForegroundColor Red
    }
    
    # Verificar banco de dados
    if (Test-Path "./backend/prisma") {
        Write-Host "Prisma encontrado" -ForegroundColor Green
    }
    else {
        Write-Host "Prisma nao encontrado" -ForegroundColor Red
    }
    
    Pause
}
elseif ($opcao -eq "Q" -or $opcao -eq "q") {
    Write-Host "Saindo..." -ForegroundColor Red
}
else {
    Write-Host "Opcao invalida!" -ForegroundColor Red
    Pause
} 