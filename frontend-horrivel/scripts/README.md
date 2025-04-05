# Instruções para Adicionar Acesso ao Campo de Constelação

Este diretório contém scripts com instruções para adicionar acesso ao Campo de Constelação Familiar no dashboard do terapeuta.

## Opções Disponíveis

Você tem duas opções para adicionar acesso ao Campo de Constelação:

### 1. Adicionar um Botão no Dashboard do Terapeuta

Esta opção adiciona um botão específico na seção de cards do dashboard do terapeuta.

Veja as instruções em: [add-constellation-button.js](./add-constellation-button.js)

### 2. Adicionar um Dashboard Flutuante

Esta opção adiciona um painel flutuante em qualquer página da aplicação, que pode ser expandido para acessar o Campo de Constelação.

Veja as instruções em: [add-floating-dashboard.js](./add-floating-dashboard.js)

## Implementação Recomendada

Recomendamos a implementação da **opção 1** para um acesso mais integrado ao dashboard do terapeuta,
pois proporciona uma melhor experiência do usuário e segue o padrão de UI da aplicação.

A **opção 2** é útil durante o desenvolvimento e testes, pois permite acessar o Campo de Constelação
de qualquer página da aplicação sem precisar navegar até o dashboard do terapeuta.

## Página de Teste

Independentemente da opção escolhida, a página de teste do Campo de Constelação pode ser acessada diretamente pela URL:

```
/teste-constelacao
```

## Ferramentas Criadas

Os seguintes componentes foram implementados:

1. `ConstellationField` - O componente principal do Campo de Constelação
2. `ConstellationTestButton` - Um botão para o dashboard do terapeuta
3. `ConstellationTestDashboard` - Um dashboard flutuante para acesso rápido
4. `ConstellationToolConfig` - Um componente para configurar a ferramenta de Constelação 