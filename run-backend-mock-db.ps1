# Script para iniciar o backend do TerapiaConect com SQLite (sem Docker)
Write-Host "Iniciando backend do TerapiaConect com SQLite..." -ForegroundColor Green

# Navegar para o diretório do backend
Set-Location ./backend

# Verificar se já existe o arquivo .env.sqlite
if (!(Test-Path "./.env.sqlite")) {
    Write-Host "Criando arquivo .env.sqlite..." -ForegroundColor Yellow
    
    # Pegar conteúdo do .env atual
    $envContent = Get-Content -Path "./.env" -Raw
    
    # Substituir a string de conexão do banco de dados
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=file:./dev.db"
    
    # Salvar o novo conteúdo no arquivo .env.sqlite
    $envContent | Out-File -FilePath "./.env.sqlite" -Encoding utf8
    
    Write-Host "Arquivo .env.sqlite criado com sucesso!" -ForegroundColor Green
}

# Fazer backup do .env atual
if (Test-Path "./.env") {
    Copy-Item -Path "./.env" -Destination "./.env.backup" -Force
    Write-Host "Backup do .env criado como .env.backup" -ForegroundColor Cyan
}

# Copiar .env.sqlite para .env
Copy-Item -Path "./.env.sqlite" -Destination "./.env" -Force
Write-Host "Configuração SQLite aplicada" -ForegroundColor Green

# Verificar se as dependências estão instaladas
if (!(Test-Path "./node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Gerar Prisma Client
Write-Host "Gerando Prisma Client para SQLite..." -ForegroundColor Yellow
npx prisma generate

# Criar/atualizar banco de dados SQLite
Write-Host "Executando migrações no SQLite..." -ForegroundColor Yellow
npx prisma migrate dev --name sqlite-setup

# Iniciar o backend
Write-Host "Iniciando o backend na porta 3000..." -ForegroundColor Yellow
npm start 