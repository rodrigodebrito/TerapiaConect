# Documentação da Implementação do Campo de Constelação

## Estrutura de Arquivos

A implementação do Campo de Constelação é distribuída nos seguintes arquivos:

```
C:\TerapiaConect\frontend\src\components\ConstellationField\ConstellationField.css       19103 bytes
C:\TerapiaConect\frontend\src\components\ConstellationField\ConstellationToolConfig.jsx   4290 bytes
C:\TerapiaConect\frontend\src\components\ConstellationField\index.jsx                    32169 bytes
C:\TerapiaConect\frontend\src\contexts\ConstellationContext.jsx                          13295 bytes
C:\TerapiaConect\backend\src\index.js                                                     8042 bytes (configuração Socket.io)
```

## Componentes Principais

### 1. ConstellationField (index.jsx)

Este é o componente principal que renderiza o campo de constelação 3D utilizando Three.js e React Three Fiber. O componente é composto por:

- **ConstellationField**: Componente wrapper que inicializa o ConstellationProvider e renderiza o ConstellationView.
- **ConstellationView**: Componente que renderiza a interface do usuário, incluindo o painel de controle, canvas 3D, e botões de interação.
- **Field**: Componente que renderiza o plano 3D onde os representantes são posicionados.
- **Representative**: Componente que renderiza cada representante individual no campo 3D.
- **CompassRose**: Componente decorativo que adiciona linhas de referência no campo.

O componente permite:
- Adicionar, editar e remover representantes
- Arrastar representantes para posicioná-los no campo
- Rotacionar representantes usando a tecla Shift
- Visualizar nomes dos representantes
- Controlar quem pode manipular o campo (host ou cliente)

### 2. ConstellationContext (ConstellationContext.jsx)

Este contexto React gerencia o estado do campo de constelação e a comunicação com o servidor via Socket.io. Ele fornece:

- Estado dos representantes (posição, cor, tipo, etc.)
- Estado da interface (seleção, edição, controle)
- Funções para manipulação (adicionar, remover, mover representantes)
- Comunicação em tempo real com outros participantes da sessão

## Integração com Socket.io

### Frontend (ConstellationContext.jsx)

O contexto utiliza uma referência ao socket via `useRef` e procura um socket global em `window.socket` ou `window.constellationSocket`. Ele implementa:

1. **Escuta de eventos**:
   - `constellation-object`: recebe atualizações de outros usuários
   - `constellation-sync-request`: responde a pedidos de sincronização

2. **Envio de eventos**:
   - Função `emitChange`: envia alterações para outros participantes
   - Tipos de eventos: 'add', 'update', 'remove', 'fullSync'

3. **Gerenciamento de estado**:
   - Rastreia quem tem controle sobre o campo
   - Atualiza posições e propriedades dos representantes
   - Sincroniza camera e rotação do campo

### Backend (index.js)

O servidor backend atua como intermediário para comunicação entre os clientes, implementando:

1. **Eventos de Socket.io**:
   ```javascript
   socket.on('constellation-object', (data) => {
     if (data.type === 'requestSync') {
       // Solicita sincronização para o host
       socket.to(data.sessionId).emit('constellation-sync-request', {...});
     } 
     else if (data.type === 'fullSync') {
       // Envia para todos, incluindo o remetente
       io.to(data.sessionId).emit('constellation-object', data);
     }
     else {
       // Envia para todos, exceto o remetente
       socket.to(data.sessionId).emit('constellation-object', data);
     }
   });
   ```

2. **Salas de Sessão**:
   - Usuários entram em salas baseadas no ID da sessão: `socket.join(data.sessionId)`
   - Eventos são enviados apenas para os participantes da sessão correta

## Modelo de Dados

### Representantes

Cada representante possui a seguinte estrutura:
```javascript
{
  id: String,           // Identificador único (ex: 'rep-1618342123456')
  name: String,         // Nome do representante
  position: [x, y, z],  // Posição 3D (array de coordenadas)
  color: String,        // Cor em formato hexadecimal (ex: '#4285F4')
  type: String,         // Tipo (ex: 'male_adult', 'female_child')
  isControlled: Boolean // Indica se está sendo manipulado
}
```

