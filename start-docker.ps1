# Script PowerShell para iniciar o ambiente Docker do TerapiaConect

Write-Host "Iniciando ambiente Docker para TerapiaConect..." -ForegroundColor Green

# Verificar se o Docker está em execução
try {
    docker info | Out-Null
    Write-Host "Docker está em execução." -ForegroundColor Green
}
catch {
    Write-Host "Erro: Docker não está rodando ou não está instalado!" -ForegroundColor Red
    Write-Host "Por favor, inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    exit 1
}

# Construir e iniciar os contêineres
Write-Host "Construindo e iniciando contêineres..." -ForegroundColor Cyan
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Ambiente Docker iniciado com sucesso!" -ForegroundColor Green
    Write-Host "Backend disponível em: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Banco de dados PostgreSQL disponível em: localhost:5432" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para ver os logs em tempo real: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "Para parar o ambiente: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "Erro ao iniciar o ambiente Docker!" -ForegroundColor Red
} 