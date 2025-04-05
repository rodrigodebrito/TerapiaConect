import config from '../environments';

class WhisperTranscriptionService {
  constructor() {
    // Configuração inicial
    this.chunks = [];
    this.isRecording = false;
    this.mediaRecorder = null;
    this.stream = null;
    this.processingInterval = null;
    this.lastProcessedTime = 0;
    this.transcriptions = [];
    this.onTranscriptionCallback = null;
    this.apiUrl = config.apiUrl;
    this.lastErrorTime = null; // Controle de tempo entre erros
    
    // Obter token de autenticação na inicialização
    this.authToken = this.getAuthToken();
    
    // Configurações padrão
    this.segmentDuration = 15000; // 15 segundos por segmento
    this.processingOverlap = 2000; // 2 segundos de sobreposição entre segmentos
    this.silenceThreshold = -50; // Limiar para detecção de silêncio (dB)
    this.language = 'pt'; // Português como padrão
    
    // Detectores de silêncio
    this.audioContext = null;
    this.audioAnalyser = null;
    this.silenceDetector = null;
    this.silenceTimeout = null;
    this.consecutiveSilenceFrames = 0;
    this.silenceThresholdDb = -45; // Silêncio em dB (mais negativo = mais sensível)
    this.silenceTimeoutMs = 2000; // Parar após 2 segundos de silêncio
    this.maxRecordingDuration = 15000; // Duração máxima da gravação (15 segundos)
    this.framesForSilence = 120; // Frames consecutivos de silêncio para parar (a ~60fps)
    
    // Callbacks
    this.onTranscriptionStart = null;
    this.onTranscriptionReceived = null;
    this.onTranscriptionError = null;
    this.onStatusChange = null;
  }
  
  /**
   * Inicia a gravação de áudio
   * @returns {Promise<void>}
   */
  async startRecording() {
    try {
      // Verificar se já está gravando e parar completamente
      if (this.isRecording || this.mediaRecorder || this.stream) {
        console.log('Parando gravação anterior antes de iniciar nova');
        
        try {
          await this.stopRecording();
        } catch (stopError) {
          console.warn('Erro ao parar gravação anterior:', stopError.message);
        }
        
        // Garantir limpeza completa
        this.isRecording = false;
        
        if (this.stream) {
          try {
            this.stream.getTracks().forEach(track => track.stop());
          } catch (e) {
            console.warn('Erro ao parar tracks de áudio:', e.message);
          }
        }
        
        this.mediaRecorder = null;
        this.stream = null;
        this.chunks = [];
        
        // Limpar detectores de silêncio
        this.cleanupSilenceDetector();
        
        // Adicionar pequeno delay para garantir limpeza completa
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Atualizar o token de autenticação
      this.refreshAuthToken();
      
      // Verificar se temos token de autenticação
      if (!this.authToken) {
        console.error('Token de autenticação não encontrado');
        this.dispatchAuthError();
        throw new Error('Token de autenticação não encontrado. Faça login para usar esta funcionalidade.');
      }
      
      console.log('Token de autenticação encontrado, iniciando gravação...');
      
      // Notificar início da gravação
      if (this.onStatusChange) {
        this.onStatusChange({ 
          status: 'starting', 
          message: 'Iniciando gravação...' 
        });
      }
      
      console.log('Iniciando nova gravação de áudio');
      
      // Solicitar permissão de acesso ao microfone com configurações simplificadas
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100
        }
      });
      
      // Testar formatos em ordem de preferência - priorizar formatos diretamente compatíveis com Whisper
      const formatTests = [
        { mimeType: 'audio/mp3', bitRate: 128000, name: 'MP3' },
        { mimeType: 'audio/wav', bitRate: 256000, name: 'WAV' },
        { mimeType: 'audio/mpeg', bitRate: 128000, name: 'MPEG' },
        { mimeType: 'audio/webm;codecs=opus', bitRate: 96000, name: 'WebM Opus' },
        { mimeType: 'audio/webm', bitRate: 96000, name: 'WebM' },
      ];
      
      let selectedFormat = null;
      
      // Encontrar o primeiro formato suportado
      for (const format of formatTests) {
        if (MediaRecorder.isTypeSupported(format.mimeType)) {
          selectedFormat = format;
          console.log(`Formato de áudio selecionado: ${format.name} (${format.mimeType})`);
          break;
        }
      }
      
      // Fallback para o formato padrão do navegador se nenhum formato for suportado
      if (!selectedFormat) {
        console.warn('Nenhum formato conhecido suportado, usando formato padrão do navegador');
        selectedFormat = { 
          mimeType: '', 
          bitRate: 128000, 
          name: 'Padrão do navegador'
        };
      }
      
      console.log(`Usando formato de áudio: ${selectedFormat.name}`);
      
      // Notificar que o microfone está pronto
      if (this.onStatusChange) {
        this.onStatusChange({ 
          status: 'ready', 
          message: 'Microfone ativado, começando a gravar' 
        });
      }
      
      // Preparar opções para o MediaRecorder
      const options = {};
      
      // Adicionar mimeType apenas se for um valor válido
      if (selectedFormat.mimeType) {
        options.mimeType = selectedFormat.mimeType;
      }
      
      // Adicionar audioBitsPerSecond para melhor controle de qualidade
      options.audioBitsPerSecond = selectedFormat.bitRate;
      
      console.log('Opções do MediaRecorder:', options);
      
      // Iniciar gravação com options configurados
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      
      // Limpar chunks anteriores
      this.chunks = [];
      
