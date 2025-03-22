# Documento de Handover - Projeto Constelação

## Resumo Executivo

Este documento apresenta uma análise completa e documentação do Projeto Constelação, uma plataforma que conecta terapeutas e clientes. 

Durante a análise foram identificados vários desafios que afetam a manutenibilidade e escalabilidade do projeto:

1. **Inconsistência de Nomenclatura**: O uso dos termos "constellators" e "therapists" para se referir à mesma entidade em diferentes partes do código causa confusão.
2. **Inconsistência nas URLs de API**: Múltiplas rotas e padrões são usados para as mesmas funcionalidades.
3. **Duplicação de Código**: Diversas implementações realizam as mesmas funcionalidades em diferentes arquivos.
4. **Problemas de Navegação**: Links incorretos resultam em erros de navegação.
5. **Arquivos de Teste em Produção**: Presença de código de teste na base de código principal.

Este documento fornece recomendações abrangentes para resolver esses problemas e melhorar a qualidade e sustentabilidade do código.

## Visão Geral do Projeto

O Projeto Constelação é uma plataforma que conecta terapeutas (constellators) e clientes, permitindo agendamento de sessões, gerenciamento de perfis e comunicação entre usuários.

## Estrutura do Projeto

O projeto está dividido em duas partes principais:

1. **constelacao-backend**: API backend baseada em NestJS
2. **constelacao-frontend**: Interface do usuário construída com Next.js

## Terminologia do Sistema

No sistema existem dois termos que são usados intercambiavelmente, o que pode causar confusão:

- **constellators**: Nome usado principalmente no backend e em algumas partes do frontend
- **therapists**: Nome usado principalmente no frontend para referir-se aos terapeutas

Esta duplicidade de termos pode levar a problemas de consistência em URLs e chamadas de API.

## Variáveis de Configuração

### Backend

- Porta: 3000
- CORS configurado para permitir origens: `http://localhost:3000`, `http://localhost:3001`

### Frontend

- API_BASE_URL: `http://localhost:3000` (em `app/config/api.ts`)
- API_URL: `http://localhost:3000/api` (em `config.ts`)
- AUTH_TOKEN_KEY: `auth_token`
- USER_DATA_KEY: `user_data`

## Mapeamento de Rotas

### Backend (NestJS)

#### Rotas de Terapeutas

- `GET /constellators/test` - Teste de autenticação (requer auth)
- `POST /constellators/profile` - Criar perfil de terapeuta (requer auth)
- `GET /constellators/profile` - Obter perfil do terapeuta logado (requer auth)
- `PATCH /constellators/profile` - Atualizar perfil de terapeuta (requer auth)
- `GET /constellators/:id` - Obter dados de um terapeuta específico
- `GET /constellators/public` - Listar terapeutas publicamente
- `GET /constellators/public/:id` - Obter perfil público de um terapeuta

#### Rotas de Sessões

- `GET /sessions/therapist` - Obter sessões do terapeuta
- `POST /sessions` - Criar uma nova sessão

### Frontend (Next.js API Routes)

#### API Routes

- `GET /api/therapists` - Lista terapeutas disponíveis
- `GET /api/therapists/public/:id` - Perfil público de um terapeuta
- `GET /api/constellators/:id/availability` - Disponibilidade de um terapeuta

#### Páginas

- `/therapist/[id]` - Página pública do perfil de um terapeuta
- `/dashboard/profile` - Página para edição do perfil do terapeuta
- `/dashboard/therapists` - Página de listagem de terapeutas
- `/dashboard/therapists/[id]` - Página de detalhes de um terapeuta específico

## Problemas e Inconsistências Identificados

### 1. Inconsistência de Nomenclatura

Existe uma inconsistência na nomenclatura entre "constellators" (backend) e "therapists" (frontend), o que pode causar confusão no desenvolvimento e manutenção do código.

**Afetado por este problema:**
- Rotas de API
- Componentes de UI
- Estrutura de diretórios

### 2. Problema nas URLs das API Calls

Algumas chamadas de API no frontend apontam para `/constellators/...` enquanto outras apontam para `/therapists/...`, o que pode causar problemas de integração.

**Exemplo:**
- `constelacao-frontend/app/dashboard/profile/page.tsx` usa `/constellators/profile`
- `constelacao-frontend/app/api/therapists/public/[id]/route.ts` usa `/constellators/public/${params.id}`

### 3. Possível Duplicação de Código e Funcionalidade

Existem múltiplas implementações para as mesmas funcionalidades, como:

- Múltiplas páginas de perfil de terapeuta (`/therapist/[id]` e `/dashboard/therapists/[id]`)
- Diferentes rotas para acesso a dados de terapeutas

