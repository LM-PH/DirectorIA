import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';
import { X, Calendar, User, Clock, FileText, Briefcase, Paperclip, AlertCircle } from 'lucide-react';
import './PermisoModal.css';

const FUNCIONES = ['docente', 'administrativo', 'intendencia', 'directivo', 'otro'];
const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'autorizado', label: 'Autorizado' },
  { value: 'rechazado', label: 'Rechazado' }
];

const PermisoModal = ({ isOpen, onClose, onSave, permisoToEdit }) => {
  const [formData, setFormData] = useState({
    trabajador: '',
    funcion: 'docente',
    fecha: '',
    horaInicio: '08:00',
    horaTermino: '13:00',
    motivo: '',
    tipoPermiso: 'Económico',
    estado: 'pendiente',
    observaciones: '',
    adjuntoUrl: '',
    adjuntoNombre: ''
  });

  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (permisoToEdit) {
      setFormData(permisoToEdit);
    } else {
      setFormData({
        trabajador: '',
        funcion: 'docente',
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: '08:00',
        horaTermino: '13:00',
        motivo: '',
        tipoPermiso: 'Económico',
        estado: 'pendiente',
        observaciones: '',
        adjuntoUrl: '',
        adjuntoNombre: ''
      });
    }
    setArchivo(null);
  }, [permisoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalUrl = formData.adjuntoUrl;
      let finalNombre = formData.adjuntoNombre;

      // Subir archivo si hay uno nuevo
      if (archivo) {
        const fileRef = ref(storage, `permisos/${Date.now()}_${archivo.name}`);
        const snapshot = await uploadBytes(fileRef, archivo);
        finalUrl = await getDownloadURL(snapshot.ref);
        finalNombre = archivo.name;
      }

      await onSave({
        ...formData,
        adjuntoUrl: finalUrl,
        adjuntoNombre: finalNombre
      });
      onClose();
    } catch (error) {
      console.error("Error saving permiso", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>{permisoToEdit ? 'Editar Solicitud de Permiso' : 'Nueva Solicitud de Permiso'}</h2>
          <button type="button" className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="permiso-form">
          
          <div className="form-section">
            <div className="form-row">
              <div className="form-group flex-2">
                <label><User size={16}/> Nombre del Trabajador *</label>
                <input 
                  type="text" 
                  name="trabajador" 
                  value={formData.trabajador} 
                  onChange={handleChange} 
                  placeholder="Ej. Juan Pérez" 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Briefcase size={16}/> Función *</label>
                <select name="funcion" value={formData.funcion} onChange={handleChange} required>
                  {FUNCIONES.map(f => (
                    <option key={f} value={f} style={{textTransform: 'capitalize'}}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label><Calendar size={16}/> Fecha Solicitada *</label>
                <input 
                  type="date" 
                  name="fecha" 
                  value={formData.fecha} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Clock size={16}/> Hora Inicio *</label>
                <input 
                  type="time" 
                  name="horaInicio" 
                  value={formData.horaInicio} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Clock size={16}/> Hora Término *</label>
                <input 
                  type="time" 
                  name="horaTermino" 
                  value={formData.horaTermino} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label><FileText size={16}/> Tipo de Permiso *</label>
                <input 
                  type="text" 
                  name="tipoPermiso" 
                  value={formData.tipoPermiso} 
                  onChange={handleChange} 
                  placeholder="Ej. Económico, Médico, Sindical" 
                  required 
                />
              </div>
              <div className="form-group">
                <label><AlertCircle size={16}/> Estado del Permiso *</label>
                <select name="estado" value={formData.estado} onChange={handleChange} required>
                  {ESTADOS.map(st => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Motivo</label>
              <textarea 
                name="motivo" 
                value={formData.motivo} 
                onChange={handleChange} 
                placeholder="Razón de la ausencia..."
                rows={2}
                required
              />
            </div>

            <div className="form-group">
              <label>Observaciones de Dirección</label>
              <textarea 
                name="observaciones" 
                value={formData.observaciones} 
                onChange={handleChange} 
                placeholder="Condiciones o notas para el archivo..."
                rows={2}
              />
            </div>
            
            <div className="form-group">
              <label><Paperclip size={16}/> Archivo Adjunto (Opcional)</label>
              <div className="file-upload-box" onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                {archivo ? (
                  <span className="file-selected text-primary fw-bold">{archivo.name}</span>
                ) : formData.adjuntoNombre ? (
                  <span className="file-selected text-primary">Archivo actual: {formData.adjuntoNombre}</span>
                ) : (
                  <span className="text-muted">Haz clic para adjuntar receta, citatorio, etc.</span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermisoModal;
