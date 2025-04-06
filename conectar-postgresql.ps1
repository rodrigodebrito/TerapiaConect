# Script para conectar ao PostgreSQL local

Write-Host "=== Configuracao do PostgreSQL ===" -ForegroundColor Cyan

# Solicitar informacoes do banco de dados
$dbUser = Read-Host "Usuario do PostgreSQL (padrao: postgres)"
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "Senha do PostgreSQL"
if ([string]::IsNullOrEmpty($dbPassword)) { 
    Write-Host "Senha nao pode ser vazia!" -ForegroundColor Red
    exit
}

$dbName = Read-Host "Nome do banco de dados (padrao: terapiaconect)"
if ([string]::IsNullOrEmpty($dbName)) { $dbName = "terapiaconect" }

$dbHost = Read-Host "Host do PostgreSQL (padrao: localhost)"
if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Porta do PostgreSQL (padrao: 5432)"
if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = "5432" }

# Construir a string de conexao
$connectionString = "postgresql://$dbUser:$dbPassword@$dbHost:$dbPort/$dbName"

Write-Host "`nString de conexao criada:" -ForegroundColor Green
Write-Host $connectionString -ForegroundColor Yellow

# Verificar se o backend existe
if (!(Test-Path "./backend")) {
    Write-Host "`nDiretorio backend nao encontrado!" -ForegroundColor Red
    exit
}

# Atualizar .env no backend
$envPath = "./backend/.env"
if (Test-Path $envPath) {
    # Fazer backup do arquivo .env original
    Copy-Item -Path $envPath -Destination "$envPath.backup" -Force
    Write-Host "`nBackup do .env criado como $envPath.backup" -ForegroundColor Green
    
    # Ler o conteudo atual do arquivo .env
    $envContent = Get-Content -Path $envPath -Raw
    
    # Substituir a linha DATABASE_URL
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$connectionString"
    
    # Salvar o novo conteudo no arquivo .env
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    
    Write-Host "`nArquivo .env atualizado com a nova conexao do PostgreSQL!" -ForegroundColor Green
} else {
    Write-Host "`nArquivo .env nao encontrado!" -ForegroundColor Red
}

# Testar a conexao
Set-Location ./backend
Write-Host "`nTestando conexao com o banco de dados..." -ForegroundColor Yellow

try {
    $env:DATABASE_URL = $connectionString
    npx prisma db pull
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nConexao com PostgreSQL bem-sucedida!" -ForegroundColor Green
    } else {
        Write-Host "`nFalha ao conectar com o PostgreSQL. Verifique suas credenciais." -ForegroundColor Red
    }
} catch {
    Write-Host "`nErro ao testar conexao: $_" -ForegroundColor Red
}

# Gerar Prisma Client
Write-Host "`nGerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`nPara iniciar o backend, execute:" -ForegroundColor Cyan
Write-Host "cd backend" -ForegroundColor Yellow
Write-Host "npm start" -ForegroundColor Yellow

Set-Location ..
Pause 