// E modificar o método onTranscriptionResult para mostrar o resultado
onTranscriptionResult(event) {
  console.log('Transcrição recebida do serviço:', event.detail.text);
  
  // Mostrar a transcrição na interface
  this.transcriptionHistory.push({
    text: event.detail.text,
    timestamp: new Date().toLocaleTimeString()
  });
  
  // A gravação foi automaticamente encerrada e será reiniciada pelo serviço
  this.isWaitingForTranscription = false;
  this.isRecording = true; // Mantém o estado como gravando na UI
}

mounted() {
  // Inicializar o serviço
  this.transcriptionService = whisperTranscriptionService;
  
  // IMPORTANTE: Forçar a ativação do reinício automático
  console.log('Configurando reinício automático...');
  setTimeout(() => {
    console.log('Ativando autoRestart NO SERVIÇO');
    this.transcriptionService.setAutoRestart(true);
    console.log('Status do autoRestart:', this.transcriptionService.autoRestart ? 'ATIVADO' : 'DESATIVADO');
  }, 500);
  
  // Configurar os listeners de eventos
  document.addEventListener('whisper:transcription', this.onTranscriptionResult);
  document.addEventListener('whisper:recordingStarted', this.onRecordingStarted);
  document.addEventListener('whisper:recordingStopped', this.onRecordingStopped);
  document.addEventListener('whisper:processingAudio', this.onProcessingAudio);
  document.addEventListener('whisper:transcriptionError', this.onTranscriptionError);
  
  console.log('AudioRecorder montado e configurado com reinício automático');
},

// Métodos para lidar com os eventos do serviço
onRecordingStarted(event) {
  console.log('Gravação iniciada automaticamente');
  this.isRecording = true;
  this.isWaitingForTranscription = false;
},

onRecordingStopped(event) {
  // Não atualizar UI quando for parada automática
  console.log('Gravação parada temporariamente (reiniciando em breve)');
},

onProcessingAudio(event) {
  console.log('Processando áudio:', event.detail);
  this.isWaitingForTranscription = true;
},

onTranscriptionError(event) {
  console.error('Erro na transcrição:', event.detail.error);
  this.error = event.detail.error;
  this.isWaitingForTranscription = false;
  
  // Em caso de erro, tentar reiniciar manualmente a gravação
  setTimeout(() => {
    if (this.transcriptionService.autoRestart) {
      console.log('Tentando reiniciar gravação após erro...');
      this.transcriptionService.startRecording();
    }
  }, 2000);
},

// Método para iniciar a gravação manualmente
startRecording() {
  console.log('Iniciando gravação manualmente');
  this.error = null;
  this.transcriptionService.startRecording()
    .then((success) => {
      this.isRecording = success;
      if (!success) {
        this.error = 'Não foi possível iniciar a gravação';
      }
    })
    .catch((error) => {
      this.error = error.message;
      this.isRecording = false;
    });
},

// Método para parar a gravação manualmente
stopRecording() {
  console.log('Parando gravação manualmente');
  this.transcriptionService.stopRecording()
    .then(() => {
      this.isRecording = false;
      this.isWaitingForTranscription = true;
    })
    .catch((error) => {
      this.error = error.message;
    });
},

// Limpar os listeners quando o componente for destruído
beforeDestroy() {
  document.removeEventListener('whisper:transcription', this.onTranscriptionResult);
  document.removeEventListener('whisper:recordingStarted', this.onRecordingStarted);
  document.removeEventListener('whisper:recordingStopped', this.onRecordingStopped);
  document.removeEventListener('whisper:processingAudio', this.onProcessingAudio);
  document.removeEventListener('whisper:transcriptionError', this.onTranscriptionError);
  
  // Garantir que a gravação seja encerrada
  this.transcriptionService.stopAndReset();
  this.transcriptionService.setAutoRestart(false);
},

// Método para forçar o reinício da gravação
forceRestart() {
  console.log('Usuário solicitou reinício forçado da gravação');
  this.transcriptionService.forceRestartRecording()
    .then((success) => {
      if (success) {
        console.log('Reinício forçado realizado com sucesso');
      } else {
        this.error = 'Falha ao reiniciar gravação';
      }
    })
    .catch((error) => {
      this.error = `Erro no reinício: ${error.message}`;
    });
} 