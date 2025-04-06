# Tutorial: Sistema de Treinamento da IA com Transcrições Terapêuticas

## 1. Visão Geral

O sistema de treinamento permite que você melhore a qualidade dos relatórios de sessões terapêuticas alimentando a IA com transcrições de sessões conduzidas por mentores e terapeutas experientes. Este processo enriquece o conhecimento da IA com técnicas, abordagens e linguagem profissional específica da área terapêutica.

## 2. Benefícios

- **Relatórios mais precisos**: A IA aprende com exemplos reais de alta qualidade
- **Terminologia profissional**: Incorpora a linguagem usada por terapeutas experientes
- **Recomendações baseadas em evidências**: Sugere técnicas que foram utilizadas em sessões reais
- **Personalização por categoria**: Adapta-se a diferentes abordagens terapêuticas ou tipos de problema

## 3. Processo de Funcionamento

1. **Coleta**: Reúna transcrições de sessões terapêuticas de alta qualidade
2. **Adição**: Adicione-as ao sistema com categorias e metadados 
3. **Processamento**: A IA extrai insights, técnicas e padrões relevantes
4. **Aplicação**: Ao gerar relatórios, a IA incorpora este conhecimento

## 4. Endpoints da API (Links)

### 4.1 Gerenciamento de Materiais de Treinamento

#### Adicionar Novo Material
- **URL**: `POST http://localhost:3000/api/training/materials`
- **Corpo da Requisição**:
```json
{
  "title": "Técnicas CBT para Ansiedade - Dr. Silva",
  "content": "Transcrição completa da sessão terapêutica...",
  "type": "sessao_terapeutica", 
  "category": "ansiedade"
}
```
- **Resposta**: Retorna o objeto criado com ID

#### Listar Materiais por Categoria
- **URL**: `GET http://localhost:3000/api/training/materials/ansiedade`
- **Resposta**: Lista de materiais da categoria especificada

#### Obter Detalhes de um Material
- **URL**: `GET http://localhost:3000/api/training/materials/[material-id]`
- **Resposta**: Detalhes completos do material, incluindo insights extraídos

#### Atualizar Material
- **URL**: `PUT http://localhost:3000/api/training/materials/[material-id]`
- **Corpo da Requisição**: Similar ao de adicionar
- **Resposta**: Objeto atualizado

#### Excluir Material
- **URL**: `DELETE http://localhost:3000/api/training/materials/[material-id]`
- **Resposta**: Status 204 (No Content) quando bem-sucedido

### 4.2 Processamento de Materiais

#### Processar Material Manualmente
- **URL**: `POST http://localhost:3000/api/training/materials/[material-id]/process`
- **Resposta**: Insights extraídos do material

#### Melhorar Análise de Sessão com Materiais de Treinamento
- **URL**: `POST http://localhost:3000/api/training/enhance-analysis`
- **Corpo da Requisição**:
```json
{
  "sessionContent": "Transcrição da sessão atual que precisa de análise...",
  "category": "ansiedade"
}
```
- **Resposta**: Análise aprimorada com insights dos materiais de treinamento

## 5. Guia de Uso Passo a Passo

### 5.1 Configuração Inicial

1. Verifique se o servidor está rodando na porta 3000
2. Certifique-se de que está autenticado (todas as rotas exigem autenticação)
3. Organize suas transcrições em um formato de texto simples

### 5.2 Adicionando Materiais de Treinamento

1. **Categorize suas transcrições** (ex: ansiedade, depressão, trauma, etc.)
2. **Envie cada transcrição** usando o endpoint `POST /api/training/materials`
3. **Anote os IDs** retornados para referência futura

```javascript
// Exemplo de código para adicionar material
fetch('http://localhost:3000/api/training/materials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu-token-aqui'
  },
  body: JSON.stringify({
    title: "Sessão sobre Ansiedade Social - Dra. Ana Santos",
    content: "Cliente: Tenho medo de falar em público...\nTerapeuta: Vamos explorar esse medo...",
    type: "sessao_completa",
    category: "ansiedade_social"
  })
})
.then(response => response.json())
.then(data => console.log('Material adicionado:', data))
.catch(error => console.error('Erro ao adicionar material:', error));
```

### 5.3 Processando Materiais

O processamento geralmente acontece automaticamente quando você adiciona um material, mas você pode reprocessar manualmente:

```javascript
fetch('http://localhost:3000/api/training/materials/123456/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer seu-token-aqui'
  }
})
.then(response => response.json())
.then(data => console.log('Insights extraídos:', data))
.catch(error => console.error('Erro ao processar material:', error));
```

### 5.4 Usando Materiais para Melhorar Análises

Quando quiser gerar um relatório aprimorado para uma sessão:

```javascript
fetch('http://localhost:3000/api/training/enhance-analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu-token-aqui'
  },
  body: JSON.stringify({
    sessionContent: "Transcrição da sessão atual...",
    category: "ansiedade_social"
  })
})
.then(response => response.json())
.then(data => console.log('Análise aprimorada:', data))
.catch(error => console.error('Erro ao gerar análise:', error));
```

## 6. Melhores Práticas

1. **Organize por categorias**: Use categorias consistentes para facilitar a recuperação
2. **Priorize qualidade**: Adicione transcrições de terapeutas experientes e sessões bem-sucedidas
3. **Diversifique o conteúdo**: Inclua diferentes abordagens e técnicas para o mesmo tipo de problema
4. **Atualize regularmente**: Continue adicionando novos materiais para melhorar a qualidade das análises
5. **Verifique os insights**: Examine os insights extraídos para garantir que são relevantes e precisos

## 7. Exemplo Completo de Fluxo de Trabalho

1. **Colete 10-15 transcrições** de sessões terapêuticas bem-sucedidas sobre ansiedade
2. **Adicione cada uma ao sistema** com a categoria "ansiedade"
3. **Verifique os insights extraídos** para cada material
4. **Conduza uma nova sessão** sobre ansiedade com um cliente
5. **Use o endpoint enhance-analysis** para obter uma análise aprimorada da sessão
6. **Gere um relatório final** baseado na análise aprimorada

## 8. Estrutura Técnica

A funcionalidade de treinamento é implementada nos seguintes arquivos:

- **Model**: `backend/prisma/schema.prisma` - Modelo TrainingMaterial
- **Controller**: `backend/src/controllers/training.controller.js`
- **Service**: `backend/src/services/ai/training.service.js`
- **Routes**: `backend/src/routes/training.routes.js`

---

Com este sistema implementado, sua plataforma pode continuar aprendendo e melhorando com o tempo, fornecendo relatórios cada vez mais profissionais e úteis para os terapeutas. 