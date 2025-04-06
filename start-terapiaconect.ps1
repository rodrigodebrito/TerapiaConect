# Script principal para gerenciar o TerapiaConect
function Show-Menu {
    Clear-Host
    Write-Host "================ TerapiaConect ================" -ForegroundColor Cyan
    Write-Host " === BACKEND COM POSTGRESQL LOCAL ===" -ForegroundColor Green
    Write-Host "1: Iniciar Backend com PostgreSQL local (Recomendado)" -ForegroundColor Green
    Write-Host ""
    Write-Host " === OPCOES COM DOCKER ===" -ForegroundColor Yellow
    Write-Host "2: Iniciar PostgreSQL via Docker" -ForegroundColor Yellow
    Write-Host "3: Iniciar Backend com PostgreSQL Docker" -ForegroundColor Yellow
    Write-Host "4: Parar PostgreSQL Docker" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " === DESENVOLVIMENTO ===" -ForegroundColor Blue
    Write-Host "5: Iniciar Backend com SQLite (Sem PostgreSQL)" -ForegroundColor Blue
    Write-Host "6: Ver status dos servicos Docker" -ForegroundColor Blue
    Write-Host "7: Ver logs do PostgreSQL Docker" -ForegroundColor Blue
    Write-Host ""
    Write-Host " === BANCO DE DADOS ===" -ForegroundColor Magenta
    Write-Host "8: Executar Prisma Migrate" -ForegroundColor Magenta
    Write-Host "9: Executar Prisma Studio" -ForegroundColor Magenta
    Write-Host ""
    Write-Host " === MANUTENCAO ===" -ForegroundColor Red
    Write-Host "M: Corrigir problemas do Docker" -ForegroundColor Red
    Write-Host "R: Verificar requisitos" -ForegroundColor Red
    Write-Host "Q: Sair" -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "DICA: Para diagnosticar problemas, use a opcao R para verificar requisitos" -ForegroundColor DarkYellow
}

function Start-PostgreSQL-Docker {
    Write-Host "Iniciando PostgreSQL via Docker..." -ForegroundColor Yellow
    & .\run-postgresql.ps1
    Pause
}

function Start-Backend-Docker {
    Write-Host "Iniciando Backend com PostgreSQL Docker..." -ForegroundColor Yellow
    & .\run-backend.ps1
}

function Start-Backend-Local {
    Write-Host "Iniciando Backend com PostgreSQL local..." -ForegroundColor Green
    & .\run-backend-local-db.ps1
}

function Start-Backend-SQLite {
    Write-Host "Iniciando Backend com SQLite..." -ForegroundColor Yellow
    & .\run-backend-mock-db.ps1
}

function Stop-PostgreSQL-Docker {
    Write-Host "Parando PostgreSQL Docker..." -ForegroundColor Yellow
    docker stop terapiaconect-db
    docker rm terapiaconect-db
    Write-Host "PostgreSQL Docker parado." -ForegroundColor Green
    Pause
}

function Show-Status {
    Write-Host "Status dos servicos Docker:" -ForegroundColor Blue
    Write-Host "PostgreSQL:" -ForegroundColor Cyan
    docker ps --filter "name=terapiaconect-db" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Pause
}

function Show-Logs {
    Write-Host "Logs do PostgreSQL Docker:" -ForegroundColor Cyan
    docker logs terapiaconect-db --tail 50
    Pause
}

