# TerapiaConect Frontend

## Sobre o Projeto
Frontend do projeto TerapiaConect, desenvolvido em React com Vite.

## Versão Atual: Demonstração do Campo de Constelação

**Importante:** Atualmente, este projeto está configurado em modo de demonstração para exibir apenas o componente de Campo de Constelação. Esta versão foi criada para permitir testes isolados deste componente específico.

### Alterações realizadas para a versão de demonstração:

1. Arquivo `src/main.jsx` modificado para carregar apenas o componente `ConstellationDemo` em vez do `App` completo
2. Criação do arquivo `src/ConstellationDemo.jsx` que renderiza apenas o componente `ConstellationField`
3. Adição da dependência `date-fns` para resolver problemas de build

### Como reverter para a versão completa do site:

Para voltar à versão completa do aplicativo, siga estes passos:

1. Restaure o arquivo `src/main.jsx` para carregar o componente `App` novamente:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

2. Se necessário, você pode manter o arquivo `ConstellationDemo.jsx` no projeto, já que ele não afeta o funcionamento normal da aplicação.

## Desenvolvimento

### Requisitos

- Node.js (versão recomendada: 16.x ou superior)
- npm (incluído com o Node.js)

### Instalação

```bash
npm install
```

### Execução em modo de desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:3001`.

### Build para produção

```bash
npm run build
```

### Configuração do servidor

O arquivo `vite.config.js` está configurado para:
- Porta 3001 para o frontend
- Proxy para a API no backend na porta 3000

## Deploy no Vercel

O projeto está configurado para deploy no Vercel através do arquivo `vercel.json`. Para fazer um novo deploy:

1. Faça commit das suas alterações
2. Envie para o repositório GitHub
3. No Vercel, importe o projeto definindo a pasta `frontend` como diretório raiz

## Estrutura do Projeto

- `src/components/` - Componentes reutilizáveis
- `src/contexts/` - Contextos React para gerenciamento de estado
- `src/pages/` - Componentes de página inteira
- `src/components/ConstellationField/` - Componente do campo de constelação
- `src/contexts/ConstellationContext.jsx` - Gerenciamento de estado do campo de constelação

## Campo de Constelação

O componente de Campo de Constelação é uma interface 3D interativa que permite:

- Adicionar representantes com diferentes cores e tipos
- Posicionar representantes no campo
- Editar representantes existentes
- Salvar a configuração atual

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
