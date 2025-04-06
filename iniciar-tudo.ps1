# Script completo para configurar e iniciar o TerapiaConect

Write-Host "=== TerapiaConect - Inicio Rapido ===" -ForegroundColor Cyan
Write-Host "Este script configura o PostgreSQL e inicia o backend automaticamente" -ForegroundColor Yellow

# Definir a string de conexao fixa
$connectionString = "postgresql://postgres:sistemainfo@localhost:5432/constelacao?schema=public"

Write-Host "Usando string de conexao:" -ForegroundColor Green
Write-Host $connectionString -ForegroundColor Yellow

# Verificar se o backend existe
if (!(Test-Path "./backend")) {
    Write-Host "Diretorio backend nao encontrado!" -ForegroundColor Red
    exit
}

# Atualizar .env no backend
$envPath = "./backend/.env"
if (Test-Path $envPath) {
    # Fazer backup do arquivo .env original se ainda nao existir
    if (!(Test-Path "$envPath.original")) {
        Copy-Item -Path $envPath -Destination "$envPath.original" -Force
        Write-Host "Backup do .env original criado como $envPath.original" -ForegroundColor Green
    }
    
    # Ler o conteudo atual do arquivo .env
    $envContent = Get-Content -Path $envPath -Raw
    
    # Substituir a linha DATABASE_URL
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$connectionString"
    
    # Salvar o novo conteudo no arquivo .env
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    
    Write-Host "Arquivo .env atualizado com as credenciais corretas!" -ForegroundColor Green
} else {
    Write-Host "Arquivo .env nao encontrado!" -ForegroundColor Red
    exit
}

# Navegar para o diretorio backend
Set-Location ./backend

# Verificar se as dependencias estao instaladas
if (!(Test-Path "./node_modules")) {
    Write-Host "`nInstalando dependencias (pode demorar alguns minutos)..." -ForegroundColor Yellow
    npm install
}

# Configurar a variavel de ambiente
$env:DATABASE_URL = $connectionString

# Gerar Prisma Client
Write-Host "`nGerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Verificar se o banco existe fazendo um pull
Write-Host "`nVerificando conexao com o banco de dados..." -ForegroundColor Yellow
npx prisma db pull

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nAtencao: Falha ao conectar com o banco de dados!" -ForegroundColor Red
    Write-Host "Verifique se:" -ForegroundColor Yellow
    Write-Host "1. O PostgreSQL esta rodando" -ForegroundColor Yellow
    Write-Host "2. O banco 'constelacao' existe" -ForegroundColor Yellow
    Write-Host "3. O usuario 'postgres' tem a senha 'sistemainfo'" -ForegroundColor Yellow
    
    $continuar = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continuar -ne "s") {
        Set-Location ..
        exit
    }
}

# Iniciar o backend
Write-Host "`n=== Iniciando Backend do TerapiaConect ===" -ForegroundColor Cyan
Write-Host "Iniciando servidor na porta 3000..." -ForegroundColor Green
Write-Host "Acesse http://localhost:3000 quando estiver pronto" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para encerrar o servidor" -ForegroundColor Yellow

npm start 