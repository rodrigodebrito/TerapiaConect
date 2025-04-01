import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Tabs, Tab, Button, 
  List, ListItem, ListItemText, IconButton, Divider, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  FormGroup, FormLabel, FormControlLabel, Radio, RadioGroup,
  Checkbox
} from '@mui/material';
import { Add, Edit, Delete, ViewList, Refresh, CloudUpload, HourglassEmpty, CheckCircle, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import training from '../services/training';
import { toast } from 'react-hot-toast';
import api, { uploadApi } from '../api/api';
import TranscriptionUploader from '../components/TranscriptionUploader';

// Constantes para tipos de material
const MATERIAL_TYPES = {
  ARTICLE: 'Artigo',
  VIDEO_YOUTUBE: 'Vídeo do YouTube',
  VIDEO_VIMEO: 'Vídeo do Vimeo',
  VIDEO_UPLOAD: 'Vídeo Enviado',
  VIDEO_TRANSCRIPTION: 'Transcrição de Vídeo',
  DOCUMENT_PDF: 'Documento PDF',
  DOCUMENT_TXT: 'Documento de Texto',
  DOCUMENT_DOCX: 'Documento Word',
  EXERCISE: 'Exercício',
  SUPERVISION: 'Supervisão',
  CASE_STUDY: 'Estudo de Caso',
  TECHNIQUE: 'Técnica',
  ASSESSMENT: 'Avaliação',
  WORKSHOP: 'Workshop'
};

// Constantes para categorias de material
const MATERIAL_CATEGORIES = {
  APPROACHES: {
    COGNITIVE: 'Terapia Cognitiva',
    BEHAVIORAL: 'Terapia Comportamental',
    PSYCHOANALYTIC: 'Psicanálise',
    HUMANISTIC: 'Humanista',
    INTEGRATIVE: 'Integrativa',
    CONSTELLATION: 'Constelação Familiar'
  },
  SPECIALTIES: {
    ANXIETY: 'Ansiedade',
    DEPRESSION: 'Depressão',
    TRAUMA: 'Trauma',
    RELATIONSHIPS: 'Relacionamentos',
    ADDICTION: 'Dependência',
    EATING: 'Alimentação',
    SLEEP: 'Sono',
    STRESS: 'Estresse'
  },
  POPULATIONS: {
    ADULTS: 'Adultos',
    CHILDREN: 'Crianças',
    ADOLESCENTS: 'Adolescentes',
    COUPLES: 'Casais',
    FAMILIES: 'Famílias',
    GROUPS: 'Grupos'
  },
  SKILLS: {
    ASSESSMENT: 'Avaliação',
    DIAGNOSIS: 'Diagnóstico',
    INTERVENTION: 'Intervenção',
    DOCUMENTATION: 'Documentação',
    ETHICS: 'Ética',
    RESEARCH: 'Pesquisa'
  }
};

// Componente do painel administrativo
const AdminDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openInsightsDialog, setOpenInsightsDialog] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState('APPROACHES');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'ARTICLE',
    categories: [],
    videoUrl: '',
    isVideoTranscription: false,
    documentFile: null,
    documentName: '',
    documentType: '',
    insights: ''
  });

  // Verificar se o usuário está logado como admin
  useEffect(() => {
    const checkAdminAuth = () => {
      if (!user || user.role !== 'ADMIN') {
        console.log('Usuário não é administrador, redirecionando...');
        navigate('/admin/login');
        return;
      }
      console.log('Usuário é administrador, carregando dashboard...');
      fetchMaterials();
    };
    
    checkAdminAuth();
  }, [user, navigate]);

  // Buscar materiais de treinamento
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const materials = await training.getAllMaterials();
      setMaterials(materials);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  // Manipular mudança de aba
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Abrir diálogo para adicionar/editar material
  const handleOpenDialog = (material = null) => {
    if (material) {
      setCurrentMaterial(material);
      setFormData({
        title: material.title,
        content: material.content,
        type: material.type,
        categories: material.categories,
        videoUrl: material.videoUrl,
        isVideoTranscription: material.isVideoTranscription || false,
        documentName: material.documentName || '',
        documentType: material.documentType || '',
        documentFile: null,
        insights: material.insights || ''
      });
      // Determinar o grupo da categoria
      for (const [group, categories] of Object.entries(MATERIAL_CATEGORIES)) {
        if (Object.values(categories).includes(material.category)) {
          setSelectedCategoryGroup(group);
          break;
        }
      }
    } else {
      setCurrentMaterial(null);
      setFormData({
        title: '',
        content: '',
        type: 'ARTICLE',
        categories: [],
        videoUrl: '',
        isVideoTranscription: false,
        documentFile: null,
        documentName: '',
        documentType: '',
        insights: ''
      });
      setSelectedCategoryGroup('APPROACHES');
    }
    
    setOpenDialog(true);
  };

  // Fechar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Manipular mudanças no formulário
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('category_')) {
      // Lógica para categorias múltiplas
      const categoryValue = name.replace('category_', '');
      setFormData(prev => {
        const newCategories = checked 
          ? [...prev.categories, categoryValue]
          : prev.categories.filter(cat => cat !== categoryValue);
        
        return {
          ...prev,
          categories: newCategories
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Manipular mudança de grupo de categoria
  const handleCategoryGroupChange = (event) => {
    setSelectedCategoryGroup(event.target.value);
    setFormData({
      ...formData,
      categories: []
    });
  };

  // Salvar material (adicionar ou atualizar)
  const handleSaveMaterial = async () => {
    setLoading(true);
    
    try {
      // Verificar se temos um arquivo para upload
      if (formData.documentFile) {
        // Criar um objeto FormData para enviar o arquivo
        const formDataWithFile = new FormData();
        formDataWithFile.append('title', formData.title);
        formDataWithFile.append('content', formData.content);
        formDataWithFile.append('type', formData.type);
        formData.categories.forEach(category => {
          formDataWithFile.append('categories[]', category);
        });
        formDataWithFile.append('videoUrl', formData.videoUrl || '');
        formDataWithFile.append('isVideoTranscription', formData.isVideoTranscription);
        formDataWithFile.append('document', formData.documentFile);
        
        // Endpoint diferente para upload de arquivos
        if (currentMaterial) {
          // Atualizar material existente
          await uploadApi.put(`/api/training/materials/${currentMaterial.id}/upload`, formDataWithFile);
        } else {
          // Adicionar novo material
          await uploadApi.post('/api/training/materials/upload', formDataWithFile);
        }
      } else {
        // Fluxo normal sem arquivos
        if (currentMaterial) {
          // Atualizar material existente
          await api.put(`/api/training/materials/${currentMaterial.id}`, formData);
        } else {
          // Adicionar novo material
          await api.post('/api/training/materials', formData);
        }
      }
      
      toast.success('Material salvo com sucesso!');
      fetchMaterials();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast.error('Erro ao salvar material. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Excluir material
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setLoading(true);
      await training.deleteMaterial(id);
      toast.success('Material excluído com sucesso!');
      fetchMaterials();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      toast.error('Erro ao excluir material');
    } finally {
      setLoading(false);
    }
  };

  // Processar material
  const handleProcessMaterial = async (id) => {
    setLoading(true);
    
    // Mostrar notificação de que o processamento pode demorar
    toast.loading('Processando documento. Isso pode levar alguns minutos para documentos grandes...', {
      duration: 5000,
      id: 'processing-toast'
    });
    
    try {
      const result = await training.processMaterial(id);
      
      // Fechar a notificação de carregamento
      toast.dismiss('processing-toast');
      
      // Verificar se o processamento foi iniciado em segundo plano
      if (result.background) {
        toast.success('Documento grande! O processamento foi iniciado em segundo plano e pode levar alguns minutos.');
        
        // Iniciar um intervalo para verificar o status periodicamente
        let checkCount = 0;
        const maxChecks = 10; // Verificar até 10 vezes
        
        const checkInterval = setInterval(async () => {
          try {
            checkCount++;
            const updatedMaterial = await training.getMaterialById(id);
            
            // Se o material já foi processado ou houve erro
            if (updatedMaterial.status === 'processed' || updatedMaterial.status === 'error') {
              clearInterval(checkInterval);
              
              if (updatedMaterial.status === 'processed') {
                toast.success('Processamento em segundo plano concluído!');
                
                // Atualizar lista e abrir diálogo de insights
                fetchMaterials();
                setCurrentMaterial(updatedMaterial);
                setOpenInsightsDialog(true);
              } else {
                toast.error('Houve um erro no processamento em segundo plano.');
              }
            }
            
            // Parar de verificar após o número máximo de tentativas
            if (checkCount >= maxChecks) {
              clearInterval(checkInterval);
              toast.info('O processamento continua em segundo plano. Verifique novamente mais tarde.');
            }
          } catch (error) {
            console.error('Erro ao verificar status do material:', error);
            clearInterval(checkInterval);
          }
        }, 30000); // Verificar a cada 30 segundos
        
        return;
      }
      
      // Para processamentos síncronos, continuar normalmente
      const updatedMaterial = await training.getMaterialById(id);
      
      // Exibir os insights em um diálogo
      if (updatedMaterial && updatedMaterial.insights) {
        // Atualizar a lista de materiais
        fetchMaterials();
        
        // Mostrar diálogo de insights
        setCurrentMaterial(updatedMaterial);
        setOpenInsightsDialog(true);
        
        toast.success('Material processado com sucesso!');
      } else {
        toast.success('Material processado, mas nenhum insight foi gerado.');
      }
    } catch (error) {
      console.error('Erro ao processar material:', error);
      
      // Fechar a notificação de carregamento
      toast.dismiss('processing-toast');
      
      // Verificar se é um erro de timeout
      if (error.code === 'ECONNABORTED') {
        toast.error('O processamento demorou muito tempo. Para documentos grandes, o processo continua em segundo plano. Tente ver os resultados em alguns minutos.');
      } else {
        toast.error('Erro ao processar material. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Visualizar insights sem reprocessar o material
  const handleViewInsights = async (id) => {
    try {
      setLoading(true);
      
      // Buscar o material usando o serviço correto
      const material = await training.getMaterialById(id);
      
      if (material && material.insights) {
        setCurrentMaterial(material);
        setOpenInsightsDialog(true);
        toast.success('Exibindo insights salvos');
      } else {
        toast.info('Este material ainda não possui insights. Tente processá-lo primeiro.');
      }
    } catch (error) {
      console.error('Erro ao buscar insights:', error);
      toast.error('Não foi possível recuperar os insights deste material.');
    } finally {
      setLoading(false);
    }
  };

  // Fechar diálogo de insights
  const handleCloseInsightsDialog = () => {
    setOpenInsightsDialog(false);
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Handler para quando a transcrição for concluída
  const handleTranscriptionCompleted = (materialId) => {
    // Atualizar a lista de materiais
    fetchMaterials();
    toast.success('Material de transcrição adicionado com sucesso!');
  };

  // Se não for administrador, não renderizar nada
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Painel Administrativo
          </Typography>
          
          <Box>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={fetchMaterials} 
              startIcon={<Refresh />}
              sx={{ mr: 2 }}
            >
              Atualizar
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleLogout}
            >
              Sair
            </Button>
          </Box>
        </Box>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Materiais de Treinamento" />
            <Tab label="Transcrições" />
          </Tabs>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!loading && tabIndex === 0 && (
              <Paper>
                <Box p={2}>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Add />}
                      onClick={() => handleOpenDialog()}
                    >
                      Novo Material
                    </Button>
                  </Box>

                  <List>
                    {materials.map((material) => (
                      <React.Fragment key={material.id}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <IconButton
                                edge="end"
                                aria-label="ver insights"
                                onClick={() => handleViewInsights(material.id)}
                                sx={{ mr: 1 }}
                                title="Ver insights"
                              >
                                <ViewList color={material.insights ? "primary" : "disabled"} />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="processar"
                                onClick={() => handleProcessMaterial(material.id)}
                                sx={{ mr: 1 }}
                                title="Processar com IA"
                                disabled={material.status === 'processing'}
                              >
                                {material.status === 'processing' ? <HourglassEmpty /> : <CloudUpload />}
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="editar"
                                onClick={() => handleOpenDialog(material)}
                                sx={{ mr: 1 }}
                                title="Editar"
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="excluir"
                                onClick={() => handleDeleteMaterial(material.id)}
                                title="Excluir"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                {material.title}
                                {material.status === 'processing' && (
                                  <CircularProgress size={16} sx={{ ml: 1 }} />
                                )}
                                {material.status === 'error' && (
                                  <Error color="error" sx={{ ml: 1 }} fontSize="small" />
                                )}
                                {material.status === 'processed' && material.insights && (
                                  <CheckCircle color="success" sx={{ ml: 1 }} fontSize="small" />
                                )}
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  Tipo: {MATERIAL_TYPES[material.type] || material.type} | Categorias: {material.categories.join(', ')}
                                </Typography>
                                {material.status === 'error' && (
                                  <Typography variant="body2" color="error" component="div">
                                    Erro no processamento. Tente novamente.
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              </Paper>
            )}
            
            {!loading && tabIndex === 1 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  Transcrição de Áudio/Vídeo
                </Typography>
                <Typography variant="body1" paragraph>
                  Faça upload de arquivos de áudio ou vídeo para transcrevê-los usando IA.
                  Os arquivos transcritos serão adicionados à sua biblioteca de materiais de treinamento.
                </Typography>
                
                <TranscriptionUploader onCompleted={handleTranscriptionCompleted} />
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* Diálogo para adicionar/editar material */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentMaterial && formData.insights ? 'Insights do Material' : (currentMaterial ? 'Editar Material' : 'Novo Material')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Se temos insights e viemos do botão de ver insights, mostrar os insights em destaque */}
            {currentMaterial && formData.insights && (
              <Box sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Insights Gerados pela IA
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {formData.insights}
                </Typography>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Título"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Conteúdo"
              name="content"
              value={formData.content}
              onChange={handleFormChange}
              margin="normal"
              multiline
              rows={6}
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                label="Tipo"
              >
                {Object.entries(MATERIAL_TYPES).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Campos específicos para vídeo */}
            {(formData.type === 'VIDEO_YOUTUBE' || formData.type === 'VIDEO_VIMEO') && (
              <TextField
                fullWidth
                label="URL do Vídeo"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleFormChange}
                margin="normal"
                required
                helperText={formData.type === 'VIDEO_YOUTUBE' ? 'Cole o link do YouTube' : 'Cole o link do Vimeo'}
              />
            )}

            {formData.type === 'VIDEO_TRANSCRIPTION' && (
              <>
                <TextField
                  fullWidth
                  label="URL do Vídeo Original"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleFormChange}
                  margin="normal"
                  required
                  helperText="Cole o link do vídeo original"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isVideoTranscription}
                      onChange={handleFormChange}
                      name="isVideoTranscription"
                    />
                  }
                  label="Este conteúdo é uma transcrição do vídeo"
                />
              </>
            )}

            {formData.type === 'VIDEO_UPLOAD' && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Instruções para upload de vídeo:
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  1. O vídeo deve ter no máximo 500MB
                  2. Formatos aceitos: MP4, MOV, AVI
                  3. Resolução recomendada: 720p ou superior
                  4. Duração máxima: 30 minutos
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Selecionar Vídeo
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Aqui você pode adicionar a lógica para upload do vídeo
                        console.log('Vídeo selecionado:', file);
                      }
                    }}
                  />
                </Button>
              </Box>
            )}
            
            {/* Novo componente para upload de documentos */}
            {(formData.type === 'DOCUMENT_PDF' || formData.type === 'DOCUMENT_TXT' || formData.type === 'DOCUMENT_DOCX') && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Instruções para upload de documento:
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  1. O documento deve ter no máximo 20MB
                  2. Formatos aceitos: {formData.type === 'DOCUMENT_PDF' ? 'PDF' : formData.type === 'DOCUMENT_TXT' ? 'TXT' : 'DOCX, DOC'}
                  3. Se o documento for muito grande, considere dividi-lo em partes menores
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Selecionar Documento
                  <input
                    type="file"
                    hidden
                    accept={
                      formData.type === 'DOCUMENT_PDF' 
                        ? 'application/pdf' 
                        : formData.type === 'DOCUMENT_TXT' 
                          ? 'text/plain' 
                          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword'
                    }
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Transformar o arquivo em uma string base64 para inclusão no formData
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            documentFile: file,
                            documentName: file.name,
                            documentType: file.type,
                            // Se o arquivo for texto, usamos o resultado diretamente como conteúdo
                            // Caso contrário, o conteúdo será extraído no backend
                            content: formData.type === 'DOCUMENT_TXT' ? reader.result : 'Este conteúdo será extraído do documento enviado.'
                          });
                        };
                        
                        if (formData.type === 'DOCUMENT_TXT') {
                          reader.readAsText(file);
                        } else {
                          reader.readAsDataURL(file);
                        }
                        
                        console.log('Documento selecionado:', file.name);
                      }
                    }}
                  />
                </Button>
                {formData.documentName && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    Documento selecionado: {formData.documentName}
                  </Typography>
                )}
              </Box>
            )}
            
            <FormControl component="fieldset" margin="normal">
              <FormLabel>Grupo de Categoria</FormLabel>
              <RadioGroup
                row
                value={selectedCategoryGroup}
                onChange={handleCategoryGroupChange}
                sx={{ mb: 2 }}
              >
                {Object.entries(MATERIAL_CATEGORIES).map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio />}
                    label={key.replace(/_/g, ' ')}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Categorias
              </Typography>
              
              {Object.entries(MATERIAL_CATEGORIES).map(([group, categories]) => (
                <Box key={group} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {group.replace(/_/g, ' ')}
                  </Typography>
                  <FormGroup>
                    {Object.entries(categories).map(([key, label]) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Checkbox
                            checked={formData.categories.includes(label)}
                            onChange={handleFormChange}
                            name={`category_${label}`}
                            color="primary"
                          />
                        }
                        label={label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveMaterial} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para exibir insights */}
      <Dialog open={openInsightsDialog} onClose={handleCloseInsightsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Insights do Material: {currentMaterial?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {currentMaterial?.insights ? (
              <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Insights Gerados pela IA
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {currentMaterial.insights}
                </Typography>
                
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #ccc' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Informações do Material:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tipo:</strong> {MATERIAL_TYPES[currentMaterial.type] || currentMaterial.type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Categorias:</strong> {currentMaterial.categories.join(', ')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {currentMaterial.status}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography>Não há insights disponíveis para este material.</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInsightsDialog}>Fechar</Button>
          <Button 
            onClick={() => {
              handleCloseInsightsDialog();
              handleOpenDialog(currentMaterial);
            }} 
            color="primary"
          >
            Editar Material
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 