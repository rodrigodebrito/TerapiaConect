# Script para iniciar apenas o PostgreSQL no Docker
Write-Host "Iniciando PostgreSQL para TerapiaConect..." -ForegroundColor Green

# Verificar se o Docker está rodando
try {
    docker info | Out-Null
    Write-Host "Docker está rodando." -ForegroundColor Green
}
catch {
    Write-Host "Erro: Docker não está rodando. Por favor, inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se já existe um container com o mesmo nome
$existingContainer = docker ps -a | Select-String "terapiaconect-db"
if ($existingContainer) {
    Write-Host "Container 'terapiaconect-db' já existe." -ForegroundColor Yellow
    
    # Verificar se o container está rodando
    $runningContainer = docker ps | Select-String "terapiaconect-db"
    if ($runningContainer) {
        Write-Host "Container já está rodando!" -ForegroundColor Green
    } else {
        Write-Host "Iniciando container existente..." -ForegroundColor Yellow
        docker start terapiaconect-db
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Container iniciado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "Erro ao iniciar container. Tentando recriá-lo..." -ForegroundColor Yellow
            docker rm terapiaconect-db
            
            # Iniciar novo container
            Write-Host "Criando novo container PostgreSQL..." -ForegroundColor Yellow
            docker run --name terapiaconect-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=terapiaconect -p 5432:5432 -d postgres:13-alpine
        }
    }
} else {
    # Iniciar o PostgreSQL
    Write-Host "Iniciando PostgreSQL na porta 5432..." -ForegroundColor Yellow
    docker run --name terapiaconect-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=terapiaconect -p 5432:5432 -d postgres:13-alpine
}

# Verificar se o container está rodando
$isRunning = docker ps | Select-String "terapiaconect-db"
if ($isRunning) {
    Write-Host "PostgreSQL iniciado com sucesso!" -ForegroundColor Green
    Write-Host "Banco de dados disponível em: localhost:5432" -ForegroundColor Cyan
    Write-Host "  Nome do banco: terapiaconect" -ForegroundColor Cyan
    Write-Host "  Usuário: postgres" -ForegroundColor Cyan
    Write-Host "  Senha: postgres" -ForegroundColor Cyan
} else {
    Write-Host "Erro ao iniciar PostgreSQL." -ForegroundColor Red
}

Write-Host ""
Write-Host "Para parar o container, execute:" -ForegroundColor Yellow
Write-Host "docker stop terapiaconect-db" -ForegroundColor Cyan 