# Script para iniciar o backend do TerapiaConect com PostgreSQL local
Write-Host "============================================" -ForegroundColor Green
Write-Host "INICIANDO BACKEND COM POSTGRESQL LOCAL" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Navegar para o diretório do backend
Write-Host "`n[1/6] Verificando diretório..." -ForegroundColor Cyan
$currentPath = Get-Location
Write-Host "Diretório atual: $currentPath" -ForegroundColor White
Set-Location ./backend
Write-Host "Diretório alterado para: $(Get-Location)" -ForegroundColor Green

# Verificar se as dependências estão instaladas
Write-Host "`n[2/6] Verificando dependências..." -ForegroundColor Cyan
if (!(Test-Path "./node_modules")) {
    Write-Host "Pasta node_modules não encontrada!" -ForegroundColor Red
    Write-Host "Instalando dependências... (isso pode demorar alguns minutos)" -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao instalar dependências. Código de saída: $LASTEXITCODE" -ForegroundColor Red
        Read-Host "Pressione Enter para voltar ao menu principal"
        Set-Location ..
        return
    }
    Write-Host "Dependências instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Dependências já instaladas!" -ForegroundColor Green
}

# Verificar se o PostgreSQL está acessível
Write-Host "`n[3/6] Verificando conexão com PostgreSQL..." -ForegroundColor Cyan

# Configurar variáveis de ambiente para o PostgreSQL local
$dbUser = "postgres"
$dbPassword = "postgres" 
$dbName = "terapiaconect"
$dbPort = "5432"
$dbHost = "localhost"

$env:DATABASE_URL = "postgresql://$dbUser:$dbPassword@$dbHost:$dbPort/$dbName"

Write-Host "Configuração do banco de dados:" -ForegroundColor White
Write-Host "  Host: $dbHost" -ForegroundColor White 
Write-Host "  Porta: $dbPort" -ForegroundColor White
Write-Host "  Banco: $dbName" -ForegroundColor White
Write-Host "  Usuário: $dbUser" -ForegroundColor White
Write-Host "  String de conexão: $env:DATABASE_URL" -ForegroundColor White

# Tentar conectar ao PostgreSQL usando o psql (se disponível)
try {
    Write-Host "Tentando conectar ao PostgreSQL..." -ForegroundColor Yellow
    $testConnection = $null
    
    # Tentar usar o psql para testar a conexão
    $testConnection = Invoke-Expression "psql -h $dbHost -U $dbUser -p $dbPort -d $dbName -c '\conninfo'" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Conexão com PostgreSQL bem-sucedida!" -ForegroundColor Green
    } else {
        Write-Host "Não foi possível conectar ao PostgreSQL usando psql." -ForegroundColor Yellow
        Write-Host "Erro: $testConnection" -ForegroundColor Yellow
        Write-Host "Tentando continuar mesmo assim..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Comando psql não encontrado ou erro de conexão." -ForegroundColor Yellow
    Write-Host "Erro: $_" -ForegroundColor Yellow
    Write-Host "Tentando continuar mesmo assim..." -ForegroundColor Yellow
}

# Gerar Prisma Client
Write-Host "`n[4/6] Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao gerar Prisma Client. Código de saída: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Verifique se seu PostgreSQL está configurado corretamente." -ForegroundColor Red
    Read-Host "Pressione Enter para voltar ao menu principal"
    Set-Location ..
    return
}
Write-Host "Prisma Client gerado com sucesso!" -ForegroundColor Green

# Verificar arquivo .env
Write-Host "`n[5/6] Verificando arquivo .env..." -ForegroundColor Cyan
if (Test-Path "./.env") {
    $envContent = Get-Content -Path "./.env" -Raw
    # Salvar o .env original
    Copy-Item -Path "./.env" -Destination "./.env.original" -Force
    Write-Host "Backup do .env original salvo como .env.original" -ForegroundColor Green
    
    # Atualizar a string de conexão do banco de dados no .env
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$env:DATABASE_URL"
    $envContent | Out-File -FilePath "./.env" -Encoding utf8
    Write-Host "Arquivo .env atualizado com sucesso!" -ForegroundColor Green
    Write-Host "URL do banco de dados atualizada para: $env:DATABASE_URL" -ForegroundColor Green
} else {
    Write-Host "Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Criando novo arquivo .env..." -ForegroundColor Yellow
    
    # Criar arquivo .env básico
    @"
DATABASE_URL=$env:DATABASE_URL
"@ | Out-File -FilePath "./.env" -Encoding utf8
    
    Write-Host "Arquivo .env criado com sucesso!" -ForegroundColor Green
}

# Iniciar o backend
Write-Host "`n[6/6] Iniciando o backend na porta 3000..." -ForegroundColor Cyan
Write-Host "Acesse http://localhost:3000 quando o servidor estiver pronto" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
Write-Host "INICIANDO SERVIDOR NODE.JS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
npm start 