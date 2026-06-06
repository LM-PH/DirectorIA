import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useConfig } from '../../contexts/ConfigContext';
import { Save, Upload, School, Image as ImageIcon, AlertCircle } from 'lucide-react';
import './Configuracion.css';

const Configuracion = () => {
  const { config, loadingConfig } = useConfig();
  
  const [formData, setFormData] = useState({
    nombreEscuela: '',
    cct: '',
    turno: 'Matutino',
    nivel: 'Primaria',
    director: '',
    subdirector: '',
    cicloEscolar: '',
    zonaEscolar: '',
    sector: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const fileInputRef = useRef(null);

  // Initialize form with existing config data
  useEffect(() => {
    if (config) {
      setFormData({
        nombreEscuela: config.nombreEscuela || '',
        cct: config.cct || '',
        turno: config.turno || 'Matutino',
        nivel: config.nivel || 'Primaria',
        director: config.director || '',
        subdirector: config.subdirector || '',
        cicloEscolar: config.cicloEscolar || '',
        zonaEscolar: config.zonaEscolar || '',
        sector: config.sector || ''
      });
      if (config.logoUrl) {
        setLogoPreview(config.logoUrl);
      }
    }
  }, [config]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      // Create a local preview URL
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let finalLogoUrl = config?.logoUrl || '';

      // If there's a new file, upload it first
      if (logoFile) {
        const logoRef = ref(storage, `logos/logo_escuela_${Date.now()}`);
        const snapshot = await uploadBytes(logoRef, logoFile);
        finalLogoUrl = await getDownloadURL(snapshot.ref);
      }

      // Save all data to Firestore
      const docRef = doc(db, 'configuracion', 'general');
      await setDoc(docRef, {
        ...formData,
        logoUrl: finalLogoUrl,
        updatedAt: new Date()
      }, { merge: true });

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMessage({ type: 'error', text: 'Ocurrió un error al guardar. Verifica tus permisos o conexión.' });
    } finally {
      setSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  if (loadingConfig) {
    return <div className="loading-state">Cargando configuración...</div>;
  }

  return (
    <div className="module-container">
      <div className="config-header">
        <div>
          <h1 className="module-title">Configuración de la Escuela</h1>
          <p className="module-description">
            Estos datos aparecerán automáticamente en los reportes y documentos generados por el sistema.
          </p>
        </div>
        <button 
          onClick={handleSubmit} 
          className="btn-primary" 
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'error' && <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="config-layout">
        {/* Main Form */}
        <div className="config-card form-section">
          <div className="card-header">
            <School size={20} className="text-primary" />
            <h2>Datos Generales</h2>
          </div>
          
          <form className="config-form" id="config-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de la Escuela</label>
                <input 
                  type="text" 
                  name="nombreEscuela" 
                  value={formData.nombreEscuela} 
                  onChange={handleInputChange} 
                  placeholder="Ej. Esc. Primaria Benito Juárez"
                  required
                />
              </div>
              <div className="form-group">
                <label>Clave del Centro de Trabajo (CCT)</label>
                <input 
                  type="text" 
                  name="cct" 
                  value={formData.cct} 
                  onChange={handleInputChange} 
                  placeholder="Ej. 09DPR1234X"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nivel Educativo</label>
                <select name="nivel" value={formData.nivel} onChange={handleInputChange}>
                  <option value="Preescolar">Preescolar</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Media Superior">Media Superior</option>
                </select>
              </div>
              <div className="form-group">
                <label>Turno</label>
                <select name="turno" value={formData.turno} onChange={handleInputChange}>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Nocturno">Nocturno</option>
                  <option value="Tiempo Completo">Tiempo Completo</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Director(a)</label>
                <input 
                  type="text" 
                  name="director" 
                  value={formData.director} 
                  onChange={handleInputChange} 
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre del Subdirector(a)</label>
                <input 
                  type="text" 
                  name="subdirector" 
                  value={formData.subdirector} 
                  onChange={handleInputChange} 
                  placeholder="Nombre completo (Opcional)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ciclo Escolar Actual</label>
                <input 
                  type="text" 
                  name="cicloEscolar" 
                  value={formData.cicloEscolar} 
                  onChange={handleInputChange} 
                  placeholder="Ej. 2025-2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Zona Escolar</label>
                <input 
                  type="text" 
                  name="zonaEscolar" 
                  value={formData.zonaEscolar} 
                  onChange={handleInputChange} 
                  placeholder="Ej. 045"
                />
              </div>
              <div className="form-group">
                <label>Sector</label>
                <input 
                  type="text" 
                  name="sector" 
                  value={formData.sector} 
                  onChange={handleInputChange} 
                  placeholder="Ej. VII"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar for Logo */}
        <div className="config-card logo-section">
          <div className="card-header">
            <ImageIcon size={20} className="text-primary" />
            <h2>Logo Institucional</h2>
          </div>
          
          <div className="logo-upload-container">
            <div className="logo-preview-box" onClick={triggerFileInput}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="logo-preview-image" />
              ) : (
                <div className="logo-placeholder">
                  <ImageIcon size={48} className="text-muted" />
                  <span>Haz clic para subir logo</span>
                </div>
              )}
              
              <div className="logo-overlay">
                <Upload size={24} color="#fff" />
                <span>Cambiar Imagen</span>
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            
            <p className="logo-hint">
              Recomendado: Imagen cuadrada, formato PNG con fondo transparente. Tamaño máximo 2MB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
