# Constelação - Plataforma de Terapia Online

## Visão Geral
Constelação é uma plataforma que conecta terapeutas e clientes para sessões de terapia online. O sistema permite que terapeutas gerenciem seus perfis, disponibilidade e sessões, enquanto os clientes podem encontrar terapeutas, agendar sessões e deixar avaliações.

## Estrutura do Banco de Dados

### Modelos Principais

#### User
- Base para todos os usuários do sistema
- Campos:
  - id: UUID
  - email: String (único)
  - name: String
  - password: String (hash)
  - role: UserRole (USER, ADMIN, CLIENT, THERAPIST)
  - createdAt: DateTime
  - updatedAt: DateTime

#### Therapist (Terapeuta)
- Perfil profissional do terapeuta
- Campos:
  - id: UUID
  - userId: String (referência ao User)
  - bio: String opcional
  - specialties: JSON (especialidades)
  - planType: PlanType (BASIC, PREMIUM)
  - niches: JSON (nichos de atuação)
  - customNiches: JSON (nichos personalizados)
  - tools: JSON (ferramentas utilizadas)
  - customTools: JSON (ferramentas personalizadas)
  - education: String (formação)
  - experience: String (experiência)
  - targetAudience: String (público-alvo)
  - differential: String (diferencial)
  - sessionPrice: Float
  - sessionPricing: JSON (precificação detalhada)
  - availability: JSON (disponibilidade)
  - socialMedia: JSON (redes sociais)
  - video: String (vídeo de apresentação)
  - stripeCustomerId: String
  - stripeSubscriptionId: String

#### Client (Cliente)
- Perfil do cliente
- Campos:
  - id: UUID
  - userId: String (referência ao User)
  - createdAt: DateTime
  - updatedAt: DateTime

#### Session (Sessão)
- Agendamento de sessões
- Campos:
  - id: UUID
  - therapistId: String
  - clientId: String opcional
  - date: DateTime
  - status: SessionStatus (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
  - notes: String opcional
  - createdAt: DateTime
  - updatedAt: DateTime

#### Review (Avaliação)
- Avaliações dos clientes sobre os terapeutas
- Campos:
  - id: UUID
  - therapistId: String
  - clientId: String
  - rating: Int
  - comment: String
  - createdAt: DateTime
  - updatedAt: DateTime

#### Subscription (Assinatura)
- Gerenciamento de assinaturas dos terapeutas
- Campos:
  - id: UUID
  - therapistId: String
  - status: SubscriptionStatus (ACTIVE, CANCELED, PAST_DUE)
  - planType: PlanType
  - stripeSubscriptionId: String opcional
  - stripePriceId: String
  - startDate: DateTime
  - currentPeriodStart: DateTime
  - currentPeriodEnd: DateTime
  - createdAt: DateTime
  - updatedAt: DateTime

#### Message (Mensagem)
- Sistema de mensagens entre usuários
- Campos:
  - id: UUID
  - content: String
  - senderId: String
  - receiverId: String
  - attachmentUrl: String opcional
  - read: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime

#### Notification (Notificação)
- Sistema de notificações
- Campos:
  - id: UUID
  - userId: String
  - title: String
  - message: String
  - read: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime

## Funcionalidades Implementadas

### Autenticação e Autorização
- Sistema de registro e login
- JWT para autenticação
- Controle de acesso baseado em roles (ADMIN, CLIENT, THERAPIST)
- Proteção de rotas com guards

### Gestão de Perfil do Terapeuta
- Criação e atualização de perfil profissional
- Gestão de disponibilidade
- Configuração de preços e modalidades de atendimento
- Upload de vídeo de apresentação
- Gestão de especialidades e ferramentas

### Sistema de Agendamento
- Marcação de sessões
- Atualização de status das sessões
- Cancelamento de sessões
- Notificações de agendamento

### Sistema de Pagamentos (Stripe)
- Integração com Stripe para pagamentos
- Gestão de assinaturas
- Webhook para eventos do Stripe
- Diferentes planos (BASIC, PREMIUM)

### Sistema de Avaliações
- Clientes podem avaliar terapeutas
- Sistema de rating e comentários
- Visualização de avaliações no perfil do terapeuta

### Sistema de Mensagens
- Chat entre cliente e terapeuta
- Suporte a anexos
- Indicador de leitura
- Notificações de novas mensagens

### Sistema de Notificações
- Notificações em tempo real
- Marcação de leitura
- Diferentes tipos de notificações (agendamento, mensagens, etc.)

## Tecnologias Utilizadas

### Backend
- NestJS como framework
- Prisma como ORM
- PostgreSQL como banco de dados
- JWT para autenticação
- Stripe para pagamentos
- TypeScript para tipagem estática

### Segurança
- Senhas hasheadas com bcrypt
- Proteção contra XSS e CSRF
- Validação de dados com class-validator
- Sanitização de inputs

## Próximos Passos
1. Implementar testes automatizados
2. Adicionar sistema de recuperação de senha
3. Implementar sistema de busca avançada de terapeutas
4. Adicionar suporte a videoconferência
5. Implementar sistema de relatórios para terapeutas
6. Adicionar dashboard administrativo
7. Implementar sistema de backup automático
8. Adicionar suporte a múltiplos idiomas

## Observações Importantes
- O sistema foi migrado de "constelador" para "terapeuta" para ampliar o escopo da plataforma
- Todas as operações sensíveis são protegidas por autenticação
- O sistema segue as melhores práticas de LGPD para proteção de dados
- A arquitetura é modular e escalável
- O código segue padrões de clean code e SOLID 