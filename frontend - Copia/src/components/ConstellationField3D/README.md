# Campo de Constelação 3D

Este componente implementa um campo de constelação interativo em 3D usando React Three Fiber e Three.js. Baseado no design de uma bússola tradicional, o campo oferece uma superfície intuitiva para posicionar representantes durante sessões terapêuticas.

## Funcionalidades Atuais

- Renderização 3D do campo com design de bússola
- Textura procedural gerada via Canvas
- Controles de câmera (órbita, zoom, pan)
- Rosa dos ventos estilizada
- Logo central "TheraConnect"
- Interface responsiva
- Modo tela cheia (na página de demonstração)

## Estrutura do Componente

O componente está estruturado da seguinte forma:

```
ConstellationField3D/
├── index.jsx          # Componente principal
├── ProceduralTexture.js  # Gerador de textura procedural
├── styles.css         # Estilos do componente
├── DemoPage.jsx       # Página de demonstração
├── demo.css           # Estilos da página de demonstração
└── README.md          # Documentação
```

## Uso Básico

```jsx
import ConstellationField3D from './components/ConstellationField3D';

function MyComponent() {
  return (
    <div style={{ width: '800px', height: '600px' }}>
      <ConstellationField3D />
    </div>
  );
}
```

## Página de Demonstração

Existe uma página de demonstração disponível em `/constellation-3d-demo` que mostra o campo em ação com instruções para o usuário.

## Próximos Passos para Implementação Completa

1. **Sistema de representantes**:
   - Implementar adição de representantes
   - Sistema de arrastar e soltar
   - Seleção e edição de representantes

2. **Sincronização em tempo real**:
   - Implementar sistema de WebSockets
   - Garantir que alterações são refletidas em todas as instâncias
   - Sistema de resolução de conflitos

3. **Gerenciamento de estado**:
   - Adicionar store com Zustand
   - Estruturar modelo de dados

4. **Controles de sessão**:
   - Interface para o terapeuta abrir/fechar o campo
   - Controles de permissão (quem pode adicionar/mover representantes)

5. **Persistência**:
   - Salvar e carregar configurações
   - Histórico de mudanças

## Considerações Técnicas

### Desempenho

O componente usa várias técnicas para otimizar o desempenho:

- Texturas procedurais geradas apenas uma vez (via useMemo)
- Geometrias simples e otimizadas
- Renderização condicional de elementos complexos

### Compatibilidade

Este componente requer navegadores modernos com suporte a WebGL. Testes foram realizados nos seguintes navegadores:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contribuição

Para contribuir com o desenvolvimento deste componente:

1. Siga a estrutura modular existente
2. Mantenha a separação de preocupações (rendering, lógica, estado)
3. Documente novas funcionalidades
4. Teste em diferentes dispositivos e navegadores 