function Run-PrismaMigrate {
    Write-Host "Executando Prisma Migrate..." -ForegroundColor Magenta
    Set-Location ./backend
    
    # Perguntar qual banco usar
    Write-Host "Selecione o banco para migracoes:" -ForegroundColor Cyan
    Write-Host "1: PostgreSQL local" -ForegroundColor Green
    Write-Host "2: PostgreSQL Docker" -ForegroundColor Yellow
    Write-Host "3: SQLite" -ForegroundColor Blue
    $choice = Read-Host "Escolha"
    
    switch($choice) {
        '1' {
            $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/terapiaconect"
            Write-Host "Usando PostgreSQL local" -ForegroundColor Green
        }
        '2' {
            $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/terapiaconect"
            Write-Host "Usando PostgreSQL Docker" -ForegroundColor Yellow
        }
        '3' {
            $env:DATABASE_URL = "file:./dev.db"
            Write-Host "Usando SQLite" -ForegroundColor Blue
        }
        default {
            $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/terapiaconect"
            Write-Host "Usando PostgreSQL local (padrao)" -ForegroundColor Green
        }
    }
    
    npx prisma migrate dev
    Set-Location ..
    Pause
}

function Run-PrismaStudio {
    Write-Host "Executando Prisma Studio..." -ForegroundColor Magenta
    Set-Location ./backend
    
    # Perguntar qual banco usar
    Write-Host "Selecione o banco para visualizar:" -ForegroundColor Cyan
    Write-Host "1: PostgreSQL local" -ForegroundColor Green
    Write-Host "2: PostgreSQL Docker" -ForegroundColor Yellow
    Write-Host "3: SQLite" -ForegroundColor Blue
    Write-Host "4: Usar configuracao atual (.env)" -ForegroundColor Magenta
    $choice = Read-Host "Escolha"
    
    switch($choice) {
        '1' {
            $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/terapiaconect"
            Write-Host "Usando PostgreSQL local" -ForegroundColor Green
        }
        '2' {
            $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/terapiaconect"
            Write-Host "Usando PostgreSQL Docker" -ForegroundColor Yellow
        }
        '3' {
            $env:DATABASE_URL = "file:./dev.db"
            Write-Host "Usando SQLite" -ForegroundColor Blue
        }
        '4' {
            Write-Host "Usando configuracao atual do banco de dados" -ForegroundColor Magenta
        }
        default {
            Write-Host "Usando configuracao atual do banco de dados" -ForegroundColor Magenta
        }
    }
    
    Start-Process powershell -ArgumentList "-Command npx prisma studio"
    Set-Location ..
    Write-Host "Prisma Studio iniciado na porta 5555. Acesse: http://localhost:5555" -ForegroundColor Green
    Pause
}

function Fix-Docker {
    Write-Host "Corrigindo problemas do Docker..." -ForegroundColor Red
    & .\fix-docker.ps1
    Pause
}

