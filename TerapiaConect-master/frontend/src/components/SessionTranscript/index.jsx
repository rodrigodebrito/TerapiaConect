import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  AnalyticsOutlined, 
  Description, 
  AutoStories,
  KeyboardArrowDown 
} from '@mui/icons-material';
import aiService from '../../services/ai.service';

/**
 * Componente que exibe e gerencia as transcrições da sessão
 */
const SessionTranscript = ({ sessionId, isTherapist }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const listRef = useRef(null);

  // Função para buscar transcrições
  const fetchTranscripts = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await aiService.getSessionTranscripts(sessionId);
      setTranscripts(response.data);
      
      // Rola para a última mensagem
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao buscar transcrições:', error);
      setError('Não foi possível carregar as transcrições');
    } finally {
      setLoading(false);
    }
  };

  // Função para analisar a sessão
  const analyzeSession = async () => {
    if (!sessionId || !isTherapist) return;

    try {
      setAnalyzing(true);
      setError(null);
      const response = await aiService.analyzeSession(sessionId);
      setAnalysis(response.analysis);
    } catch (error) {
      console.error('Erro ao analisar sessão:', error);
      setError('Não foi possível analisar a sessão');
    } finally {
      setAnalyzing(false);
    }
  };

  // Função para gerar relatório
  const generateReport = async () => {
    if (!sessionId || !isTherapist) return;

    try {
      const response = await aiService.generateReport(sessionId);
      // Aqui você pode implementar a lógica para exibir ou baixar o relatório
      console.log('Relatório gerado:', response);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setError('Não foi possível gerar o relatório');
    }
  };

  // Busca transcrições quando o componente é montado
  useEffect(() => {
    fetchTranscripts();
    // Atualiza as transcrições a cada 10 segundos
    const interval = setInterval(fetchTranscripts, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRadius: 2
      }}
    >
      {/* Cabeçalho */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        borderBottom={1}
        borderColor="divider"
      >
        <Typography variant="h6">
          Transcrição da Sessão
        </Typography>
        {isTherapist && (
          <Box>
            <Tooltip title="Analisar Sessão">
              <IconButton onClick={analyzeSession} disabled={analyzing}>
                <AnalyticsOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Gerar Relatório">
              <IconButton onClick={generateReport}>
                <Description />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Lista de transcrições */}
      <List
        ref={listRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : transcripts.length === 0 ? (
          <Typography align="center" color="textSecondary">
            Nenhuma transcrição disponível
          </Typography>
        ) : (
          transcripts.map((transcript, index) => (
            <ListItem
              key={transcript.id}
              sx={{
                backgroundColor: transcript.speaker === 'Terapeuta' ? 'action.hover' : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle2" color="primary">
                    {transcript.speaker}
                  </Typography>
                }
                secondary={transcript.content}
                secondaryTypographyProps={{
                  variant: 'body2',
                  color: 'textPrimary'
                }}
              />
            </ListItem>
          ))
        )}
      </List>

      {/* Análise da sessão (se disponível) */}
      {analysis && (
        <Box
          p={2}
          borderTop={1}
          borderColor="divider"
          bgcolor="action.hover"
        >
          <Typography variant="subtitle2" color="primary" gutterBottom>
            <AutoStories sx={{ mr: 1, verticalAlign: 'middle' }} />
            Análise da IA
          </Typography>
          <Typography variant="body2">
            {analysis}
          </Typography>
        </Box>
      )}

      {/* Indicador de rolagem */}
      {transcripts.length > 0 && (
        <Box
          display="flex"
          justifyContent="center"
          p={1}
          borderTop={1}
          borderColor="divider"
        >
          <IconButton
            size="small"
            onClick={() => {
              if (listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
              }
            }}
          >
            <KeyboardArrowDown />
          </IconButton>
        </Box>
      )}
    </Paper>
  );
};

export default SessionTranscript; 