**Arquivos duplicados ou com sobreposição:**

| Funcionalidade | Arquivos Relacionados | Observação |
|----------------|------------------------|------------|
| Perfil público de terapeuta | - `/app/therapist/[id]/page.tsx`<br>- `/dashboard/therapists/[id]/page.tsx` | Os dois arquivos servem propósitos semelhantes, mas com pequenas diferenças de implementação |
| API de listagem de terapeutas | - `/app/api/therapists/route.ts`<br>- `/app/api/constellators/route.ts` | Existem chamadas redundantes para o backend |
| Componentes de terapeuta | - `TherapistProfileCard.tsx`<br>- Outros componentes de UI | Possível duplicação de lógica de apresentação |

### 4. Erros na Navegação

A navegação do botão "Visualizar Meu Perfil" na página de perfil do terapeuta pode estar apontando para URLs inválidas, causando erros 404.

**Problema identificado:** No arquivo `app/dashboard/profile/page.tsx`, o botão "Visualizar Meu Perfil" direciona para `/therapist/${userData.id}`, mas essa rota pode não estar configurada corretamente ou não estar recebendo os dados necessários.

```typescript
// Em app/dashboard/profile/page.tsx
const handlePreviewProfile = (e: React.MouseEvent) => {
  e.preventDefault();
  
  // Verificar se o perfil foi salvo
  if (!profileData.name || !profileData.sessionPricing.basePrice) {
    toast.error('Você precisa preencher e salvar seu perfil antes de visualizá-lo');
    return;
  }
  
  // Abrir a página pública do perfil em uma nova aba
  if (userData?.id) {
    window.open(`/therapist/${userData.id}`, '_blank');  // Possível problema aqui
  } else {
    toast.error('Não foi possível abrir o perfil');
  }
};
```

### 5. Inconsistência na estrutura de diretórios API

A API proxy no frontend possui uma estrutura de diretórios confusa com mistura de `therapists` e `constellators`:

- `/app/api/therapists/` 
- `/app/api/constellators/`
- `/app/api/therapists/public/[id]`

Isto pode levar a confusão durante o desenvolvimento e causar erros ao migrar código entre diferentes partes do sistema.

## Arquivos Chave

### Backend

- `constelacao-backend/src/constellators/constellators.controller.ts` - Controlador principal para endpoints de terapeutas
- `constelacao-backend/src/constellators/constellators.service.ts` - Serviços relacionados a terapeutas
- `constelacao-backend/src/sessions/sessions.controller.ts` - Controlador para gerenciamento de sessões
- `constelacao-backend/src/main.ts` - Configuração do servidor backend

### Frontend

- `constelacao-frontend/app/therapist/[id]/page.tsx` - Página pública de perfil do terapeuta
- `constelacao-frontend/app/dashboard/profile/page.tsx` - Página de edição de perfil do terapeuta
- `constelacao-frontend/app/api/therapists/public/[id]/route.ts` - API route para acessar perfil público
- `constelacao-frontend/app/components/TherapistProfileCard.tsx` - Componente para exibir cards de terapeutas
- `constelacao-frontend/config.ts` - Configurações globais do frontend

## Recomendações

### 1. Padronização de Nomenclatura

Recomenda-se padronizar a nomenclatura, escolhendo entre "constellators" ou "therapists" e atualizando todas as ocorrências no código para evitar confusão.

**Opções:**
- Atualizar o backend para usar "therapists", alinhando com a interface do usuário
- Atualizar o frontend para usar "constellators", alinhando com o backend existente

### 2. Reorganização das Rotas de API

As rotas de API devem ser reorganizadas para seguir um padrão consistente:

```
/api/therapists         - Lista de terapeutas
/api/therapists/:id     - Detalhes de um terapeuta
/api/therapists/profile - Perfil do terapeuta logado
```

### 3. Documentação das URLs

Criar um documento centralizado que mapeia todas as URLs do sistema para facilitar a referência durante o desenvolvimento:

```
Backend:
- /constellators/profile (GET, POST, PATCH)
- /constellators/public (GET)
- /constellators/public/:id (GET)

Frontend API:
- /api/therapists (GET)
- /api/therapists/public/:id (GET)

Páginas:
- /therapist/:id
- /dashboard/therapists
- /dashboard/profile
```

### 4. Correção de URLs na Interface

Verificar e corrigir todas as URLs hardcoded na interface do usuário, especialmente nas chamadas de API e nos botões de navegação:

1. Verificar o botão "Visualizar Meu Perfil" na página de edição de perfil
2. Corrigir as chamadas de API para usar uma base URL consistente

