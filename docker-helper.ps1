# Script de ajuda para gerenciar Docker no TerapiaConect

param (
    [string]$Command = "menu"
)

function Show-Menu {
    Clear-Host
    Write-Host "===== TerapiaConect Docker Helper =====" -ForegroundColor Cyan
    Write-Host "1. Iniciar serviços"
    Write-Host "2. Parar serviços"
    Write-Host "3. Reiniciar serviços"
    Write-Host "4. Ver logs"
    Write-Host "5. Ver status dos contêineres"
    Write-Host "6. Acessar shell do backend"
    Write-Host "7. Executar Prisma Migrate"
    Write-Host "8. Executar Prisma Generate"
    Write-Host "9. Executar Prisma Studio"
    Write-Host "10. Limpar todos os contêineres e volumes"
    Write-Host "0. Sair"
    Write-Host "====================================" -ForegroundColor Cyan
    
    $choice = Read-Host "Digite sua escolha"
    
    switch ($choice) {
        "1" { Start-Services }
        "2" { Stop-Services }
        "3" { Restart-Services }
        "4" { Show-Logs }
        "5" { Show-Status }
        "6" { Access-Backend-Shell }
        "7" { Run-Prisma-Migrate }
        "8" { Run-Prisma-Generate }
        "9" { Run-Prisma-Studio }
        "10" { Clean-All }
        "0" { Exit }
        default { 
            Write-Host "Opção inválida!" -ForegroundColor Red
            Start-Sleep -Seconds 2
            Show-Menu 
        }
    }
}

function Start-Services {
    Write-Host "Iniciando serviços..." -ForegroundColor Green
    docker-compose up -d --build
    Write-Host "Serviços iniciados!" -ForegroundColor Green
    Pause
}

function Stop-Services {
    Write-Host "Parando serviços..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "Serviços parados!" -ForegroundColor Yellow
    Pause
}

function Restart-Services {
    Write-Host "Reiniciando serviços..." -ForegroundColor Cyan
    docker-compose restart
    Write-Host "Serviços reiniciados!" -ForegroundColor Cyan
    Pause
}

function Show-Logs {
    Write-Host "Pressione Ctrl+C para sair dos logs" -ForegroundColor Yellow
    docker-compose logs -f
    Pause
}

function Show-Status {
    docker-compose ps
    Pause
}

function Access-Backend-Shell {
    Write-Host "Acessando shell do backend... (digite 'exit' para sair)" -ForegroundColor Cyan
    docker-compose exec backend sh
    Pause
}

function Run-Prisma-Migrate {
    Write-Host "Executando Prisma Migrate..." -ForegroundColor Cyan
    docker-compose exec backend npx prisma migrate dev
    Pause
}

function Run-Prisma-Generate {
    Write-Host "Executando Prisma Generate..." -ForegroundColor Cyan
    docker-compose exec backend npx prisma generate
    Pause
}

function Run-Prisma-Studio {
    Write-Host "Iniciando Prisma Studio..." -ForegroundColor Cyan
    Write-Host "Acesse http://localhost:5555 no seu navegador" -ForegroundColor Yellow
    docker-compose exec backend npx prisma studio
    Pause
}

function Clean-All {
    $confirmation = Read-Host "Isso irá remover TODOS os contêineres, imagens e volumes. Continuar? (s/n)"
    if ($confirmation -eq 's') {
        Write-Host "Removendo contêineres, imagens e volumes..." -ForegroundColor Red
        docker-compose down -v
        docker system prune -a --volumes --force
        Write-Host "Limpeza concluída!" -ForegroundColor Green
    } else {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
    }
    Pause
}

function Pause {
    Write-Host ""
    Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-Menu
}

# Execução principal
if ($Command -eq "menu") {
    Show-Menu
} else {
    switch ($Command) {
        "start" { Start-Services; Exit }
        "stop" { Stop-Services; Exit }
        "restart" { Restart-Services; Exit }
        "logs" { Show-Logs; Exit }
        "status" { Show-Status; Exit }
        "shell" { Access-Backend-Shell; Exit }
        "migrate" { Run-Prisma-Migrate; Exit }
        "generate" { Run-Prisma-Generate; Exit }
        "studio" { Run-Prisma-Studio; Exit }
        "clean" { Clean-All; Exit }
        default { 
            Write-Host "Comando desconhecido: $Command" -ForegroundColor Red
            Write-Host "Comandos disponíveis: start, stop, restart, logs, status, shell, migrate, generate, studio, clean" -ForegroundColor Yellow
            Exit 1
        }
    }
} 