### Tipos de Representantes

Os tipos disponíveis são:
- `male_elder`, `female_elder`
- `male_adult`, `female_adult`
- `male_child`, `female_child`
- `subjetivo_longo`, `subjetivo_curto`

Cada tipo está associado a um modelo 3D específico carregado via URL.

## Fluxo de Funcionamento

1. **Inicialização**:
   - O componente `ConstellationField` é montado na interface da sessão
   - O `ConstellationContext` conecta-se ao socket.io existente
   - Se for cliente (não host), solicita uma sincronização inicial

2. **Adição de Representante**:
   - Usuário insere nome, seleciona tipo e cor
   - Clica no botão "Adicionar"
   - O representante é adicionado localmente e enviado via socket

3. **Movimentação de Representante**:
   - Usuário seleciona um representante clicando nele
   - Arrasta o representante para uma nova posição
   - A posição é atualizada localmente e enviada via socket

4. **Sincronização**:
   - Quando um cliente se conecta, solicita sincronização
   - O host envia o estado completo do campo
   - Todas as alterações subsequentes são transmitidas em tempo real

## Fluxo de Comunicação Socket.io

### Quando um usuário move um representante:

1. Usuário arrasta um representante no frontend
2. O método `setRepresentativePosition` é chamado no context
3. Atualiza o estado local com `setRepresentatives`
4. Chama `emitChange` com dados do representante atualizado
5. Socket emite evento `constellation-object` com:
   ```javascript
   {
     type: 'representative',
     action: 'update',
     representative: updatedRep,
     sessionId: currentSessionId,
     timestamp: Date.now()
   }
   ```
6. O servidor recebe o evento e o repassa para outros clientes
7. Os outros clientes recebem o evento e atualizam seu estado local

### Quando um cliente se conecta:

1. Cliente inicializa `ConstellationContext`
2. Se não for host, emite evento `constellation-object` com `type: 'requestSync'`
3. Servidor encaminha como `constellation-sync-request` para o host
4. Host emite evento `constellation-object` com `type: 'fullSync'` contendo todos os dados
5. Servidor envia para todos na sala usando `io.to(sessionId).emit`
6. Cliente recebe os dados e atualiza seu estado local

## Depuração e Logs

O sistema inclui logs detalhados para depuração:

- No frontend:
  ```javascript
  console.log("Field handleSelect called with rep:", rep ? rep.name : "null");
  console.log("Representative handleMouseDown: calling onSelect with", representative.name);
  console.log("Sem controle, ignorando mudança de posição");
  ```

- No backend:
  ```javascript
  console.log(`Atualização de objeto de constelação para sessão ${data.sessionId} - tipo: ${data.type}`);
  console.log(`Cliente ${data.clientId} solicitou sincronização para sessão ${data.sessionId}`);
  ```

## Considerações para Desenvolvimento Futuro

1. **Tratamento de Erros**: Melhorar o tratamento de erros na comunicação socket
2. **Persistência**: Adicionar salvamento do estado do campo em banco de dados
3. **Otimização**: Reduzir a frequência de atualizações para representantes em movimento
4. **Performance**: Implementar Level of Detail (LOD) para modelos 3D em clientes com hardware limitado

## Resolução de Problemas Comuns

1. **Socket.io Connection Errors**:
   - Problema: Erros de conexão com Socket.io podem ocorrer
   - Solução: Implementado retry e fallback para polling

2. **Sincronização de Estado**:
   - Problema: Representantes podem ficar dessincronizados entre sessões
   - Solução: Implementado mecanismo de sincronização completa e logs para depuração
   
3. **Controle Simultâneo**:
   - Problema: Múltiplos usuários tentando controlar simultaneamente
   - Solução: Sistema de controle exclusivo com transferência 