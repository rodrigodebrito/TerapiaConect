import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, CircularProgress } from '@mui/material';
import { Lightbulb, Close, Refresh } from '@mui/icons-material';
import aiService from '../../services/ai.service';

/**
 * Componente que exibe sugestões da IA durante a sessão
 */
const AIAssistant = ({ sessionId, isTherapist }) => {
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  // Função para buscar sugestões da IA
  const fetchSuggestions = async () => {
    if (!sessionId || !isTherapist) return;

    try {
      setLoading(true);
      setError(null);
      const response = await aiService.generateSuggestions(sessionId);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setError('Não foi possível carregar as sugestões');
    } finally {
      setLoading(false);
    }
  };

  // Busca sugestões quando o componente é montado
  useEffect(() => {
    if (isTherapist) {
      fetchSuggestions();
    }
  }, [sessionId, isTherapist]);

  // Se não for terapeuta, não mostra nada
  if (!isTherapist) return null;

  // Se estiver fechado, mostra apenas o botão de abrir
  if (!isOpen) {
    return (
      <Box
        position="fixed"
        bottom={20}
        right={20}
        zIndex={1000}
      >
        <IconButton
          color="primary"
          onClick={() => setIsOpen(true)}
          sx={{
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              backgroundColor: 'background.paper',
            }
          }}
        >
          <Lightbulb />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      bottom={20}
      right={20}
      zIndex={1000}
      width={300}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 2
        }}
      >
        {/* Cabeçalho */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <Lightbulb sx={{ mr: 1 }} /> Assistente IA
          </Typography>
          <Box>
            <IconButton size="small" onClick={fetchSuggestions} disabled={loading}>
              <Refresh />
            </IconButton>
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Conteúdo */}
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : (
            <Typography variant="body2">
              {suggestions}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AIAssistant; 