### 5. Consolidação de Funcionalidades Duplicadas

Consolidar funcionalidades que estão duplicadas, mantendo apenas uma implementação:

- Unificar a lógica de exibição de perfil de terapeuta
- Consolidar as API routes relacionadas a terapeutas

## Fluxos Principais

### 1. Criação e Edição de Perfil de Terapeuta

1. Usuário faz login com uma conta de terapeuta
2. Acessa `/dashboard/profile`
3. Preenche dados do perfil (nome, bio, niches, tools, etc.)
4. Sistema faz uma chamada PATCH para `/api/constellators/profile`
5. Dados são salvos no backend

### 2. Visualização de Perfil Público

1. Cliente acessa `/therapist/:id`
2. Sistema faz uma chamada GET para `/api/therapists/public/:id`
3. Dados do terapeuta são exibidos, incluindo detalhes de serviços

### 3. Agendamento de Sessão

1. Cliente acessa a lista de terapeutas em `/dashboard/therapists`
2. Seleciona um terapeuta específico
3. Visualiza disponibilidade e preços
4. Agenda uma sessão, que é registrada no backend

## Considerações para o Futuro

1. **Padronização Completa**: Finalizar a padronização de nomenclatura em todo o projeto
2. **Testes Automatizados**: Implementar testes para garantir a integridade das rotas e chamadas de API
3. **Documentação API**: Criar uma documentação Swagger/OpenAPI para todas as rotas do backend
4. **Otimização de Performance**: Revisar e otimizar consultas ao banco de dados e carregamento de páginas
5. **Segurança**: Revisar permissões e autenticação em todas as rotas 

## Diretórios e Arquivos de Teste/Desenvolvimento

Durante a análise, foram identificados diversos diretórios e arquivos que parecem ser usados apenas para testes e desenvolvimento, mas que estão presentes no código principal. Esses deveriam ser revisados e possivelmente removidos em um ambiente de produção:

### Diretórios de Teste

| Diretório | Propósito Aparente | Recomendação |
|-----------|-------------------|--------------|
| `/app/test` | Testes gerais de API | Separar para um ambiente de testes |
| `/app/test-routes` | Testes de rotas e endpoints | Separar para um ambiente de testes |
| `/app/test-agenda` | Testes de funcionalidade de agenda | Separar para um ambiente de testes |
| `/app/agenda-teste` | Testes duplicados para agenda | Consolidar ou remover |

### Arquivos Auxiliares no Diretório Raiz

Vários arquivos no diretório raiz podem não ser necessários em produção:

- `test-bcrypt.js` - Teste para a biblioteca bcrypt
- `create-test-user.js` - Script para criar usuários de teste
- `fix.txt` - Arquivo com notas ou correções temporárias
- `password-reset.html` - Possível template de e-mail ou página para reset de senha

### Possíveis Arquivos Duplicados

Existem vários arquivos HTML no diretório raiz que podem ser versões antigas ou duplicadas:
- `index.html` vs `index_otimizado.html`
- `teste_idosos.html`
- `constelacao_otimizado.html`

Recomenda-se revisar esses arquivos e remover os que não são necessários.

## Recomendações para Limpeza do Código

1. **Mover código de teste**: Todos os diretórios e arquivos de teste devem ser movidos para uma pasta dedicada a testes ou para um ambiente de teste separado
2. **Remover código morto**: Arquivos duplicados e código não utilizado devem ser removidos
3. **Consolidar funcionalidades semelhantes**: Juntar código com funcionalidades semelhantes em componentes reutilizáveis
4. **Organizar melhor a estrutura de diretórios**: Seguir uma estrutura mais clara e consistente para facilitar a manutenção
5. **Documentar decisões de arquitetura**: Criar documentação que explique as escolhas arquiteturais do projeto 

## Conclusão

O Projeto Constelação possui uma base sólida, mas requer padronização e refatoração para melhorar a manutenibilidade e evitar erros. As principais prioridades devem ser:

1. **Unificar a Nomenclatura**: Escolher uma terminologia consistente entre "constellators" e "therapists"
2. **Padronizar as APIs**: Consolidar e simplificar as rotas e chamadas da API
3. **Centralizar Lógica Comum**: Eliminar duplicações através de componentes compartilhados
4. **Aprimorar a Navegação**: Corrigir todos os links e redirecionamentos
5. **Limpar o Código**: Remover arquivos e diretórios não utilizados ou de teste

Ao implementar essas mudanças, o projeto terá uma base muito mais sólida para manutenção e desenvolvimento futuro, reduzindo significativamente a ocorrência de bugs e melhorando a experiência tanto para usuários quanto para desenvolvedores. 