function Check-Requirements {
    Clear-Host
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "VERIFICACAO DE REQUISITOS PARA TERAPIACONECT" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    
    # Verificar Node.js
    Write-Host "`nVerificando Node.js..." -ForegroundColor Yellow
    try {
        $nodeVersion = node -v
        Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ Node.js nao encontrado. Por favor, instale o Node.js (v18 ou superior)" -ForegroundColor Red
        Write-Host "  Download: https://nodejs.org/" -ForegroundColor Yellow
    }
    
    # Verificar npm
    Write-Host "`nVerificando npm..." -ForegroundColor Yellow
    try {
        $npmVersion = npm -v
        Write-Host "✓ npm instalado: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ npm nao encontrado. Deve ser instalado com o Node.js" -ForegroundColor Red
    }
    
    # Verificar PostgreSQL
    Write-Host "`nVerificando PostgreSQL local..." -ForegroundColor Yellow
    try {
        # Tentar usar o psql para verificar a versao
        $pgVersion = $null
        $pgVersion = Invoke-Expression "psql --version" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ PostgreSQL instalado: $pgVersion" -ForegroundColor Green
            
            # Tentar conectar ao banco de dados
            Write-Host "`nTentando conectar ao PostgreSQL..." -ForegroundColor Yellow
            $pgConnection = Invoke-Expression "psql -h localhost -U postgres -p 5432 -d postgres -c '\conninfo'" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Conexao com PostgreSQL bem-sucedida!" -ForegroundColor Green
                
                # Verificar se o banco terapiaconect existe
                $dbExists = Invoke-Expression "psql -h localhost -U postgres -p 5432 -d postgres -c 'SELECT 1 FROM pg_database WHERE datname = ''terapiaconect'''" 2>&1
                
                if ($dbExists -match "1 row") {
                    Write-Host "✓ Banco de dados 'terapiaconect' existe!" -ForegroundColor Green
                } else {
                    Write-Host "✗ Banco de dados 'terapiaconect' nao existe." -ForegroundColor Red
                    Write-Host "  Execute o comando: createdb -U postgres terapiaconect" -ForegroundColor Yellow
                }
            } else {
                Write-Host "✗ Nao foi possivel conectar ao PostgreSQL." -ForegroundColor Red
                Write-Host "  Erro: $pgConnection" -ForegroundColor Red
                Write-Host "  Verifique se o servico do PostgreSQL esta rodando" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✗ PostgreSQL nao encontrado ou nao esta no PATH" -ForegroundColor Red
            Write-Host "  Verifique se o PostgreSQL esta instalado e no PATH" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ PostgreSQL nao encontrado" -ForegroundColor Red
        Write-Host "  Erro: $_" -ForegroundColor Red
        Write-Host "  Download: https://www.postgresql.org/download/" -ForegroundColor Yellow
    }
    
    # Verificar Docker
    Write-Host "`nVerificando Docker..." -ForegroundColor Yellow
    try {
        $dockerVersion = docker --version
        Write-Host "✓ Docker instalado: $dockerVersion" -ForegroundColor Green
        
        # Verificar se o Docker esta rodando
        $dockerStatus = docker info
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Docker esta rodando" -ForegroundColor Green
        } else {
            Write-Host "✗ Docker nao esta rodando" -ForegroundColor Red
            Write-Host "  Inicie o Docker Desktop" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Docker nao encontrado ou nao esta no PATH" -ForegroundColor Red
        Write-Host "  Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    }
    
    # Verificar o diretorio backend
    Write-Host "`nVerificando a estrutura do projeto..." -ForegroundColor Yellow
    if (Test-Path "./backend") {
        Write-Host "✓ Diretorio 'backend' encontrado" -ForegroundColor Green
        
        # Verificar package.json
        if (Test-Path "./backend/package.json") {
            Write-Host "✓ package.json encontrado" -ForegroundColor Green
        } else {
            Write-Host "✗ package.json nao encontrado no diretorio backend" -ForegroundColor Red
        }
        
        # Verificar prisma
        if (Test-Path "./backend/prisma") {
            Write-Host "✓ Diretorio 'prisma' encontrado" -ForegroundColor Green
        } else {
            Write-Host "✗ Diretorio 'prisma' nao encontrado no diretorio backend" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Diretorio 'backend' nao encontrado" -ForegroundColor Red
        Write-Host "  Verifique se voce esta no diretorio raiz do projeto" -ForegroundColor Yellow
    }
    
    Write-Host "`n=============================================" -ForegroundColor Cyan
    Write-Host "RESUMO" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "Se todos os requisitos estiverem com ✓, voce esta pronto para executar o TerapiaConect."
    Write-Host "Caso contrario, siga as instrucoes para instalar os componentes necessarios."
    Write-Host "`n" -ForegroundColor Cyan
    Pause
}

# Loop principal do menu
do {
    Show-Menu
    $input = Read-Host "Por favor, faca sua escolha"
    
    switch ($input) {
        '1' { Start-Backend-Local }
        '2' { Start-PostgreSQL-Docker }
        '3' { Start-Backend-Docker }
        '4' { Stop-PostgreSQL-Docker }
        '5' { Start-Backend-SQLite }
        '6' { Show-Status }
        '7' { Show-Logs }
        '8' { Run-PrismaMigrate }
        '9' { Run-PrismaStudio }
        'm' { Fix-Docker }
        'M' { Fix-Docker }
        'r' { Check-Requirements }
        'R' { Check-Requirements }
        'q' { return }
        'Q' { return }
        default { Write-Host "Opcao invalida, tente novamente." -ForegroundColor Red; Pause }
    }
} while ($true) 