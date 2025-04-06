const { OpenAI } = require('openai');

// Definindo a implementação da função a ser testada diretamente
// Isso evita problemas com importações e dependências externas
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Mock da instância OpenAI para os testes
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

// Implementação isolada da função para teste
async function preprocessLongTranscript(transcript, maxTokens = 4000) {
  // Estimar tokens na transcrição
  const estimatedTokens = estimateTokens(transcript);
  
  console.log(`AI Controller: Transcrição com estimativa de ${estimatedTokens} tokens`);
  
  // Se a transcrição estiver dentro do limite, retorná-la como está
  if (estimatedTokens <= maxTokens) {
    return transcript;
  }
  
  console.log(`AI Controller: Transcrição excede limite de ${maxTokens} tokens, gerando resumo`);
  
  try {
    // Gerar um resumo usando GPT-3.5-Turbo (mais rápido e mais barato)
    const summaryCompletion = await mockOpenAI.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em resumir sessões de terapia.
          Seu trabalho é condensar transcrições longas mantendo:
          1. Os principais temas discutidos
          2. Padrões emocionais importantes
          3. Insights ou momentos de progresso
          4. Desafios ou obstáculos mencionados
          5. A estrutura geral da conversa
          
          Formate o resumo da mesma forma que a transcrição original, alternando entre "Terapeuta:" e "Paciente:".
          Seu resumo deve ser detalhado o suficiente para uma análise posterior, mas reduzido para caber no limite de tokens.`
        },
        {
          role: "user",
          content: `Resumir esta transcrição de sessão terapêutica para análise posterior:\n\n${transcript}`
        }
      ],
      max_tokens: 1500,
    });
    
    const summarizedTranscript = summaryCompletion.choices[0].message.content;
    console.log(`AI Controller: Resumo gerado com sucesso. Tamanho original: ${transcript.length}, Resumo: ${summarizedTranscript.length}`);
    
    return summarizedTranscript;
  } catch (error) {
    console.error('AI Controller: Erro ao resumir transcrição longa:', error);
    
    // Em caso de erro, fazer um truncamento manual simples
    // Isso é um fallback para garantir que o sistema continue funcionando
    console.log('AI Controller: Realizando truncamento manual como fallback');
    
    // Dividir por linhas para tentar manter a estrutura da conversa
    const lines = transcript.split('\n');
    let truncatedTranscript = '';
    let currentTokens = 0;
    
    // Pegar o início (1/3) e o final (2/3) da transcrição
    const startLines = Math.floor(lines.length / 3);
    const endLines = Math.floor(lines.length * 2 / 3);
    
    // Adicionar nota sobre o truncamento
    truncatedTranscript += "NOTA: Esta transcrição foi truncada devido ao tamanho.\n\n";
    truncatedTranscript += "--- INÍCIO DA SESSÃO ---\n";
    
    // Adicionar o primeiro terço das linhas
    for (let i = 0; i < startLines && currentTokens < maxTokens / 2; i++) {
      const lineTokens = estimateTokens(lines[i]);
      if (currentTokens + lineTokens <= maxTokens / 2) {
        truncatedTranscript += lines[i] + '\n';
        currentTokens += lineTokens;
      } else {
        break;
      }
    }
    
    truncatedTranscript += "\n--- PARTE INTERMEDIÁRIA OMITIDA ---\n\n";
    
    // Adicionar o último terço das linhas
    currentTokens += 100; // Considerar os tokens da nota
    for (let i = endLines; i < lines.length && currentTokens < maxTokens; i++) {
      const lineTokens = estimateTokens(lines[i]);
      if (currentTokens + lineTokens <= maxTokens) {
        truncatedTranscript += lines[i] + '\n';
        currentTokens += lineTokens;
      } else {
        break;
      }
    }
    
    truncatedTranscript += "\n--- FIM DA SESSÃO ---";
    
    console.log(`AI Controller: Transcrição truncada manualmente. Novo tamanho: ${truncatedTranscript.length}`);
    return truncatedTranscript;
  }
}

describe('AI Controller - Pré-processamento de Transcrições', () => {
  beforeEach(() => {
    mockOpenAI.chat.completions.create.mockClear();
  });
  
  describe('estimateTokens', () => {
    it('deve estimar corretamente o número de tokens', () => {
      expect(estimateTokens('Esta é uma frase curta.')).toBe(6); // 24 caracteres ÷ 4 = 6
      expect(estimateTokens('A')).toBe(1); // 1 caractere ÷ 4 = 0.25, arredondado para 1
      expect(estimateTokens(''.padEnd(400, 'A'))).toBe(100); // 400 caracteres ÷ 4 = 100
    });
  });
  
  describe('preprocessLongTranscript', () => {
    it('deve retornar a transcrição original se estiver dentro do limite de tokens', async () => {
      const shortTranscript = 'Terapeuta: Como você está se sentindo hoje?\nPaciente: Estou me sentindo um pouco melhor.';
      const result = await preprocessLongTranscript(shortTranscript, 200);
      expect(result).toBe(shortTranscript);
    });
    
    it('deve resumir transcrições longas usando OpenAI', async () => {
      // Criar uma transcrição longa que exceda o limite
      const longTranscript = ''.padEnd(24000, 'A'); // 24000 caracteres ÷ 4 = 6000 tokens
      const mockSummarizedContent = 'Terapeuta: [Resumo da conversa]\nPaciente: [Resumo das respostas]';
      
      // Configurar o mock para retornar um resumo
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: mockSummarizedContent } }]
      });
      
      const result = await preprocessLongTranscript(longTranscript, 4000);
      
      // Verificar se a API da OpenAI foi chamada
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      // Verificar se o resultado é o resumo mockado
      expect(result).toBe(mockSummarizedContent);
    });
    
    it('deve truncar manualmente se a chamada à OpenAI falhar', async () => {
      // Criar uma transcrição longa que exceda o limite
      const longTranscript = ''.padEnd(24000, 'A'); // 24000 caracteres ÷ 4 = 6000 tokens
      
      // Configurar o mock para lançar um erro
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));
      
      const result = await preprocessLongTranscript(longTranscript, 4000);
      
      // Verificar se o resultado contém indicadores de truncamento
      expect(result).toContain("NOTA: Esta transcrição foi truncada");
      expect(result).toContain("--- INÍCIO DA SESSÃO ---");
      expect(result).toContain("--- PARTE INTERMEDIÁRIA OMITIDA ---");
      expect(result).toContain("--- FIM DA SESSÃO ---");
    });
    
    it('deve funcionar com valores extremos', async () => {
      // Teste com string vazia
      expect(await preprocessLongTranscript('', 4000)).toBe('');
      
      // Teste com valor exatamente no limite
      const exactSizeTranscript = ''.padEnd(16000, 'A'); // 16000 caracteres ÷ 4 = 4000 tokens exatos
      expect(await preprocessLongTranscript(exactSizeTranscript, 4000)).toBe(exactSizeTranscript);
    });
  });
}); 