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
  IconButton,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import { Close, Download, Print, Refresh } from '@mui/icons-material';
import aiService from '../../services/aiService';
import ReactMarkdown from 'react-markdown';

/**
 * Componente que exibe o relatório da sessão
 */
const SessionReport = ({ sessionId, open, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPartialReport, setIsPartialReport] = useState(false);
  const [rawResponse, setRawResponse] = useState(null);

  // Função para gerar o relatório
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsPartialReport(false);
      setRawResponse(null);
      console.log('SessionReport: Gerando relatório para sessão', sessionId);
      
      const response = await aiService.generateReport(sessionId);
      console.log('SessionReport: Resposta completa do aiService:', JSON.stringify(response));
      
      // Salvar a resposta bruta para debugging
      setRawResponse(response);
      
      if (response && response.error) {
        console.error('SessionReport: Erro recebido:', response.error);
        setError(response.error);
        return;
      }
      
      // Extrair o texto do relatório da resposta
      let reportText = null;
      
      // Verificar todos os formatos possíveis da resposta
      if (typeof response === 'string') {
        reportText = response;
        console.log('SessionReport: Resposta é uma string direta');
      } else if (response && response.report) {
        reportText = response.report;
        console.log('SessionReport: Usando campo report da resposta');
      } else if (response && response.content) {
        reportText = response.content;
        console.log('SessionReport: Usando campo content da resposta');
      } else if (response && response.data && response.data.report) {
        reportText = response.data.report;
        console.log('SessionReport: Usando data.report da resposta');
      } else if (response && response.data && response.data.content) {
        reportText = response.data.content;
        console.log('SessionReport: Usando data.content da resposta');
      } else if (response && response.text) {
        reportText = response.text;
        console.log('SessionReport: Usando campo text da resposta');
      } else if (response && response.reportText) {
        reportText = response.reportText;
        console.log('SessionReport: Usando campo reportText da resposta');
      } else if (response && typeof response === 'object') {
        // Verificamos todas as propriedades do objeto em busca de strings longas
        console.log('SessionReport: Verificando todas as propriedades do objeto');
        const allProps = [];
        for (const key in response) {
          if (typeof response[key] === 'string') {
            allProps.push({ key, length: response[key].length, preview: response[key].substring(0, 50) });
            if (response[key].length > 100) {
              reportText = response[key];
              console.log(`SessionReport: Usando campo ${key} da resposta que tem ${response[key].length} caracteres`);
              break;
            }
          } else if (response[key] && typeof response[key] === 'object') {
            console.log(`SessionReport: Verificando objeto aninhado ${key}`);
            for (const subKey in response[key]) {
              if (typeof response[key][subKey] === 'string') {
                allProps.push({ key: `${key}.${subKey}`, length: response[key][subKey].length, preview: response[key][subKey].substring(0, 50) });
                if (response[key][subKey].length > 100) {
                  reportText = response[key][subKey];
                  console.log(`SessionReport: Usando campo ${key}.${subKey} da resposta que tem ${response[key][subKey].length} caracteres`);
                  break;
                }
              }
            }
          }
        }
        console.log('SessionReport: Propriedades encontradas:', allProps);
      }
      
      console.log('SessionReport: Texto do relatório extraído:', reportText?.substring(0, 100));
      
      // Verificar se o relatório é um fallback genérico
      const isGenericFallback = 
        !reportText || 
        reportText.trim().length < 100 || 
        reportText.includes('Não foi possível gerar conteúdo específico') ||
        reportText.includes('insuficientes na transcrição atual') ||
        (reportText.includes('Sugestões gerais') && reportText.length < 500);
      
      if (isGenericFallback) {
        console.warn('SessionReport: Detectado relatório parcial ou genérico');
        setIsPartialReport(true);
      }
      
      // Se não temos um relatório válido mesmo após todas as tentativas
      if (!reportText) {
        console.error('SessionReport: Não foi possível extrair um relatório da resposta');
        setError('Não foi possível extrair um relatório da resposta do servidor.');
        setReport("Não foi possível gerar um relatório para esta sessão. A transcrição pode ser insuficiente ou ocorreu um erro no processamento.");
        return;
      }
      
      console.log('SessionReport: Relatório final tem', reportText.length, 'caracteres');
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
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 14px; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 10px; }
            h2 { margin-top: 20px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 16px; }
            .date { text-align: center; margin-bottom: 30px; color: #666; }
            .content { line-height: 1.6; text-align: justify; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            .warning { background-color: #fff8e1; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Relatório de Sessão Terapêutica</h1>
          <div class="date">Gerado em: ${new Date().toLocaleDateString()}</div>
          ${isPartialReport ? `<div class="warning">Nota: Este relatório contém informações parciais ou limitadas devido a dados insuficientes da sessão.</div>` : ''}
          <div class="content">${report.replace(/\n/g, '<br>').replace(/#{1,2} (.*?)($|\n)/g, '<h2>$1</h2>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
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

  // Converter texto simples para renderizar corretamente
  const formatForDisplay = (text) => {
    if (!text) return '';
    // Verificar se o texto já parece estar em formato markdown
    if (text.includes('#') || text.includes('**')) {
      return text;
    }
    
    // Se parece ser texto simples, tentar identificar títulos e seções
    return text
      .replace(/^(.*?):$/gm, '## $1') // Converter linhas que terminam com : para títulos
      .replace(/^([A-Z][A-Za-z\s]+)$/gm, '## $1'); // Converter linhas com palavras capitalizadas para títulos
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
        }
      }}
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
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Gerando relatório da sessão...
            </Typography>
          </Box>
        ) : error ? (
          <Box p={4}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="outlined"
                color="primary"
                onClick={generateReport}
                startIcon={<Refresh />}
              >
                Tentar Novamente
              </Button>
            </Box>
            
            {/* Mostrar informações de debug quando há erro */}
            {rawResponse && (
              <Box mt={4} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Informações para diagnóstico:
                </Typography>
                <Box 
                  component="pre" 
                  sx={{ 
                    mt: 1, 
                    fontSize: '10px', 
                    overflowX: 'auto', 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  {JSON.stringify(rawResponse, null, 2)}
                </Box>
              </Box>
            )}
          </Box>
        ) : report ? (
          <Box className="print-content" p={2}>
            {isPartialReport && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">Relatório Parcial</Typography>
                <Typography variant="body2">
                  Este relatório contém informações limitadas devido a dados insuficientes da sessão.
                  Para relatórios mais detalhados, é recomendável ter sessões mais longas com mais diálogo.
                </Typography>
              </Alert>
            )}
            
            <Paper elevation={0} sx={{ p: 2, backgroundColor: 'background.paper' }}>
              {/* Tenta usar ReactMarkdown, mas com fallback para renderização simples */}
              {report.includes('#') || report.includes('**') ? (
                <ReactMarkdown
                  components={{
                    h1: (props) => <Typography variant="h4" {...props} gutterBottom />,
                    h2: (props) => <Typography variant="h5" {...props} gutterBottom sx={{ mt: 3, mb: 1, color: 'primary.main' }} />,
                    p: (props) => <Typography variant="body1" {...props} paragraph sx={{ textAlign: 'justify' }} />,
                    strong: (props) => <strong {...props} style={{ color: 'inherit' }} />,
                    ul: (props) => <ul {...props} style={{ marginBottom: '16px' }} />,
                    li: (props) => <li {...props} style={{ marginBottom: '4px' }} />,
                  }}
                >
                  {formatForDisplay(report)}
                </ReactMarkdown>
              ) : (
                // Fallback para texto sem formatação Markdown
                <Typography 
                  variant="body1" 
                  component="div" 
                  sx={{ whiteSpace: 'pre-line', textAlign: 'justify', lineHeight: 1.6 }}
                >
                  {report}
                </Typography>
              )}
            </Paper>
            
            {/* Informações de diagnóstico sempre mostradas durante o desenvolvimento */}
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                Informações para diagnóstico (desenvolvimento):
              </Typography>
              <Typography variant="caption" component="div" sx={{ mt: 1, fontSize: '11px', color: 'text.secondary' }}>
                Relatório tamanho: {report?.length || 0} caracteres<br />
                Resposta tipo: {typeof rawResponse === 'string' ? 'string' : (typeof rawResponse === 'object' ? 'objeto' : typeof rawResponse)}<br />
                Campos na resposta: {typeof rawResponse === 'object' ? Object.keys(rawResponse).join(', ') : 'N/A'}
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  mt: 1, 
                  fontSize: '10px', 
                  overflowX: 'auto', 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: '#f5f5f5',
                  p: 1,
                  borderRadius: 1
                }}
              >
                {JSON.stringify(rawResponse, null, 2)}
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        {report && !loading && (
          <>
            <Button 
              onClick={generateReport} 
              startIcon={<Refresh />}
              color="inherit"
            >
              Gerar Novo
            </Button>
            <Button
              onClick={downloadReport}
              startIcon={<Download />}
              color="primary"
            >
              Baixar
            </Button>
            <Button
              onClick={printReport}
              startIcon={<Print />}
              color="primary"
            >
              Imprimir
            </Button>
          </>
        )}
        <Button onClick={onClose} color="inherit">
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