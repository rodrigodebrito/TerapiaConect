import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getClientByUserId, updateClientProfile, createClientProfile, uploadProfilePicture } from '../services/clientService';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ClientProfile.css';
import api from '../services/api';

// Função global para recuperar e aplicar o token
const refreshToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
};

const ClientProfile = () => {
  const navigate = useNavigate();
  const { user, setAuthToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
    aspect: 1
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    profilePicture: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const previewCanvasRef = useRef(null);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }

    // Inicializar com dados básicos do usuário
    setProfile(prev => ({
      ...prev,
      name: user.name || '',
      email: user.email || ''
    }));

    const fetchProfile = async () => {
      try {
        setLoading(true);
        console.log('Buscando perfil para userId:', user.id);
        const clientData = await getClientByUserId(user.id);
        
        if (clientData) {
          // Verificar se a resposta é HTML (erro)
          if (typeof clientData === 'string' && clientData.includes('<!doctype html>')) {
            console.error('Resposta inválida da API:', clientData);
            throw new Error('Resposta inválida da API');
          }
          
          console.log('Perfil encontrado:', clientData);
          setProfile({
            name: clientData.name || user.name || '',
            email: clientData.email || user.email || '',
            phone: clientData.phone || '',
            birthDate: formatDateForInput(clientData.birthDate) || '',
            gender: clientData.gender || '',
            street: clientData.street || '',
            number: clientData.number || '',
            complement: clientData.complement || '',
            neighborhood: clientData.neighborhood || '',
            city: clientData.city || '',
            state: clientData.state || '',
            zipCode: clientData.zipCode || '',
            profilePicture: clientData.profilePicture || ''
          });
        } else {
          console.log('Perfil não encontrado, usando dados básicos do usuário');
          setProfile(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || ''
          }));
        }
        setError('');
      } catch (err) {
        console.error('Erro detalhado ao buscar perfil:', err);
        if (err.response?.status !== 404) {
          setError('Não foi possível carregar seu perfil. Por favor, tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  // Atualizar o token no componente
  useEffect(() => {
    refreshToken();
  }, []);

  const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a formatação
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      // Limita a 11 dígitos (2 DDD + 9 número)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const searchCEP = async (cep) => {
    try {
      const cleanCEP = cep.replace(/\D/g, '');
      if (cleanCEP.length === 8) {
        setLoading(true);
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setProfile(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          setValidationErrors(prev => ({
            ...prev,
            zipCode: null
          }));
        } else {
          setValidationErrors(prev => ({
            ...prev,
            zipCode: 'CEP não encontrado'
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setValidationErrors(prev => ({
        ...prev,
        zipCode: 'Erro ao buscar CEP'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      setProfile(prev => ({
        ...prev,
        [name]: formatPhone(value)
      }));
    } else if (name === 'zipCode') {
      const formattedCEP = value.replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substr(0, 9);
      
      setProfile(prev => ({
        ...prev,
        [name]: formattedCEP
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Verificar o tamanho do arquivo (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('O arquivo é muito grande. Tamanho máximo: 10MB');
        }
        
        // Verificar se é uma imagem
        if (!file.type.startsWith('image/')) {
          throw new Error('Por favor, selecione um arquivo de imagem válido.');
        }

        // Criar URL para preview da imagem
        const imageUrl = URL.createObjectURL(file);
        setImageSource(imageUrl);
        setShowCropModal(true);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        setError(error.message || 'Erro ao processar imagem. Por favor, tente novamente.');
      }
    }
  };

  const getCroppedImg = async (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          blob.name = 'cropped.jpeg';
          resolve(blob);
        },
        'image/jpeg',
        1
      );
    });
  };

  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // O backend está rodando na porta 3000
    const baseUrl = window.location.origin.replace('3001', '3000');
    
    // Garantir que o caminho comece com /
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${formattedPath}`;
  };

  const handleCropComplete = async () => {
    try {
      if (!imgRef.current || !completedCrop) {
        console.error('Referência da imagem ou crop não encontrados');
        return;
      }

      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Falha ao criar blob da imagem');
          setError('Falha ao processar a imagem.');
          return;
        }

        try {
          // Criar FormData com a imagem
          const formData = new FormData();
          formData.append('profilePicture', blob, 'profile.jpg');

          console.log('Enviando imagem para o servidor...');
          const response = await uploadProfilePicture(user.id, formData);
          console.log('Resposta do servidor:', response);

          if (response && response.url) {
            // Criar um novo objeto Image para forçar o carregamento da nova imagem
            const newImage = new Image();
            const timestamp = new Date().getTime();
            newImage.src = `${response.url}?t=${timestamp}`;
            
            newImage.onload = () => {
              console.log('Nova imagem carregada com sucesso');
              // Atualizar o estado do perfil com a nova URL
              setProfile(prev => ({
                ...prev,
                profilePicture: response.url
              }));
            };

            toast.success('Foto de perfil atualizada com sucesso!');
          }
        } catch (error) {
          console.error('Erro ao fazer upload da imagem:', error);
          setError('Erro ao fazer upload da imagem. Por favor, tente novamente.');
          toast.error('Erro ao atualizar foto de perfil');
        }

        // Limpar e fechar o modal
        setShowCropModal(false);
        setImageSource(null);
        setError('');

      }, 'image/jpeg', 0.95);

    } catch (error) {
      console.error('Erro ao recortar imagem:', error);
      setError('Ocorreu um erro ao processar a imagem.');
      toast.error('Erro ao processar imagem');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validar telefone
    const phoneNumbers = profile.phone.replace(/\D/g, '');
    if (phoneNumbers.length > 0 && phoneNumbers.length !== 11) {
      errors.phone = 'Telefone deve ter 11 dígitos (DDD + 9 dígitos)';
    }

    // Validar data de nascimento
    if (!profile.birthDate) {
      errors.birthDate = 'Data de nascimento é obrigatória';
    } else {
      const birthDate = new Date(profile.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        errors.birthDate = 'Você deve ter pelo menos 18 anos';
      } else if (age > 100) {
        errors.birthDate = 'Data de nascimento inválida';
      }
    }
    
    // Validar campos obrigatórios do endereço
    if (!profile.street?.trim()) {
      errors.street = 'Rua/Avenida é obrigatório';
    }
    if (!profile.number?.trim()) {
      errors.number = 'Número é obrigatório';
    }
    if (!profile.neighborhood?.trim()) {
      errors.neighborhood = 'Bairro é obrigatório';
    }
    if (!profile.city?.trim()) {
      errors.city = 'Cidade é obrigatório';
    }
    if (!profile.state?.trim()) {
      errors.state = 'Estado é obrigatório';
    }
    if (!profile.zipCode?.trim()) {
      errors.zipCode = 'CEP é obrigatório';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Validar formulário antes de enviar
    if (!validateForm()) {
      setError('Por favor, preencha todos os campos obrigatórios do endereço.');
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        ...profile,
        userId: user.id
      };
      console.log('Enviando dados do perfil:', profileData);
      
      const updatedProfile = await createClientProfile(profileData);
      
      if (typeof updatedProfile === 'string' && updatedProfile.includes('<!doctype html>')) {
        console.error('Resposta inválida da API:', updatedProfile);
        throw new Error('Resposta inválida da API');
      }
      
      console.log('Perfil atualizado com sucesso:', updatedProfile);
      setIsEditing(false);
      setError('');
      
      if (updatedProfile) {
        setProfile(prev => ({
          ...prev,
          ...updatedProfile,
          email: user.email,
          name: updatedProfile.name || user.name
        }));
      }
    } catch (err) {
      console.error('Erro detalhado ao atualizar perfil:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      setError('Erro ao atualizar perfil. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar crop centralizado quando imagem carregar
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height) * 0.8;
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;

    const newCrop = {
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: x,
      y: y,
      aspect: 1
    };

    setCrop(newCrop);
    setCompletedCrop(newCrop);
    imgRef.current = e.currentTarget;
  };

  // Função para desenhar o recorte na tela
  const updatePreview = useCallback(() => {
    if (!imgRef.current || !completedCrop?.width || !completedCrop?.height || !previewCanvasRef.current) {
      return;
    }
    
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return;
    }
    
    // Definir o tamanho do canvas
    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    
    // Escalar e ajustar qualidade
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar recorte
    ctx.drawImage(
      image,
      crop.x * scaleX, 
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  }, [completedCrop]);

  // Atualizar preview quando completedCrop mudar
  useEffect(() => {
    updatePreview();
  }, [completedCrop, updatePreview]);

  // Adicionar este useEffect após os outros useEffects
  useEffect(() => {
    if (profile.profilePicture) {
      // Forçar a atualização da imagem quando o profile mudar
      const img = document.querySelector('.profile-picture');
      if (img) {
        const timestamp = Date.now();
        const url = getFullImageUrl(profile.profilePicture) + `?t=${timestamp}`;
        console.log('Atualizando imagem do perfil para:', url);
        img.src = url;
      }
    }
  }, [profile.profilePicture]);

  if (loading) {
    return <div className="loading">Carregando perfil...</div>;
  }

  return (
    <div className="client-profile-container">
      <div className="profile-header">
        <h1>Meu Perfil</h1>
        {!isEditing && (
          <button 
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            Editar Perfil
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCropModal && (
        <div className="crop-modal">
          <div className="crop-modal-content">
            <h3>Recortar Imagem</h3>
            
            <div className="crop-container">
              {imageSource && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => {
                    // Garantir que os valores são números válidos
                    const validCrop = {
                      ...c,
                      width: Number.isFinite(c.width) ? c.width : 90,
                      height: Number.isFinite(c.height) ? c.height : 90,
                      x: Number.isFinite(c.x) ? c.x : 5,
                      y: Number.isFinite(c.y) ? c.y : 5,
                      aspect: 1
                    };
                    setCrop(validCrop);
                  }}
                  onComplete={(c) => {
                    // Garantir que os valores são números válidos
                    const validCompletedCrop = {
                      ...c,
                      width: Number.isFinite(c.width) ? c.width : 90,
                      height: Number.isFinite(c.height) ? c.height : 90,
                      x: Number.isFinite(c.x) ? c.x : 5,
                      y: Number.isFinite(c.y) ? c.y : 5,
                      aspect: 1
                    };
                    setCompletedCrop(validCompletedCrop);
                  }}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Imagem para recorte"
                    src={imageSource}
                    style={{ maxHeight: '70vh', maxWidth: '100%' }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </div>
            
            <div className="crop-instructions">
              <p>Arraste para posicionar e redimensione para enquadrar sua foto</p>
            </div>
            
            {/* Preview do recorte */}
            <div className="crop-preview">
              <h4>Prévia</h4>
              <canvas
                ref={previewCanvasRef}
                style={{
                  width: completedCrop?.width ?? 0,
                  height: completedCrop?.height ?? 0,
                  borderRadius: '50%',
                  objectFit: 'contain',
                  display: completedCrop ? 'block' : 'none',
                  maxWidth: '120px',
                  maxHeight: '120px'
                }}
              />
            </div>
            
            <div className="crop-actions">
              <button 
                type="button" 
                onClick={() => {
                  setShowCropModal(false);
                  setImageSource(null);
                }} 
                className="cancel-crop-button"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleCropComplete}
                className="save-crop-button"
                disabled={!completedCrop?.width || !completedCrop?.height}
              >
                {loading ? 'Salvando...' : 'Aplicar Recorte'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-picture-section">
          <div 
            className="profile-picture-container"
            onClick={handleImageClick}
          >
            {profile.profilePicture ? (
              <img 
                src={`${getFullImageUrl(profile.profilePicture)}?t=${Date.now()}`}
                alt="Foto de perfil" 
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                <span>{profile.name?.charAt(0) || user?.name?.charAt(0) || '?'}</span>
              </div>
            )}
            {isEditing && (
              <div className="profile-picture-overlay">
                <i className="fas fa-camera"></i>
                <span>Alterar foto</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
            disabled={!isEditing}
          />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div 
                className="upload-progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="name">Nome Completo</label>
          <input
            type="text"
            id="name"
            name="name"
            value={profile.name}
            onChange={handleChange}
            disabled={!isEditing}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={profile.email}
            disabled
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Telefone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="(00) 00000-0000"
            className={validationErrors.phone ? 'error' : ''}
            maxLength={15}
          />
          {validationErrors.phone && (
            <span className="error-text">{validationErrors.phone}</span>
          )}
          <span className="input-hint">Formato: (00) 90000-0000</span>
        </div>

        <div className="form-group">
          <label htmlFor="birthDate">Data de Nascimento *</label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={profile.birthDate}
            onChange={handleChange}
            disabled={!isEditing}
            required
            className={validationErrors.birthDate ? 'error' : ''}
          />
          {validationErrors.birthDate && (
            <span className="error-text">{validationErrors.birthDate}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gênero</label>
          <select
            id="gender"
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            disabled={!isEditing}
          >
            <option value="">Selecione...</option>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Feminino</option>
            <option value="OTHER">Outro</option>
            <option value="PREFER_NOT_TO_SAY">Prefiro não informar</option>
          </select>
        </div>

        <div className="address-section">
          <h3>Endereço</h3>
          <p className="required-fields-note">* Campos obrigatórios</p>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zipCode">CEP *</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={profile.zipCode}
                onChange={handleChange}
                onBlur={(e) => searchCEP(e.target.value)}
                disabled={!isEditing}
                placeholder="00000-000"
                className={validationErrors.zipCode ? 'error' : ''}
                maxLength={9}
              />
              {validationErrors.zipCode && (
                <span className="error-text">{validationErrors.zipCode}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-grow">
              <label htmlFor="street">Rua/Avenida *</label>
              <input
                type="text"
                id="street"
                name="street"
                value={profile.street}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nome da rua ou avenida"
                className={validationErrors.street ? 'error' : ''}
              />
              {validationErrors.street && (
                <span className="error-text">{validationErrors.street}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="number">Número *</label>
              <input
                type="text"
                id="number"
                name="number"
                value={profile.number}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Nº"
                className={validationErrors.number ? 'error' : ''}
              />
              {validationErrors.number && (
                <span className="error-text">{validationErrors.number}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="complement">Complemento</label>
            <input
              type="text"
              id="complement"
              name="complement"
              value={profile.complement}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Apartamento, sala, etc."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="neighborhood">Bairro *</label>
              <input
                type="text"
                id="neighborhood"
                name="neighborhood"
                value={profile.neighborhood}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Bairro"
                className={validationErrors.neighborhood ? 'error' : ''}
              />
              {validationErrors.neighborhood && (
                <span className="error-text">{validationErrors.neighborhood}</span>
              )}
            </div>

            <div className="form-group flex-grow">
              <label htmlFor="city">Cidade *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={profile.city}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Cidade"
                className={validationErrors.city ? 'error' : ''}
              />
              {validationErrors.city && (
                <span className="error-text">{validationErrors.city}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="state">Estado *</label>
              <select
                id="state"
                name="state"
                value={profile.state}
                onChange={handleChange}
                disabled={!isEditing}
                className={validationErrors.state ? 'error' : ''}
              >
                <option value="">UF</option>
                <option value="AC">AC</option>
                <option value="AL">AL</option>
                <option value="AP">AP</option>
                <option value="AM">AM</option>
                <option value="BA">BA</option>
                <option value="CE">CE</option>
                <option value="DF">DF</option>
                <option value="ES">ES</option>
                <option value="GO">GO</option>
                <option value="MA">MA</option>
                <option value="MT">MT</option>
                <option value="MS">MS</option>
                <option value="MG">MG</option>
                <option value="PA">PA</option>
                <option value="PB">PB</option>
                <option value="PR">PR</option>
                <option value="PE">PE</option>
                <option value="PI">PI</option>
                <option value="RJ">RJ</option>
                <option value="RN">RN</option>
                <option value="RS">RS</option>
                <option value="RO">RO</option>
                <option value="RR">RR</option>
                <option value="SC">SC</option>
                <option value="SP">SP</option>
                <option value="SE">SE</option>
                <option value="TO">TO</option>
              </select>
              {validationErrors.state && (
                <span className="error-text">{validationErrors.state}</span>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ClientProfile; 