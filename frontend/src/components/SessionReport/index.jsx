import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
import aiService from '../../services/aiService';

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
      console.log('SessionReport: Gerando relatório para sessão', sessionId);
      
      const response = await aiService.generateReport(sessionId);
      console.log('SessionReport: Resposta completa do aiService:', response);
      
      if (response.error) {
        console.error('SessionReport: Erro recebido:', response.error);
        setError(response.error);
        return;
      }
      
      // Obter o texto do relatório diretamente
      let reportText = typeof response === 'string' 
        ? response 
        : response.report;
      
      console.log('SessionReport: Texto do relatório extraído:', reportText);
      
      if (!reportText || reportText.length < 30 || reportText === 'Não foi possível gerar conteúdo específico para esta sessão.') {
        // Se não houver texto de relatório válido, use o relatório completo da resposta
        console.warn('SessionReport: Relatório vazio ou muito curto, verificando campos alternativos');
        
        // Tentar extrair o relatório de outros campos possíveis
        if (response.data && typeof response.data === 'string' && response.data.length > 100) {
          reportText = response.data;
          console.log('SessionReport: Usando response.data como relatório');
        } else if (response.content && typeof response.content === 'string' && response.content.length > 100) {
          reportText = response.content;
          console.log('SessionReport: Usando response.content como relatório');
        } else {
          console.warn('SessionReport: Relatório inadequado, usando mensagem do servidor');
          // Verificar se temos a resposta original do servidor
          reportText = reportText || 'Não foi possível gerar um relatório detalhado para esta sessão.';
        }
      }
      
      // Se ainda temos um relatório curto, registre no console
      if (reportText && reportText.length < 100) {
        console.warn('SessionReport: Relatório final ainda é muito curto:', reportText);
      } else {
        console.log('SessionReport: Relatório final tem', reportText?.length || 0, 'caracteres');
      }
      
      setReport(reportText);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setError('Não foi possível gerar o relatório: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gera o relatório quando o diálogo é aberto
  useEffect(() => {
    if (open && !report && !loading) {
      generateReport();
    }
  }, [open, report, loading]);

  // Função para baixar o relatório como texto
  const downloadReport = () => {
    if (!report) return;
    
    // Criar um elemento temporário para conter o relatório
    const element = document.createElement('a');
    const file = new Blob([report], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `relatorio-sessao-${sessionId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Função para imprimir o relatório
  const printReport = () => {
    if (!report) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Sessão</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { text-align: center; }
            .date { text-align: center; margin-bottom: 30px; color: #666; }
            .content { white-space: pre-line; line-height: 1.5; text-align: justify; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Sessão Terapêutica</h1>
          <div class="date">Gerado em: ${new Date().toLocaleDateString()}</div>
          <div class="content">${report}</div>
          <div class="footer">
            Este relatório foi gerado automaticamente pelo sistema de IA do TerapiaConnect.
            As informações contidas neste documento são confidenciais e destinadas apenas
            para uso profissional.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    // Aguardar um pouco para garantir que o conteúdo foi carregado antes de imprimir
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
          <Box className="print-content" p={2}>
            {/* Conteúdo do Relatório - Exibido diretamente sem formatação adicional */}
            <Typography 
              variant="body1" 
              component="div"
              style={{ 
                whiteSpace: 'pre-line', 
                lineHeight: 1.6,
                textAlign: 'justify'
              }}
            >
              {report}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<Download />}
          onClick={downloadReport}
          disabled={!report}
        >
          Baixar Texto
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

SessionReport.propTypes = {
  sessionId: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SessionReport; 