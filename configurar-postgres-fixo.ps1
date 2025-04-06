# Script para configurar o backend com credenciais fixas de PostgreSQL

Write-Host "=== Configurando PostgreSQL com credenciais especificas ===" -ForegroundColor Cyan

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
    # Fazer backup do arquivo .env original
    Copy-Item -Path $envPath -Destination "$envPath.backup" -Force
    Write-Host "Backup do .env criado como $envPath.backup" -ForegroundColor Green
    
    # Ler o conteudo atual do arquivo .env
    $envContent = Get-Content -Path $envPath -Raw
    
    # Substituir a linha DATABASE_URL
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$connectionString"
    
    # Salvar o novo conteudo no arquivo .env
    $envContent | Out-File -FilePath $envPath -Encoding utf8
    
    Write-Host "Arquivo .env atualizado com as credenciais corretas!" -ForegroundColor Green
} else {
    Write-Host "Arquivo .env nao encontrado!" -ForegroundColor Red
    
    # Criar arquivo .env basico
    @"
# ConfiguraÃ§Ãµes do Servidor
PORT=3000
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development
TESTING=false

# Banco de Dados
DATABASE_URL=$connectionString

"@ | Out-File -FilePath $envPath -Encoding utf8
    
    Write-Host "Arquivo .env criado com as credenciais corretas!" -ForegroundColor Green
}

# Navegar para o diretorio backend e testar a conexao
Set-Location ./backend
Write-Host "Testando conexao com o banco de dados..." -ForegroundColor Yellow

try {
    # Configurar a variavel de ambiente
    $env:DATABASE_URL = $connectionString
    
    # Testar a conexao
    Write-Host "Verificando conexao com o banco de dados..." -ForegroundColor Yellow
    npx prisma db pull
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Conexao com PostgreSQL bem-sucedida!" -ForegroundColor Green
        
        # Gerar Prisma Client
        Write-Host "Gerando Prisma Client..." -ForegroundColor Yellow
        npx prisma generate
        
        Write-Host "Configuracao concluida! Para iniciar o backend, execute:" -ForegroundColor Green
        Write-Host ".\iniciar-backend.ps1" -ForegroundColor Yellow
    } else {
        Write-Host "Falha ao conectar com o PostgreSQL." -ForegroundColor Red
        Write-Host "Verifique se o PostgreSQL esta rodando e se o banco 'constelacao' existe." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Erro ao testar conexao: $_" -ForegroundColor Red
}

# Voltar para o diretorio raiz
Set-Location ..

Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Cyan
Pause 