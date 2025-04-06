# Script para corrigir problemas comuns do Docker no Windows
Write-Host "========= Correção de problemas do Docker no Windows =========" -ForegroundColor Cyan

# Verificar se o Docker está rodando
try {
    docker info | Out-Null
    Write-Host "✓ Docker está rodando." -ForegroundColor Green
}
catch {
    Write-Host "✗ Docker não está rodando. Por favor, inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

# 1. Parar todos os contêineres Docker em execução
Write-Host "`nParando todos os contêineres em execução..." -ForegroundColor Yellow
docker stop $(docker ps -q)
Write-Host "✓ Contêineres parados." -ForegroundColor Green

# 2. Remover contêineres antigos
Write-Host "`nRemovendo contêineres antigos..." -ForegroundColor Yellow
docker rm $(docker ps -a -q)
Write-Host "✓ Contêineres removidos." -ForegroundColor Green

# 3. Limpar imagens não utilizadas
Write-Host "`nLimpando imagens não utilizadas..." -ForegroundColor Yellow
docker image prune -f
Write-Host "✓ Imagens não utilizadas removidas." -ForegroundColor Green

# 4. Limpar volumes não utilizados
Write-Host "`nLimpando volumes não utilizados..." -ForegroundColor Yellow
docker volume prune -f
Write-Host "✓ Volumes não utilizados removidos." -ForegroundColor Green

# 5. Reiniciar o serviço Docker
Write-Host "`nReiniciando o Docker..." -ForegroundColor Yellow
Write-Host "Por favor, siga estas etapas manuais:" -ForegroundColor Cyan
Write-Host "1. Clique com o botão direito no ícone do Docker na barra de tarefas" -ForegroundColor White
Write-Host "2. Selecione 'Restart Docker Desktop'" -ForegroundColor White
Write-Host "3. Aguarde o Docker reiniciar completamente" -ForegroundColor White

$confirmation = Read-Host "`nVocê já reiniciou o Docker manualmente? (s/n)"
if ($confirmation -ne 's') {
    Write-Host "Por favor, reinicie o Docker e execute este script novamente." -ForegroundColor Yellow
    exit 1
}

# 6. Reconstruir o projeto TerapiaConect
Write-Host "`nReconstruindo o PostgreSQL..." -ForegroundColor Yellow
docker run --name terapiaconect-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=terapiaconect -p 5432:5432 -d postgres:15-alpine

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL iniciado com sucesso!" -ForegroundColor Green
    Write-Host "Banco de dados disponível em: localhost:5432" -ForegroundColor Cyan
    Write-Host "  Nome do banco: terapiaconect" -ForegroundColor Cyan
    Write-Host "  Usuário: postgres" -ForegroundColor Cyan
    Write-Host "  Senha: postgres" -ForegroundColor Cyan
} else {
    Write-Host "✗ Erro ao iniciar PostgreSQL." -ForegroundColor Red
    exit 1
}

Write-Host "`n========= Instalação concluída com sucesso! =========" -ForegroundColor Cyan
Write-Host "Agora você pode executar o backend com:" -ForegroundColor Green
Write-Host ".\run-backend.ps1" -ForegroundColor Cyan
Write-Host "`nOu use o menu interativo:" -ForegroundColor Green
Write-Host ".\start-terapiaconect.ps1" -ForegroundColor Cyan 