// Teste do serviço WhisperTranscription
import whisperTranscriptionService from './services/whisperTranscriptionService';

// Configurar ouvintes de eventos
document.addEventListener('whisper:recordingStarted', (e) => {
  console.log('Evento: Gravação iniciada', e.detail);
});

document.addEventListener('whisper:recordingStopped', (e) => {
  console.log('Evento: Gravação finalizada', e.detail);
});

document.addEventListener('whisper:processingAudio', (e) => {
  console.log('Evento: Processando áudio', e.detail);
});

document.addEventListener('whisper:transcribing', (e) => {
  console.log('Evento: Enviando para transcrição', e.detail);
});

document.addEventListener('whisper:transcriptionResult', (e) => {
  console.log('Evento: Transcrição recebida', e.detail);
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerText = e.detail.text || 'Texto vazio';
  }
});

document.addEventListener('whisper:transcriptionError', (e) => {
  console.error('Evento: Erro na transcrição', e.detail);
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerText = `Erro: ${e.detail.error}`;
    resultDiv.style.color = 'red';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Configurar botões
  const startBtn = document.getElementById('startRecording');
  const stopBtn = document.getElementById('stopRecording');
  const cancelBtn = document.getElementById('cancelRecording');

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      const success = await whisperTranscriptionService.startRecording();
      if (success) {
        console.log('Gravação iniciada com sucesso');
        document.getElementById('status').innerText = 'Gravando...';
        document.getElementById('status').style.color = 'red';
      } else {
        console.error('Falha ao iniciar gravação');
        document.getElementById('status').innerText = 'Erro ao iniciar gravação';
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      await whisperTranscriptionService.stopRecording();
      console.log('Gravação interrompida');
      document.getElementById('status').innerText = 'Processando...';
      document.getElementById('status').style.color = 'blue';
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      whisperTranscriptionService.cancelRecording();
      console.log('Gravação cancelada');
      document.getElementById('status').innerText = 'Pronto';
      document.getElementById('status').style.color = 'black';
    });
  }
});

// Definir endpoint diretamente antes da inicialização
whisperTranscriptionService.apiEndpoint = 'http://localhost:3000/api/ai/whisper/transcribe';
// Desabilitar envio de credenciais para testes (não precisamos de autenticação agora)
whisperTranscriptionService.useCredentials = false;

// Log para confirmar as configurações
console.log('Configuração do Whisper:', {
  endpoint: whisperTranscriptionService.apiEndpoint,
  useCredentials: whisperTranscriptionService.useCredentials
});

// Exportar para uso global
window.whisperService = whisperTranscriptionService;
console.log('Serviço de transcrição Whisper inicializado');

export { whisperTranscriptionService }; 