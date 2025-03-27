# Documento de Handover Atualizado - Projeto Constelação

## Resumo Executivo

Este documento apresenta uma análise completa, documentação e plano de ação para o Projeto Constelação, uma plataforma que conecta terapeutas e clientes.

Durante a análise foram identificados e parcialmente corrigidos vários desafios que afetam a manutenibilidade e escalabilidade do projeto:

1. **Inconsistência de Nomenclatura**: O uso dos termos "constellators" e "therapists" para se referir à mesma entidade em diferentes partes do código causa confusão.
2. **Inconsistência nas URLs de API**: Múltiplas rotas e padrões são usados para as mesmas funcionalidades.
3. **Duplicação de Código**: Diversas implementações realizam as mesmas funcionalidades em diferentes arquivos.
4. **Problemas de Navegação**: Links incorretos resultam em erros de navegação.
5. **Arquivos de Teste em Produção**: Presença de código de teste na base de código principal.

Este documento fornece recomendações abrangentes e ações já tomadas para resolver esses problemas e melhorar a qualidade e sustentabilidade do código.

## Ações Já Realizadas

1. **Limpeza de Arquivos de Teste**:
   - Criado diretório `backup-files/` para armazenar arquivos removidos
   - Movidos diretórios de teste para `backup-files/test-directories/`:
     - `app/test-agenda`
     - `app/test-routes`
     - `app/agenda-teste`
   - Arquivos auxiliares no diretório raiz também foram movidos para backup

2. **Preparação para Padronização de Nomenclatura**:
   - Adicionados comentários em `constelacao-frontend/app/api/therapists/public/[id]/route.ts` para identificar pontos de inconsistência
   - Criado plano detalhado de migração em `nomenclature-fixes.md`

3. **Documentação Completa**:
   - Criado documento de análise completa em `HANDOVER-FULL.md`
   - Detalhado plano de implementação em `implementation-plan.md`

## Visão Geral do Projeto

O Projeto Constelação é uma plataforma que conecta terapeutas (constellators/therapists) e clientes, permitindo agendamento de sessões, gerenciamento de perfis e comunicação entre usuários.

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

## Plano de Implementação

### Fase 1: Transição com Compatibilidade (Atual)

1. ✅ Adicionar comentários nos arquivos existentes para identificar pontos de inconsistência
2. Atualizar as URLs no frontend que apontam para o perfil público:
   - Manter `constelacao-frontend/app/api/therapists/public/[id]/route.ts` chamando `/constellators` por enquanto
   - Adicionar comentários indicando a necessidade futura de mudança

### Fase 2: Implementação de Rotas Paralelas (Próximo Sprint)

1. No backend, implementar rotas `/therapists` que redirecionam para controladores existentes:
   ```typescript
   // Em app.module.ts
   @Module({
     imports: [...],
     controllers: [
       // Redirecionar novas rotas para controladores existentes
       {
         path: 'therapists',
         module: ConstellatorsModule
       },
       // Manter rotas antigas por compatibilidade
       {
         path: 'constellators',
         module: ConstellatorsModule
       }
     ],
   })
   ```

2. Atualizar gradualmente as chamadas de API no frontend:
   - Começar pelas páginas mais importantes
   - Testar cada mudança cuidadosamente

### Fase 3: Migração Completa (Sprint Futuro)

1. Renomear arquivos e classes no backend:
   - `constellators.controller.ts` → `therapists.controller.ts`
   - `constellators.service.ts` → `therapists.service.ts`
   - `constellators.module.ts` → `therapists.module.ts`

2. Atualizar todas as referências e importações

3. Verificar e atualizar tabelas no banco de dados se necessário

## Correção de Navegação

1. Verificar todos os botões que abrem perfis públicos:
   - `constelacao-frontend/app/dashboard/profile/page.tsx`
   - Garantir que `handlePreviewProfile` redirecione para `/therapist/${userData.id}`

2. Assegurar que a página de perfil público (`/therapist/[id]`) busque corretamente:
   - Melhorar a extração de parâmetros
   - Adicionar tratamento de erros mais robusto

## Consolidação de API Routes

1. Identificar e documentar rotas duplicadas
2. Escolher a implementação mais robusta para cada funcionalidade
3. Redirecionar chamadas para a implementação escolhida
4. Remover rotas duplicadas após confirmação de funcionamento

## Documentação

1. Atualizar `README.md` com instruções de instalação e configuração
2. Criar um guia de arquitetura do projeto
3. Documentar todas as rotas de API disponíveis
4. Incluir informações sobre o modelo de dados

## Arquivos Importantes

Abaixo estão listados os arquivos mais importantes com comentários sobre suas funções:

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

## Problemas Remanescentes

1. **Nomenclatura Inconsistente**:
   - Ainda existem várias ocorrências de "constellators" no código que precisam ser padronizadas
   - As APIs do backend ainda usam "constellators" como padrão

2. **URLs Inconsistentes**:
   - Algumas chamadas de API ainda usam caminhos diferentes para a mesma funcionalidade

3. **Perfil Público**:
   - O botão "Visualizar Meu Perfil" direciona para uma página que depende de dados que podem não estar disponíveis

## Conclusão

O Projeto Constelação possui uma base sólida, mas requer padronização e refatoração contínuas para melhorar a manutenibilidade e evitar erros. 

As ações já tomadas incluem a limpeza de arquivos desnecessários e a documentação detalhada das inconsistências e problemas. As fases subsequentes envolvem a padronização da nomenclatura e a correção gradual dos problemas de navegação e duplicação.

Com a implementação completa das recomendações, o projeto terá uma base muito mais sólida para manutenção e desenvolvimento futuro, reduzindo significativamente a ocorrência de bugs e melhorando a experiência tanto para usuários quanto para desenvolvedores. 