      // Coletar os dados enquanto grava
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
          console.log(`Chunk de áudio recebido: ${event.data.size} bytes, tipo: ${event.data.type}`);
        }
      };
      
      // Configurar evento de erro
      this.mediaRecorder.onerror = (event) => {
        console.error('Erro no MediaRecorder:', event.error);
      };
      
      // Iniciar gravação com chunks menores (200ms)
      // Isso gera mais chunks pequenos, o que pode ser mais estável
      this.mediaRecorder.start(200);
      this.isRecording = true;
      
      // Registrar o formato efetivamente usado para debug
      console.log(`Gravação iniciada usando formato: ${this.mediaRecorder.mimeType || 'formato padrão do navegador'}`);
      
      // Notificar que a gravação começou
      window.dispatchEvent(new CustomEvent('whisper-recording-started', {
        detail: { 
          format: this.mediaRecorder.mimeType || 'formato desconhecido',
          maxDuration: this.maxRecordingDuration / 1000,
          silenceTimeout: this.silenceTimeoutMs / 1000
        }
      }));
      
      // Configurar detecção de silêncio
      this.setupSilenceDetection(this.stream);
      
      // Configurar timer para parar automaticamente após o tempo máximo
      this.recordingTimer = setTimeout(() => {
        if (this.isRecording) {
          console.log(`Parando gravação automaticamente após ${this.maxRecordingDuration/1000} segundos`);
          
          // Notificar que atingimos o tempo máximo
          if (this.onStatusChange) {
            this.onStatusChange({ 
              status: 'timeout', 
              message: `Tempo máximo de gravação (${this.maxRecordingDuration/1000}s) atingido` 
            });
          }
          
          this.stopRecording();
        }
      }, this.maxRecordingDuration);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      
      // Notificar erro
      if (this.onStatusChange) {
        this.onStatusChange({ 
          status: 'error', 
          message: `Erro ao iniciar gravação: ${error.message}` 
        });
      }
      
      throw new Error(`Não foi possível iniciar a gravação: ${error.message}`);
    }
  }
  
  /**
   * Configura a detecção de silêncio para parar automaticamente a gravação
   * @param {MediaStream} stream - Stream de áudio
   */
  setupSilenceDetection(stream) {
    try {
      // Limpar detector existente
      this.cleanupSilenceDetector();
      
      // Criar contexto de áudio para análise
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Criar analisador de áudio
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 2048;
      this.audioAnalyser.smoothingTimeConstant = 0.8;
      
      // Conectar stream ao analisador
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.audioAnalyser);
      
      // Criar buffer para análise de volume
      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Definir contador de silêncio
      this.consecutiveSilenceFrames = 0;
      
      // Verificar se já detectou som (para evitar parar quando não houve audio)
      let hasDetectedSound = false;
      
      // Função de análise de silêncio
      const detectSilence = () => {
        if (!this.isRecording) {
          console.log('Gravação já parou, cancelando detecção de silêncio');
          return;
        }
        
        this.audioAnalyser.getByteFrequencyData(dataArray);
        
        // Calcular volume médio do áudio
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Converter para decibéis (o valor está entre 0 e 255)
        const volumeDb = 20 * Math.log10(average / 255);
        
        // Se detectar um volume razoável, marcar que detectou som
        if (volumeDb > -30) {
          hasDetectedSound = true;
        }
        
        // Verificar se está abaixo do limiar de silêncio
        if (volumeDb < this.silenceThresholdDb) {
          this.consecutiveSilenceFrames++;
          
          // Calcular segundos de silêncio (aproximado)
          const silenceSeconds = this.consecutiveSilenceFrames / 60;
          
          // Após um número de frames consecutivos, parar a gravação
          // Mas apenas se já tiver detectado algum som antes
          if (this.consecutiveSilenceFrames >= this.framesForSilence && hasDetectedSound) {
            console.log(`Silêncio detectado por ${silenceSeconds.toFixed(1)} segundos, parando gravação`);
            
            // Notificar que estamos parando por silêncio
            if (this.onStatusChange) {
              this.onStatusChange({ 
                status: 'stopping', 
                reason: 'silence',
                message: 'Silêncio detectado, finalizando gravação' 
              });
            }
            
            this.stopRecording();
            return;
          }
          
          // Avisar ao usuário que estamos prestes a parar
          const silenceProgress = this.consecutiveSilenceFrames / this.framesForSilence;
          const secondsUntilStop = ((this.framesForSilence - this.consecutiveSilenceFrames) / 60).toFixed(1);
          
          if (silenceProgress > 0.5 && hasDetectedSound) { // Após metade do tempo de silêncio
            this.dispatchVolumeUpdate({
              volume: volumeDb,
              silenceDetected: true,
              silenceProgress,
              secondsUntilStop
            });
          }
        } else {
          // Resetar contador se houver som
          this.consecutiveSilenceFrames = 0;
          
          // Atualizar UI com o volume atual
          this.dispatchVolumeUpdate({
            volume: volumeDb,
            silenceDetected: false,
            silenceProgress: 0,
            secondsUntilStop: null,
            hasSound: hasDetectedSound
          });
        }
        
        // Continuar verificando
        this.silenceDetector = requestAnimationFrame(detectSilence);
      };
      
      // Iniciar detecção
      this.silenceDetector = requestAnimationFrame(detectSilence);
      
      console.log('Detecção de silêncio iniciada');
    } catch (error) {
      console.error('Erro ao configurar detecção de silêncio:', error);
      // Falhar silenciosamente - usar apenas o timeout como fallback
    }
  }
  
  /**
   * Envia atualização do nível de áudio para a interface
   * @param {Object} data - Dados do volume de áudio
   */
  dispatchVolumeUpdate(data) {
    // Calcular nível de volume para UI (0-100)
    const minDb = -60; // Volume mínimo detectável (silêncio)
    const maxDb = 0;   // Volume máximo (0dB, referência)
    
    // Converter dB para percentual
    const volumePercent = Math.max(0, Math.min(100, 
      100 * (data.volume - minDb) / (maxDb - minDb)
    ));
    
    // Disparar evento para que a UI possa atualizar
    window.dispatchEvent(new CustomEvent('whisper-volume', {
      detail: {
        volumePercent,
        isRecording: this.isRecording,
        silenceDetected: data.silenceDetected,
        secondsUntilStop: data.secondsUntilStop
      }
    }));
    
    // Se temos callback de status, também notificar por ele
    if (this.onStatusChange) {
      this.onStatusChange({
        status: 'recording',
        volumeLevel: volumePercent,
        silenceDetected: data.silenceDetected,
        secondsUntilStop: data.secondsUntilStop
      });
    }
  }
  
  /**
   * Limpa recursos do detector de silêncio
   */
  cleanupSilenceDetector() {
    // Cancelar timer de silêncio
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    // Cancelar animationFrame de detecção
    if (this.silenceDetector) {
      cancelAnimationFrame(this.silenceDetector);
      this.silenceDetector = null;
    }
    
    // Fechar contexto de áudio
    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }
      } catch (e) {
        console.warn('Erro ao fechar contexto de áudio:', e);
      }
      this.audioContext = null;
    }
    
    this.audioAnalyser = null;
    this.consecutiveSilenceFrames = 0;
  }
  
  /**
   * Para a gravação de áudio e processa os dados coletados
   * @returns {Promise<string|null>} - Texto transcrito ou null em caso de erro
   */
  async stopRecording() {
    try {
      // Limpar o timer se existir
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      // Limpar detector de silêncio
      this.cleanupSilenceDetector();
      
      if (!this.isRecording || !this.mediaRecorder) {
        console.log('Nenhuma gravação em andamento para interromper');
        return null;
      }
      
      console.log('Parando gravação de áudio');
      
      // Guardar cópia dos recursos para limpeza posterior
      const localMediaRecorder = this.mediaRecorder;
      const localStream = this.stream;
      const localChunks = [...this.chunks]; // Cópia para evitar concorrência
      
      // Marcar como não gravando imediatamente
      this.isRecording = false;
      
      // Parar o MediaRecorder se estiver ativo
      if (localMediaRecorder && localMediaRecorder.state !== 'inactive') {
        try {
          localMediaRecorder.stop();
          console.log('MediaRecorder parado com sucesso');
          
          // Pedir dados finais para garantir que tudo seja capturado
          if (localMediaRecorder.state === 'recording') {
            localMediaRecorder.requestData();
          }
        } catch (stopError) {
          console.warn('Erro ao parar MediaRecorder:', stopError.message);
        }
      }
      
      // Parar o stream de áudio
      if (localStream) {
        try {
          localStream.getTracks().forEach(track => {
            track.stop();
            console.log(`Faixa de áudio interrompida: ${track.label}`);
          });
        } catch (trackError) {
          console.warn('Erro ao parar tracks de áudio:', trackError.message);
        }
      }
      
      // Limpar recursos imediatamente
      this.mediaRecorder = null;
      this.stream = null;
      
      // Aguardar um pouco para garantir que todos os chunks foram coletados
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar se temos chunks válidos para processar
      const validChunks = localChunks.filter(chunk => chunk && chunk.size > 0);
      
      if (validChunks.length === 0) {
        console.warn('Nenhum dado de áudio válido coletado durante a gravação');
        this.chunks = []; // Garantir que chunks sejam limpos
        return null;
      }
      
      console.log(`Processando ${validChunks.length} chunks de áudio válidos`);
      
      // Processar os chunks válidos
      try {
        // Limpar lista de chunks após capturar a cópia local
        this.chunks = [];
        
        // Processar e retornar o resultado
        const transcriptionText = await this.processAudioChunks(validChunks);
        console.log('Gravação finalizada e recursos liberados');
        return transcriptionText;
      } catch (processError) {
        console.error('Erro ao processar áudio:', processError.message);
        this.chunks = []; // Garantir que chunks sejam limpos em caso de erro
        throw processError;
      }
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      
      // Garantir que o estado seja limpo mesmo em caso de erro
      this.isRecording = false;
      this.mediaRecorder = null;
      this.stream = null;
      this.chunks = [];
      
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      throw new Error(`Falha ao parar gravação: ${error.message}`);
    }
  }
  
  // Configurar o intervalo de processamento
  setupProcessingInterval() {
    // Limpar intervalo existente
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Criar novo intervalo
    this.processingInterval = setInterval(() => {
      if (!this.isRecording) return;
      
      const currentTime = Date.now();
      const elapsed = currentTime - this.lastProcessedTime;
      
      // Verificar se é hora de processar
      if (elapsed >= this.segmentDuration) {
        console.log(`Whisper: Processando segmento após ${Math.round(elapsed/1000)}s`);
        
        // Parar brevemente para coletar os dados
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
          
          // Processar os chunks atuais
          this.processCurrentChunks();
          
          // Atualizar timestamp
          this.lastProcessedTime = currentTime;
        }
      }
    }, 1000); // Verificar a cada segundo
  }
  
  // Processar os chunks de áudio acumulados
  async processCurrentChunks() {
    if (this.chunks.length === 0) {
      console.log('Whisper: Nenhum dado de áudio para processar');
      return;
    }
    
    // Se estamos dentro do tempo mínimo desde o último erro, pular
    if (this.lastErrorTime && Date.now() - this.lastErrorTime < 10000) {
      console.log('Whisper: Aguardando intervalo após erro recente antes de tentar novamente');
      return;
    }
    
    try {
      console.log(`Whisper: Processando ${this.chunks.length} chunks de áudio`);
      
      // Notificar início do processamento
      if (this.onStatusChange) {
        this.onStatusChange({ 
          status: 'processing', 
          message: 'Processando transcrição' 
        });
      }
      
      // Obter o MIME type usado para gravação
      let mimeType = this.mediaRecorder?.mimeType;
      
      // Se não temos o MIME type do MediaRecorder, usar um valor padrão compatível com Whisper
      if (!mimeType) {
        mimeType = 'audio/webm';
        console.log('Whisper: MediaRecorder MIME type não disponível, usando audio/webm');
      } else {
        console.log(`Whisper: Usando MIME type ${mimeType} do MediaRecorder`);
      }
      
      // Criar blob de áudio com o formato correto
      const audioBlob = new Blob(this.chunks, { type: mimeType });
      this.chunks = []; // Limpar para próximo ciclo
      
      // Verificar se o blob tem tamanho suficiente
      if (audioBlob.size < 1024) { // Menos de 1KB provavelmente é inválido
        console.warn(`Whisper: Arquivo de áudio muito pequeno (${audioBlob.size} bytes), provavelmente sem conteúdo`);
        if (this.onStatusChange) {
          this.onStatusChange({ 
            status: 'error', 
            message: 'Gravação de áudio muito curta ou sem conteúdo' 
          });
        }
        
        // Disparar evento de erro
        this.dispatchErrorEvent('Gravação de áudio muito curta ou sem conteúdo');
        return false;
      }
      
      // Verificar o token uma vez mais antes de enviar
      const authToken = this.getAuthToken();
      if (!authToken) {
        console.warn('Whisper: Não foi possível processar áudio - token de autenticação não encontrado');
        this.lastErrorTime = Date.now();
        this.dispatchAuthError();
        return false;
      }
      
      // Enviar para transcrição
      const transcription = await this.transcribeAudio(audioBlob);
      
      // Adicionar à lista de transcrições
      if (transcription && transcription.text) {
        const newTranscription = {
          id: `whisper_${Date.now()}`,
          text: transcription.text.trim(),
          timestamp: new Date().toISOString(),
          language: transcription.language || this.language
        };
        
        this.transcriptions.push(newTranscription);
        
        // Notificar sucesso
        if (this.onTranscriptionReceived) {
          this.onTranscriptionReceived(newTranscription);
        }
        
        // Disparar evento global
        window.dispatchEvent(new CustomEvent('whisper-transcription', {
          detail: newTranscription
        }));
        
        console.log('Whisper: Transcrição recebida:', newTranscription.text);
      } else {
        console.warn('Whisper: Transcrição vazia ou inválida');
      }
      
      // Notificar conclusão
      if (this.onStatusChange) {
        this.onStatusChange({ 
          status: 'ready', 
          message: 'Transcrição concluída' 
        });
      }
      
      // Resetar contador de erros em caso de sucesso
      this.lastErrorTime = null;
      
      return true;
    } catch (error) {
      console.error('Whisper: Erro ao processar chunks de áudio:', error);
      this.lastErrorTime = Date.now();
      
      // Notificar erro
      if (this.onTranscriptionError) {
        this.onTranscriptionError(error);
      }
      
      // Disparar evento de erro
      this.dispatchErrorEvent(error.message || 'Erro ao processar áudio');
      
      return false;
    }
  }
  
  // Enviar áudio para API de transcrição
  async transcribeAudio(audioBlob) {
    try {
      // Verificar novamente o tamanho do arquivo
      if (audioBlob.size < 1024) {
        console.warn(`Whisper: Arquivo de áudio muito pequeno (${audioBlob.size} bytes), provavelmente sem conteúdo`);
        if (this.onStatusChange) {
          this.onStatusChange({ 
            status: 'error', 
            message: 'Gravação de áudio muito curta ou sem conteúdo' 
          });
        }
        throw new Error(`Arquivo de áudio muito pequeno (${audioBlob.size} bytes), tente falar mais próximo ao microfone`);
      }
      
      // Usar o blob diretamente sem tentar convertê-lo
      const processedBlob = audioBlob;
      const mimeType = processedBlob.type.toLowerCase();
      
      console.log(`Whisper: Formato de áudio a ser enviado: ${mimeType}, tamanho: ${Math.round(processedBlob.size/1024)}KB`);
      
      // Notificar usuário que o áudio está sendo processado
      if (this.onStatusChange) {
        this.onStatusChange({ 
          status: 'processing', 
          message: 'Processando áudio...' 
        });
      }
      
      // Criar FormData
      const formData = new FormData();
      
      // Adicionar a extensão correta baseada no tipo MIME
      let fileExtension = 'webm'; // Padrão
      if (mimeType.includes('wav')) fileExtension = 'wav';
      else if (mimeType.includes('mp3')) fileExtension = 'mp3';
      else if (mimeType.includes('mp4')) fileExtension = 'mp4';
      else if (mimeType.includes('mpeg')) fileExtension = 'mp3';
      else if (mimeType.includes('ogg')) fileExtension = 'ogg';
      else if (mimeType.includes('flac')) fileExtension = 'flac';
      else if (mimeType.includes('m4a')) fileExtension = 'm4a';
      
      // Nome do arquivo com timestamp para evitar cache
      const filename = `recording_${Date.now()}.${fileExtension}`;
      
      console.log(`Whisper: Nome do arquivo a ser enviado: ${filename}`);
      
      // Adicionar o blob diretamente ao FormData
      formData.append('file', processedBlob, filename);
      formData.append('language', this.language);
      formData.append('model', 'whisper-1');  // Especificar o modelo explicitamente
      
      // Notificar que está enviando
      if (this.onStatusChange) {
        this.onStatusChange({ 
          status: 'uploading', 
          message: 'Enviando áudio para transcrição...' 
        });
      }
      
      // Verificar se existe uma implementação no backend para proxy
      let endpoint = `${this.apiUrl}/ai/whisper/transcribe`;
      
      // Obter token de autorização
      const authToken = this.getAuthToken();
      
      if (!authToken) {
        // Notificar sobre erro de autenticação
        this.dispatchAuthError();
        throw new Error('Token de autenticação não encontrado');
      }
      
      // Log para debug
      console.log(`Whisper: Enviando áudio para transcrição em ${endpoint}, formato: ${mimeType}, tamanho: ${Math.round(processedBlob.size/1024)}KB`);
      
      // Adicionar timeout para evitar que a requisição fique pendurada
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
      
      try {
        // Enviar para API
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData,
          signal: controller.signal
        });
        
        // Limpar o timeout ao receber a resposta
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Tentar obter detalhes do erro
          let errorDetails = '';
          let errorObj = null;
          
          try {
            errorObj = await response.json();
            errorDetails = errorObj.message || errorObj.error || JSON.stringify(errorObj);
          } catch (e) {
            errorDetails = await response.text() || response.statusText;
          }
          
          // Tratamento de erros específicos
          if (response.status === 401 || response.status === 403) {
            // Erro de autenticação, notificar ao usuário
            this.dispatchAuthError();
            throw new Error(`Erro de autenticação: ${response.status}`);
          } else if (response.status === 400) {
            // Erro de requisição inválida - provavelmente problema com o formato do áudio
            if (errorDetails.includes('Invalid file format') || 
                errorDetails.includes('formato de arquivo') || 
                errorDetails.includes('could not be decoded')) {
              
              console.error(`Whisper: Erro de formato de arquivo: ${errorDetails}`);
              
              // Erro específico de formato de arquivo
              if (this.onStatusChange) {
                this.onStatusChange({ 
                  status: 'error', 
                  message: 'Formato de áudio não compatível com a API de transcrição' 
                });
              }
              
              this.dispatchErrorEvent(`Formato de áudio não suportado. Por favor, tente novamente usando outro navegador ou configurações de áudio.`);
              
              throw new Error(`Formato de áudio incompatível: ${errorDetails}`);
            }
            
            // Outros erros 400
            if (this.onStatusChange) {
              this.onStatusChange({ 
                status: 'error', 
                message: 'Erro ao processar áudio' 
              });
            }
            
            throw new Error(`Erro ao processar áudio: ${errorDetails}`);
          } else if (response.status === 500) {
            // Erro no servidor
            if (this.onStatusChange) {
              this.onStatusChange({ 
                status: 'error', 
                message: 'Erro no servidor ao processar áudio' 
              });
            }
            
            throw new Error(`Erro no servidor: ${errorDetails}`);
          }
          
          // Erro genérico
          throw new Error(`Erro na API: ${response.status} ${response.statusText}. Detalhes: ${errorDetails}`);
        }
        
        const result = await response.json();
        
        // Verificar se temos os dados de transcrição
        if (!result || (!result.data && !result.text)) {
          throw new Error('Resposta da API sem dados de transcrição');
        }
        
        // Extrair o texto conforme a estrutura de resposta
        const finalResult = result.data || result;
        
        // Notificar que a transcrição foi concluída com sucesso
        if (this.onStatusChange) {
          this.onStatusChange({ 
            status: 'success', 
            message: 'Transcrição concluída com sucesso' 
          });
        }
        
        return finalResult;
      } catch (fetchError) {
        // Limpar o timeout em caso de erro
        clearTimeout(timeoutId);
        
        // Verificar se foi um erro de timeout
        if (fetchError.name === 'AbortError') {
          console.error('Whisper: Timeout na requisição de transcrição');
          if (this.onStatusChange) {
            this.onStatusChange({ 
              status: 'error', 
              message: 'Timeout na transcrição - o servidor demorou muito para responder' 
            });
          }
          throw new Error('Tempo limite excedido ao tentar transcrever o áudio. Tente novamente com um áudio mais curto.');
        }
        
        // Propagar outros erros
        throw fetchError;
      }
    } catch (error) {
      console.error('Whisper: Erro na transcrição:', error);
      
      // Disparar evento de erro para ouvintes
      this.dispatchErrorEvent(error.message);
      
      throw error;
    }
  }
  
  // Obter token de autenticação dos armazenamentos
  getAuthToken() {
    // Verificar em ordem de preferência
    const token = localStorage.getItem('authToken') || 
                 sessionStorage.getItem('authToken') || 
                 localStorage.getItem('token') || 
                 sessionStorage.getItem('token');
    
    // Atualizar a propriedade da classe
    this.authToken = token;
    
    if (!token) {
      console.log('Nenhum token de autenticação encontrado nos armazenamentos');
    } else {
      console.log('Token de autenticação encontrado');
    }
    
    return token;
  }
  
  // Disparar evento de erro de autenticação
  dispatchAuthError() {
    console.warn('Erro de autenticação - token não encontrado ou inválido');
    
    // Verificar se há algum token disponível no armazenamento
    const hasAnyToken = localStorage.getItem('authToken') || 
                       sessionStorage.getItem('authToken') || 
                       localStorage.getItem('token') || 
                       sessionStorage.getItem('token');
    
    const message = hasAnyToken 
      ? 'Sessão expirada ou token inválido. Por favor, faça login novamente.'
      : 'Você precisa estar logado para usar a funcionalidade de transcrição.';
    
    // Disparar evento global de erro de autenticação
    window.dispatchEvent(new CustomEvent('auth-error', {
      detail: { 
        message,
        source: 'whisper',
        hasToken: !!hasAnyToken
      }
    }));
    
    // Também disparar evento específico do whisper
    window.dispatchEvent(new CustomEvent('whisper-error', {
      detail: { 
        message: 'Erro de autenticação ao acessar o serviço de transcrição.',
        type: 'auth',
        hasToken: !!hasAnyToken
      }
    }));
    
    // Chamar callback de erro se existir
    if (this.onTranscriptionError) {
      this.onTranscriptionError({
        message,
        type: 'auth',
        hasToken: !!hasAnyToken
      });
    }
    
    // Atualizar status
    if (this.onStatusChange) {
      this.onStatusChange({
        status: 'error',
        message,
        type: 'auth'
      });
    }
    
    // Parar gravação para evitar mais erros
    if (this.isRecording) {
      this.stopRecording();
    }
  }
  
  // Disparar evento de erro genérico
  dispatchErrorEvent(message) {
    window.dispatchEvent(new CustomEvent('whisper-error', {
      detail: { 
        message: message || 'Erro na transcrição',
        type: 'transcription'
      }
    }));
  }
  
  // Métodos auxiliares
  setLanguage(languageCode) {
    this.language = languageCode;
  }
  
  setSegmentDuration(durationMs) {
    this.segmentDuration = durationMs;
  }
  
  getTranscriptions() {
    return [...this.transcriptions];
  }
  
  clearTranscriptions() {
    this.transcriptions = [];
  }
  
  // Configurar callbacks
  setCallbacks(callbacks) {
    if (callbacks.onTranscriptionStart) {
      this.onTranscriptionStart = callbacks.onTranscriptionStart;
    }
    
    if (callbacks.onTranscriptionReceived) {
      this.onTranscriptionReceived = callbacks.onTranscriptionReceived;
    }
    
    if (callbacks.onTranscriptionError) {
      this.onTranscriptionError = callbacks.onTranscriptionError;
    }
    
    if (callbacks.onStatusChange) {
      this.onStatusChange = callbacks.onStatusChange;
    }
  }
  
  // Obter o MIME type suportado pelo navegador
  getSupportedMimeType() {
    // Priorizar formatos mais confiáveis que são bem suportados pela API do Whisper
    const preferredMimeTypes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    
    for (const mimeType of preferredMimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log(`Whisper: Formato de áudio selecionado: ${mimeType}`);
        return mimeType;
      }
    }
    
    // Se nenhum dos tipos preferidos for suportado, usar o padrão
    console.log('Whisper: Nenhum formato preferido suportado, usando padrão.');
    return 'audio/webm';
  }
  
  /**
   * Processa os chunks de áudio e envia para transcrição
   * @param {Array<Blob>} chunks - Chunks de áudio coletados
   * @returns {Promise<string>} - Texto transcrito
   */
  async processAudioChunks(chunks) {
    if (!chunks || chunks.length === 0) {
      console.warn('Nenhum chunk de áudio para processar');
      return null;
    }
    
    try {
      console.log(`Processando ${chunks.length} chunks de áudio`);
      
      // Verificar se temos chunks com conteúdo válido
      const validChunks = chunks.filter(chunk => chunk && chunk.size > 0);
      
      if (validChunks.length === 0) {
        console.warn('Nenhum chunk válido encontrado para processar');
        return null;
      }
      
      // Obter o tipo do primeiro chunk válido
      const mimeType = validChunks[0].type || 'audio/webm';
      console.log(`Tipo de áudio detectado: ${mimeType}`);
      
      // Lista de formatos mais compatíveis com a API do Whisper
      const compatibleFormats = [
        'audio/mp3', 'audio/mpeg', 'audio/mp4', 
        'audio/wav', 'audio/x-wav',
        'audio/vnd.wave'
      ];
      
      // Se o formato não for diretamente compatível, precisamos tratar de forma especial
      const isDirectlyCompatible = compatibleFormats.some(format => 
        mimeType.toLowerCase().includes(format.toLowerCase())
      );
      
      // Criar um blob único com todos os chunks - usar 'let' para poder reatribuir depois
      let audioBlob = new Blob(validChunks, { type: mimeType });
      
      // Verificar tamanho do blob
      const fileSizeMB = audioBlob.size / (1024 * 1024);
      console.log(`Tamanho do arquivo de áudio: ${fileSizeMB.toFixed(2)} MB`);
      
      if (audioBlob.size <= 1024) { // Menos de 1KB é muito pequeno
        console.error('Arquivo de áudio muito pequeno (< 1KB)');
        return null;
      }
      
      if (fileSizeMB > 20) {
        console.warn(`Arquivo de áudio grande (${fileSizeMB.toFixed(2)} MB). Isso pode causar problemas.`);
      }
      
      // Selecionar a extensão correta baseada no tipo MIME
      let fileExtension = '.mp3'; // Usar .mp3 como padrão seguro
      
      if (mimeType.includes('wav')) fileExtension = '.wav';
      else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) fileExtension = '.mp3';
      else if (mimeType.includes('mp4')) fileExtension = '.mp4';
      else if (mimeType.includes('ogg')) fileExtension = '.ogg';
      else if (mimeType.includes('webm')) fileExtension = '.webm';
      else if (mimeType.includes('flac')) fileExtension = '.flac';
      
      // Determinar MIME type final para envio
      let finalMimeType = mimeType;
      
      // Se for WebM ou formato não diretamente compatível, tentar converter para WAV
      let shouldConvert = mimeType.includes('webm') || !isDirectlyCompatible;
      
      if (shouldConvert) {
        try {
          console.log('Formato não ideal detectado, tentando converter para WAV...');
          
          // Converter para WAV usando Web Audio API
          const convertedWavBlob = await this.convertToWav(audioBlob);
          
          if (convertedWavBlob && convertedWavBlob.size > 1024) {
            console.log(`Conversão para WAV bem-sucedida. Tamanho original: ${Math.round(audioBlob.size/1024)}KB, tamanho convertido: ${Math.round(convertedWavBlob.size/1024)}KB`);
            fileExtension = '.wav';
            finalMimeType = 'audio/wav';
            
            // Substituir o blob original
            audioBlob = convertedWavBlob;
          } else {
            console.warn('Conversão para WAV falhou ou gerou arquivo muito pequeno. Usando formato original.');
          }
        } catch (error) {
          console.warn('Erro ao converter áudio:', error.message);
          console.log('Continuando com o formato original');
        }
      }
      
      // Adicionar timestamp e identificador único no nome do arquivo
      const timestamp = new Date().getTime();
      const randomId = Math.floor(Math.random() * 1000000);
      const fileName = `audio_${timestamp}_${randomId}${fileExtension}`;
      
      console.log(`Nome do arquivo para envio: ${fileName}, MIME type: ${finalMimeType}`);
      
      // Verificar token
      const authToken = this.getAuthToken();
      if (!authToken) {
        console.error('Token de autenticação não encontrado');
        this.dispatchAuthError();
        throw new Error('Token de autenticação não encontrado');
      }
      
      // Criar FormData
      const formData = new FormData();
      
      // Log detalhado antes de enviar
      console.log('Enviando áudio para transcrição com os seguintes detalhes:');
      console.log(`- Nome: ${fileName}`);
      console.log(`- Tipo MIME: ${finalMimeType}`);
      console.log(`- Tamanho: ${Math.round(audioBlob.size / 1024)}KB`);
      
      // Adicionar o arquivo com todas as informações corretas
      formData.append('file', new Blob([audioBlob], { type: finalMimeType }), fileName);
      
      // Adicionar idioma (português)
      formData.append('language', 'pt');
      
      // Adicionar timeout para evitar requisições penduradas
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      try {
        // Enviar para API
        const response = await fetch(`${this.apiUrl}/ai/whisper/transcribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData,
          signal: controller.signal
        });
        
        // Limpar timeout
        clearTimeout(timeout);
        
        if (!response.ok) {
          const errorText = await response.text();
          
          console.error(`Erro na API (${response.status}): ${errorText}`);
          
          if (response.status === 401 || response.status === 403) {
            console.error('Erro de autenticação ao acessar a API');
            this.dispatchAuthError();
            throw new Error('Sessão expirada ou inválida. Faça login novamente.');
          }
          
          throw new Error(`Erro na API de transcrição: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result || !result.success) {
          console.warn('Resposta da API não indica sucesso:', result);
          throw new Error(result.error || 'Erro não especificado na transcrição');
        }
        
        if (!result.data || !result.data.text) {
          console.warn('Resposta da API não contém texto transcrito:', result);
          return null;
        }
        
        const transcribedText = result.data.text;
        console.log(`Transcrição recebida (${transcribedText.length} caracteres): "${transcribedText.substring(0, 100)}${transcribedText.length > 100 ? '...' : ''}"`);
        
        // Disparar evento de transcrição
        const transcriptionEvent = {
          id: `whisper_${Date.now()}`,
          text: transcribedText,
          timestamp: new Date().toISOString()
        };
        
        window.dispatchEvent(new CustomEvent('whisper-transcription', {
          detail: transcriptionEvent
        }));
        
        return transcribedText;
      } catch (fetchError) {
        // Limpar timeout em caso de erro
        clearTimeout(timeout);
        
        // Verificar se foi timeout
        if (fetchError.name === 'AbortError') {
          console.error('Timeout na requisição (30 segundos)');
          throw new Error('Tempo limite excedido. A requisição demorou mais de 30 segundos.');
        }
        
        console.error('Erro ao enviar áudio para transcrição:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      throw new Error(`Falha na transcrição: ${error.message}`);
    }
  }
  
  /**
   * Converte um blob de áudio para o formato WAV usando Web Audio API
   * @param {Blob} audioBlob - Blob contendo áudio em qualquer formato
   * @returns {Promise<Blob>} - Blob contendo áudio em formato WAV
   */
  async convertToWav(audioBlob) {
    return new Promise(async (resolve, reject) => {
      try {
        // Criar contexto de áudio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Converter o blob para um ArrayBuffer
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // Decodificar o áudio
        audioContext.decodeAudioData(arrayBuffer, (decodedData) => {
          try {
            // Criar buffer de saída com mesmas características do áudio decodificado
            const numberOfChannels = decodedData.numberOfChannels;
            const sampleRate = decodedData.sampleRate;
            const length = decodedData.length;
            
            console.log(`Convertendo áudio: ${numberOfChannels} canais, ${sampleRate}Hz, ${length} amostras`);
            
            // Criar buffer offline para renderizar o áudio
            const offlineContext = new OfflineAudioContext(
              numberOfChannels,
              length,
              sampleRate
            );
            
            // Criar origem do buffer para reprodução
            const source = offlineContext.createBufferSource();
            source.buffer = decodedData;
            
            // Conectar ao destino e iniciar renderização
            source.connect(offlineContext.destination);
            source.start(0);
            
            // Renderizar para um novo buffer
            offlineContext.startRendering().then((renderedBuffer) => {
              // Converter para WAV
              const wavBlob = this.createWavBlobFromAudioBuffer(renderedBuffer);
              console.log(`Áudio WAV gerado: ${Math.round(wavBlob.size / 1024)}KB`);
              
              // Fechar contextos de áudio
              audioContext.close();
              
              resolve(wavBlob);
            }).catch((err) => {
              console.error('Erro na renderização de áudio:', err);
              audioContext.close();
              reject(err);
            });
          } catch (err) {
            console.error('Erro ao processar dados de áudio:', err);
            audioContext.close();
            reject(err);
          }
        }, (err) => {
          console.error('Erro ao decodificar áudio:', err);
          audioContext.close();
          reject(err);
        });
      } catch (err) {
        console.error('Erro ao iniciar conversão de áudio:', err);
        reject(err);
      }
    }.bind(this)); // Adicionar bind(this) para preservar o contexto
  }
  
  /**
   * Cria um blob WAV a partir de um AudioBuffer
   * @param {AudioBuffer} audioBuffer - Buffer de áudio
   * @returns {Blob} - Blob contendo áudio WAV
   */
  createWavBlobFromAudioBuffer(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM linear
    const bitDepth = 16; // 16 bits por amostra
    
    // Extract the data from the AudioBuffer
    const channelData = [];
    for (let channel = 0; channel < numberOfChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }
    
    // Interleave the channel data and convert to 16-bit samples
    const interleaved = new Int16Array(audioBuffer.length * numberOfChannels);
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        interleaved[i * numberOfChannels + channel] = sample < 0
          ? sample * 0x8000
          : sample * 0x7FFF;
      }
    }
    
    // Create the WAV file header
    const dataSize = interleaved.length * 2; // 2 bytes per sample (16-bit)
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk descriptor
    this._writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true); // File size - 8 bytes
    this._writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    this._writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true); // Audio format (1 = PCM)
    view.setUint16(22, numberOfChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true); // Byte rate
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true); // Block align
    view.setUint16(34, bitDepth, true); // Bits per sample
    
    // "data" sub-chunk
    this._writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true); // Data size
    
    // Write audio data
    const interleavedData = new Uint8Array(buffer, headerSize);
    const interleavedBytes = new Uint8Array(interleaved.buffer);
    interleavedData.set(interleavedBytes);
    
    // Create blob with WAV format
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  /**
   * Auxiliar para escrever strings em um DataView
   * @param {DataView} view - DataView onde escrever
   * @param {number} offset - Posição inicial
   * @param {string} string - String a ser escrita
   * @private
   */
  _writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  /**
   * Atualiza o token de autenticação da sessão
   * @returns {string|null} - Token atualizado ou null se não encontrado
   */
  refreshAuthToken() {
    this.authToken = this.getAuthToken();
    return this.authToken;
  }
  
  /**
   * Configura a sensibilidade da detecção de silêncio
   * @param {Object} options - Opções de configuração
   * @param {number} [options.threshold] - Limiar de silêncio em dB (-60 a 0, mais negativo = mais sensível)
   * @param {number} [options.silenceTime] - Tempo de silêncio em ms antes de parar
   * @param {number} [options.maxDuration] - Duração máxima da gravação em ms
   */
  configureSilenceDetection(options = {}) {
    if (options.threshold !== undefined) {
      // Limitar entre -60 e -10 dB
      this.silenceThresholdDb = Math.max(-60, Math.min(-10, options.threshold));
    }
    
    if (options.silenceTime !== undefined) {
      // Limitar entre 500ms e 5000ms (0.5s a 5s)
      this.silenceTimeoutMs = Math.max(500, Math.min(5000, options.silenceTime));
      // Converter para frames (assumindo ~60fps)
      this.framesForSilence = Math.round(this.silenceTimeoutMs / (1000 / 60));
    }
    
    if (options.maxDuration !== undefined) {
      // Limitar entre 5s e 30s
      this.maxRecordingDuration = Math.max(5000, Math.min(30000, options.maxDuration));
    }
    
    console.log('Configurações de silêncio atualizadas:', {
      threshold: this.silenceThresholdDb + 'dB',
      silenceTime: this.silenceTimeoutMs + 'ms',
      framesForSilence: this.framesForSilence,
      maxDuration: this.maxRecordingDuration + 'ms'
    });
  }
}

export default WhisperTranscriptionService; 