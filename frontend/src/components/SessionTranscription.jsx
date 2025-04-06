import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SessionTranscription.css';

const SessionTranscription = ({ sessionId, isActive = false }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState('');
  const transcriptsEndRef = useRef(null);
  
  // Simulação de reconhecimento de voz (em uma implementação real, isso seria integrado com uma API de reconhecimento de voz)
  const [recognition, setRecognition] = useState(null);
  
  useEffect(() => {
    if (sessionId) {
      fetchTranscripts();
    }
    
    // Inicializar reconhecimento de voz se disponível no navegador
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
          
        setMessage(transcript);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [sessionId]);
  
  // Rolar para o final quando novos transcripts são adicionados
  useEffect(() => {
    scrollToBottom();
  }, [transcripts]);
  
  const scrollToBottom = () => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/ai/transcriptions/session/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTranscripts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar transcrições:', error);
      setLoading(false);
    }
  };
  
  const handleStartRecording = () => {
    if (recognition) {
      recognition.start();
      setRecording(true);
    }
  };
  
  const handleStopRecording = async () => {
    if (recognition) {
      recognition.stop();
      setRecording(false);
      
      if (message.trim()) {
        await sendTranscription(message);
        setMessage('');
      }
    }
  };
  
  const sendTranscription = async (content) => {
    try {
      const response = await axios.post('/api/ai/transcriptions', {
        sessionId,
        speaker: 'user', // Em uma implementação real, isso seria o nome do usuário atual
        content
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Adicionar a nova transcrição ao estado
      setTranscripts(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Erro ao enviar transcrição:', error);
    }
  };
  
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (message.trim()) {
      await sendTranscription(message);
      setMessage('');
    }
  };
  
  return (
    <div className="session-transcription">
      <div className="transcription-header">
        <h3>Transcrição da Sessão</h3>
        {isActive && (
          <div className="recording-controls">
            {recording ? (
              <button 
                onClick={handleStopRecording} 
                className="stop-recording-btn"
              >
                Parar Gravação
              </button>
            ) : (
              <button 
                onClick={handleStartRecording} 
                className="start-recording-btn"
              >
                Iniciar Gravação
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="transcripts-container">
        {loading ? (
          <div className="loading">Carregando transcrições...</div>
        ) : transcripts.length === 0 ? (
          <div className="no-transcripts">Nenhuma transcrição disponível</div>
        ) : (
          transcripts.map((transcript, index) => (
            <div 
              key={index} 
              className={`transcript-item ${transcript.speaker === 'user' ? 'user' : 'other'}`}
            >
              <div className="transcript-speaker">{transcript.speaker}</div>
              <div className="transcript-content">{transcript.content}</div>
              <div className="transcript-time">
                {new Date(transcript.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={transcriptsEndRef} />
      </div>
      
      {isActive && (
        <form onSubmit={handleSubmitMessage} className="message-input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite ou grave sua mensagem..."
            className="message-input"
          />
          <button type="submit" className="send-message-btn">Enviar</button>
        </form>
      )}
    </div>
  );
};

export default SessionTranscription; 