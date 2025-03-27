import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Close, Download, Print } from '@mui/icons-material';
import aiService from '../../services/ai.service';

/**
 * Componente que exibe o relatório da sessão
 */
const SessionReport = ({ sessionId, open, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para gerar o relatório
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiService.generateReport(sessionId);
      setReport(response.report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setError('Não foi possível gerar o relatório');
    } finally {
      setLoading(false);
    }
  };

  // Gera o relatório quando o diálogo é aberto
  React.useEffect(() => {
    if (open && !report && !loading) {
      generateReport();
    }
  }, [open]);

  // Função para baixar o relatório como PDF
  const downloadReport = () => {
    // Aqui você pode implementar a lógica para baixar o relatório como PDF
    console.log('Baixando relatório...');
  };

  // Função para imprimir o relatório
  const printReport = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Relatório da Sessão
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box p={4}>
            <Typography color="error" align="center">
              {error}
            </Typography>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="outlined"
                color="primary"
                onClick={generateReport}
              >
                Tentar Novamente
              </Button>
            </Box>
          </Box>
        ) : report ? (
          <Box className="print-content">
            {/* Cabeçalho do Relatório */}
            <Box mb={4}>
              <Typography variant="h5" gutterBottom align="center">
                Relatório de Sessão Terapêutica
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" align="center">
                Gerado em: {new Date().toLocaleDateString()}
              </Typography>
            </Box>

            {/* Conteúdo do Relatório */}
            <Box mb={4}>
              <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                {report.content}
              </Typography>
            </Box>

            {/* Rodapé do Relatório */}
            <Box mt={4} pt={2} borderTop={1} borderColor="divider">
              <Typography variant="caption" color="textSecondary">
                Este relatório foi gerado automaticamente pelo sistema de IA do TerapiaConnect.
                As informações contidas neste documento são confidenciais e destinadas apenas
                para uso profissional.
              </Typography>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<Download />}
          onClick={downloadReport}
          disabled={!report}
        >
          Baixar PDF
        </Button>
        <Button
          startIcon={<Print />}
          onClick={printReport}
          disabled={!report}
        >
          Imprimir
        </Button>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionReport; 