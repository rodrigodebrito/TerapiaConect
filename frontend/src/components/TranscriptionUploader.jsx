import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper, 
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  IconButton
} from '@mui/material';
import { CloudUpload, Check, Error, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import * as transcriptionApi from '../api/transcription';
import { toast } from 'react-hot-toast';

const LANGUAGE_OPTIONS = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'de', label: 'Alemão' },
  { value: 'it', label: 'Italiano' }
];

const CATEGORIES = [
  'Terapia Cognitiva',
  'Terapia Comportamental',
  'Psicanálise',
  'Terapia Sistêmica',
  'Constelação Familiar',
  'Psicoterapia Breve',
  'Terapia Infantil',
  'Terapia de Casal',
  'Autoconhecimento',
  'Desenvolvimento Pessoal',
  'Técnicas Terapêuticas',
  'Exercícios Práticos'
];

const TranscriptionUploader = ({ onCompleted, showInMaterials = true }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('pt');
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [materialId, setMaterialId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Verificar status periodicamente se estiver processando
  useEffect(() => {
    let interval;
    
    if (processing && materialId) {
      interval = setInterval(async () => {
        try {
          const status = await transcriptionApi.checkTranscriptionStatus(materialId);
          
          if (status.isComplete) {
            clearInterval(interval);
            setProcessing(false);
            
            if (status.hasError) {
              setError('Ocorreu um erro durante a transcrição.');
              toast.error('Erro na transcrição. Tente novamente.');
            } else {
              setProgress(100);
              setStatusMessage('Transcrição concluída com sucesso!');
              toast.success('Transcrição concluída com sucesso!');
              
              if (onCompleted && typeof onCompleted === 'function') {
                onCompleted(materialId);
              }
            }
          } else {
            setProgress(status.contentLength > 100 ? 75 : 50);
            setStatusMessage('Transcrição em andamento...');
          }
        } catch (err) {
          console.error('Erro ao verificar status:', err);
        }
      }, 5000); // Verificar a cada 5 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processing, materialId, onCompleted]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Verificar tamanho do arquivo (limite de 25 MB)
      const maxSizeBytes = 25 * 1024 * 1024;
      if (selectedFile.size > maxSizeBytes) {
        setError(`O arquivo excede o limite de tamanho de 25 MB. Tamanho atual: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB.`);
        // Limpar o input de arquivo
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      // Sugerir título baseado no nome do arquivo
      if (!title) {
        let fileName = selectedFile.name;
        // Remover extensão
        fileName = fileName.replace(/\.[^/.]+$/, '');
        // Substituir underscores e hifens por espaços
        fileName = fileName.replace(/[_-]/g, ' ');
        // Capitalizar primeira letra de cada palavra
        fileName = fileName.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        setTitle(fileName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Selecione um arquivo para transcrever');
      return;
    }
    
    if (!title) {
      setError('Informe um título para a transcrição');
      return;
    }
    
    if (categories.length === 0) {
      setError('Selecione pelo menos uma categoria');
      return;
    }
    
    setError(null);
    setUploading(true);
    setProgress(25);
    setStatusMessage('Enviando arquivo...');
    
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('title', title);
      formData.append('language', language);
      
      categories.forEach(category => {
        formData.append('categories[]', category);
      });
      
      const response = await transcriptionApi.transcribeMedia(formData);
      
      setMaterialId(response.id);
      setUploading(false);
      setProcessing(true);
      setProgress(50);
      setStatusMessage('Iniciando transcrição...');
      
      toast.success('Arquivo enviado com sucesso! A transcrição foi iniciada.');
      
      if (!showInMaterials) {
        toast('A transcrição pode levar alguns minutos. Você poderá verificar o resultado na seção de materiais.', {
          duration: 5000,
          icon: '📝'
        });
      }
    } catch (err) {
      console.error('Erro ao transcrever:', err);
      setUploading(false);
      setProcessing(false);
      
      // Exibir mensagem de erro mais detalhada
      const errorMessage = err.response?.data?.error || 'Erro ao enviar arquivo para transcrição. Tente novamente.';
      const suggestedAction = err.response?.data?.suggestedAction || '';
      
      setError(errorMessage + (suggestedAction ? ` ${suggestedAction}` : ''));
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setLanguage('pt');
    setCategories([]);
    setUploading(false);
    setProcessing(false);
    setMaterialId(null);
    setProgress(0);
    setError(null);
    setStatusMessage('');
  };

  const handleCategoryChange = (e) => {
    setCategories(e.target.value);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Transcrição de Áudio/Vídeo
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!uploading && !processing && progress === 0 && (
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Faça upload de um arquivo de áudio ou vídeo para transcrevê-lo automaticamente.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Limitações:</strong>
                <ul>
                  <li>Tamanho máximo: 25 MB</li>
                  <li>Formatos aceitos: MP3, MP4, WAV, M4A, WEBM, MPG, MPEG, MPGA, OGG</li>
                  <li>Para arquivos maiores, considere compactá-los ou dividi-los em partes menores</li>
                </ul>
              </Typography>
            </Alert>
            
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ py: 2 }}
            >
              Selecionar Arquivo de Áudio/Vídeo
              <input
                type="file"
                hidden
                accept="audio/*,video/*"
                onChange={handleFileChange}
              />
            </Button>
            
            {file && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="primary" sx={{ flexGrow: 1 }}>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
                <IconButton size="small" onClick={() => setFile(null)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            )}
            <FormHelperText>
              Formatos suportados: MP3, WAV, MP4, MOV, etc. (máx 25MB)
            </FormHelperText>
          </Box>
          
          <TextField
            fullWidth
            label="Título da Transcrição"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="language-label">Idioma</InputLabel>
            <Select
              labelId="language-label"
              value={language}
              label="Idioma"
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Selecione o idioma principal do áudio para melhores resultados
            </FormHelperText>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="categories-label">Categorias</InputLabel>
            <Select
              labelId="categories-label"
              multiple
              value={categories}
              label="Categorias"
              onChange={handleCategoryChange}
            >
              {CATEGORIES.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Selecione uma ou mais categorias para organizar o material
            </FormHelperText>
          </FormControl>
          
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              type="submit"
              disabled={!file || !title || categories.length === 0}
            >
              Iniciar Transcrição
            </Button>
          </Box>
        </form>
      )}
      
      {(uploading || processing || progress > 0) && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress variant="determinate" value={progress} size={80} />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary">
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            {statusMessage}
          </Typography>
          
          {progress === 100 ? (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Check />}
                onClick={handleReset}
              >
                Nova Transcrição
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Este processo pode levar alguns minutos dependendo da duração do arquivo.
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TranscriptionUploader; 