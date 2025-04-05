import React, { useState } from 'react';
import { Button, Card, Alert, Spinner, Row, Col, Badge, Tabs, Tab, Accordion } from 'react-bootstrap';
import aiService from '../../services/aiService';
import { toast } from 'react-toastify';
import './SessionAnalysis.css';

const SessionAnalysis = ({ sessionId, transcript, onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Função para executar análise, com opção para análise avançada
  const performAnalysis = async (useAdvanced = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiService.analyzeSession(sessionId, transcript, useAdvanced);
      
      if (result.type === 'analysis') {
        setAnalysis(result);
        
        // Notificar o componente pai sobre a análise completa
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
        
        toast.success('Análise concluída com sucesso');
      } else {
        throw new Error('Formato de resposta inesperado');
      }
    } catch (err) {
      console.error('Erro ao analisar sessão:', err);
      setError(err.message || 'Falha ao gerar análise da sessão');
      toast.error('Não foi possível analisar a sessão');
    } finally {
      setLoading(false);
    }
  };

  // Renderização de temas no formato de badges coloridas
  const renderThemeBadges = (themes) => {
    if (!themes || !Array.isArray(themes)) return null;
    
    const colors = ['primary', 'success', 'danger', 'warning', 'info'];
    
    return (
      <div className="theme-badges mb-3">
        {themes.map((theme, index) => (
          <Badge 
            key={index} 
            bg={colors[index % colors.length]} 
            className="me-2 mb-2 p-2"
          >
            {theme.theme}
            {theme.relevance && <span className="ms-1">({theme.relevance})</span>}
          </Badge>
        ))}
      </div>
    );
  };

  // Componente para renderizar materiais referenciados
  const ReferencedMaterials = ({ materials }) => {
    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return <p>Nenhum material relevante encontrado.</p>;
    }
    
    return (
      <div className="referenced-materials">
        <h5>Materiais relacionados</h5>
        {materials.map((material, index) => (
          <Card key={index} className="mb-2 material-card">
            <Card.Body>
              <Card.Title>{material.title}</Card.Title>
              {material.insights && (
                <Card.Text className="text-muted small">
                  {material.insights.substring(0, 200)}...
                </Card.Text>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
    );
  };

  // Componente para renderizar análise avançada
  const AdvancedAnalysisView = ({ data }) => {
    if (!data || !data.structuredAnalysis) {
      return <Alert variant="info">Nenhuma análise avançada disponível.</Alert>;
    }
    
    const { structuredAnalysis } = data;
    
    return (
      <div className="advanced-analysis">
        <div className="mb-4">
          <h5>Visão Geral</h5>
          <div className="analysis-text">{structuredAnalysis.overview}</div>
        </div>
        
        {renderThemeBadges(structuredAnalysis.thematicAnalysis)}
        
        <Accordion defaultActiveKey="0" className="mb-4">
          <h5>Análise Temática Detalhada</h5>
          {structuredAnalysis.thematicAnalysis.map((theme, index) => (
            <Accordion.Item eventKey={String(index)} key={index}>
              <Accordion.Header>
                <strong>{theme.theme}</strong>
                <span className="ms-2 text-muted">
                  (Relevância: {theme.relevance}/10)
                </span>
              </Accordion.Header>
              <Accordion.Body>
                <p>
                  <strong>Subtemas:</strong>{" "}
                  {theme.subthemes?.join(', ') || 'Nenhum subtema identificado'}
                </p>
                <p>
                  <strong>Emoções associadas:</strong>{" "}
                  {theme.emotions?.join(', ') || 'Nenhuma emoção identificada'}
                </p>
                <div className="theme-analysis-content">
                  {theme.detailedAnalysis}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
        
        <ReferencedMaterials materials={structuredAnalysis.referencedMaterials} />
      </div>
    );
  };

  // Renderização básica ou avançada baseada na resposta
  const renderAnalysisContent = () => {
    if (!analysis) return null;
    
    const isAdvancedAnalysis = analysis.data?.structuredAnalysis;
    
    return (
      <div className="analysis-container">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="basic" title="Análise Básica">
            <div className="basic-analysis analysis-text">
              {analysis.analysis.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            {analysis.data?.referencedMaterials && (
              <ReferencedMaterials materials={analysis.data.referencedMaterials} />
            )}
          </Tab>
          
          {isAdvancedAnalysis && (
            <Tab eventKey="advanced" title="Análise Avançada">
              <AdvancedAnalysisView data={analysis.data} />
            </Tab>
          )}
        </Tabs>
      </div>
    );
  };

  return (
    <div className="session-analysis mb-4">
      {!analysis && !loading && (
        <Card className="analysis-options mb-3">
          <Card.Body>
            <Card.Title>Analisar Sessão</Card.Title>
            <Card.Text>
              Escolha o tipo de análise a ser realizada para esta sessão:
            </Card.Text>
            <Row>
              <Col md={6} className="mb-2">
                <Button 
                  variant="primary" 
                  className="w-100"
                  onClick={() => performAnalysis(false)}
                  disabled={loading}
                >
                  Análise Básica
                  <div className="small text-light">
                    Análise rápida da sessão
                  </div>
                </Button>
              </Col>
              <Col md={6}>
                <Button 
                  variant="success" 
                  className="w-100"
                  onClick={() => performAnalysis(true)}
                  disabled={loading}
                >
                  Análise Avançada
                  <div className="small text-light">
                    Análise detalhada com temas e recomendações
                  </div>
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {loading && (
        <div className="text-center p-4">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-2">
            Gerando análise da sessão. Por favor, aguarde...
          </p>
        </div>
      )}
      
      {error && (
        <Alert variant="danger">
          <Alert.Heading>Erro ao analisar sessão</Alert.Heading>
          <p>{error}</p>
          <Button 
            variant="outline-danger" 
            onClick={() => setError(null)}
          >
            Tentar Novamente
          </Button>
        </Alert>
      )}
      
      {analysis && !loading && renderAnalysisContent()}
    </div>
  );
};

export default SessionAnalysis; 