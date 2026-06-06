import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';
import { useConfig } from '../../../contexts/ConfigContext';
import { X, FileText, User, Calendar, BookOpen, Layers, Paperclip, UploadCloud } from 'lucide-react';
import './DocumentoModal.css';

const TIPOS_DOC = [
  'Programa analítico', 
  'Diagnóstico escolar', 
  'Diagnóstico socioeducativo', 
  'Planeación docente', 
  'Evidencia', 
  'Informe', 
  'Oficio', 
  'Acta', 
  'Otro'
];

const DocumentoModal = ({ isOpen, onClose, onSave, documentoToEdit, entregasDisponibles = [] }) => {
  const { config } = useConfig();
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Planeación docente',
    docente: '',
    asignatura: '',
    gradoGrupo: '',
    cicloEscolar: '',
    fechaRecepcion: '',
    observaciones: '',
    archivoUrl: '',
    archivoNombre: '',
    archivoMime: '',
    entregaId: ''
  });

  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (documentoToEdit) {
      setFormData(documentoToEdit);
    } else {
      setFormData({
        nombre: '',
        tipo: 'Planeación docente',
        docente: '',
        asignatura: '',
        gradoGrupo: '',
        // Usar contexto para prellenar
        cicloEscolar: config?.cicloEscolar || '',
        fechaRecepcion: new Date().toISOString().split('T')[0],
        observaciones: '',
        archivoUrl: '',
        archivoNombre: '',
        archivoMime: '',
        entregaId: ''
      });
    }
    setArchivo(null);
    setDragActive(false);
  }, [documentoToEdit, isOpen, config]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Drag and Drop Logic
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalUrl = formData.archivoUrl;
      let finalNombre = formData.archivoNombre;
      let finalMime = formData.archivoMime;

      if (archivo) {
        // Sanitize name and add timestamp to avoid overwriting
        const cleanName = archivo.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileRef = ref(storage, `documentos/${Date.now()}_${cleanName}`);
        const snapshot = await uploadBytes(fileRef, archivo);
        
        finalUrl = await getDownloadURL(snapshot.ref);
        finalNombre = archivo.name;
        finalMime = archivo.type || 'application/octet-stream';
      }

      await onSave({
        ...formData,
        archivoUrl: finalUrl,
        archivoNombre: finalNombre,
        archivoMime: finalMime
      });
      onClose();
    } catch (error) {
      console.error("Error saving document", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>{documentoToEdit ? 'Editar Registro de Documento' : 'Subir Nuevo Documento'}</h2>
          <button type="button" className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="doc-form">
          <div className="form-layout">
            {/* Left Column: Metadata */}
            <div className="form-column">
              
              <div className="form-group">
                <label>Nombre o Título del Documento *</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej. Planeación 1er Trimestre" 
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FileText size={16}/> Tipo de Doc *</label>
                  <select name="tipo" value={formData.tipo} onChange={handleChange} required>
                    {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label><User size={16}/> Docente / Responsable *</label>
                  <input 
                    type="text" 
                    name="docente" 
                    value={formData.docente} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><BookOpen size={16}/> Asignatura o Academia</label>
                  <input 
                    type="text" 
                    name="asignatura" 
                    value={formData.asignatura} 
                    onChange={handleChange} 
                    placeholder="Ej. Matemáticas" 
                  />
                </div>
                <div className="form-group">
                  <label><Layers size={16}/> Grado y Grupo</label>
                  <input 
                    type="text" 
                    name="gradoGrupo" 
                    value={formData.gradoGrupo} 
                    onChange={handleChange} 
                    placeholder="Ej. 1A" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ciclo Escolar *</label>
                  <input 
                    type="text" 
                    name="cicloEscolar" 
                    value={formData.cicloEscolar} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label><Calendar size={16}/> Fecha de Recepción *</label>
                  <input 
                    type="date" 
                    name="fechaRecepcion" 
                    value={formData.fechaRecepcion} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea 
                  name="observaciones" 
                  value={formData.observaciones} 
                  onChange={handleChange} 
                  rows={2}
                />
              </div>

              {entregasDisponibles.length > 0 && (
                <div className="form-group" style={{background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed #3B82F6'}}>
                  <label style={{color: '#1D4ED8'}}>¿Corresponde a una Entrega Esperada?</label>
                  <select name="entregaId" value={formData.entregaId || ''} onChange={handleChange}>
                    <option value="">No / Archivo Libre</option>
                    {entregasDisponibles.map(ent => (
                      <option key={ent.id} value={ent.id}>
                        {ent.nombre} (Vence: {ent.fechaLimite})
                      </option>
                    ))}
                  </select>
                  <span style={{fontSize: '0.8rem', color: '#3B82F6', marginTop: '4px', display: 'block'}}>
                    Si seleccionas una entrega, el semáforo del maestro cambiará a verde automáticamente.
                  </span>
                </div>
              )}

            </div>

            {/* Right Column: File Upload Area */}
            <div className="form-column">
              <label><Paperclip size={16}/> Archivo Físico</label>
              
              <div 
                className={`drag-drop-zone ${dragActive ? 'active' : ''} ${archivo || formData.archivoUrl ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                
                {archivo ? (
                  <div className="file-info">
                    <FileText size={48} className="text-primary" />
                    <p className="file-name">{archivo.name}</p>
                    <p className="file-size">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                    <span className="change-text">Haz clic para cambiar</span>
                  </div>
                ) : formData.archivoUrl ? (
                  <div className="file-info">
                    <FileText size={48} className="text-primary" />
                    <p className="file-name">{formData.archivoNombre}</p>
                    <span className="change-text">Haz clic para reemplazar</span>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <UploadCloud size={48} className="text-muted" />
                    <p>Arrastra tu archivo aquí</p>
                    <span>o haz clic para explorar</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Subiendo Documento...' : 'Guardar y Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentoModal;
