import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, User, Tag, Clock } from 'lucide-react';
import './AcuerdoModal.css';

const TIPOS_SESION = ['Ordinaria', 'Intensiva', 'Extraordinaria'];
const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en proceso', label: 'En proceso' },
  { value: 'cumplido', label: 'Cumplido' }
];

const AcuerdoModal = ({ isOpen, onClose, onSave, acuerdoToEdit }) => {
  const [formData, setFormData] = useState({
    fechaSesion: '',
    tipoSesion: 'Ordinaria',
    acuerdo: '',
    responsable: '',
    fechaCompromiso: '',
    evidencia: '',
    estado: 'pendiente',
    observaciones: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (acuerdoToEdit) {
      setFormData(acuerdoToEdit);
    } else {
      setFormData({
        fechaSesion: new Date().toISOString().split('T')[0],
        tipoSesion: 'Ordinaria',
        acuerdo: '',
        responsable: '',
        fechaCompromiso: '',
        evidencia: '',
        estado: 'pendiente',
        observaciones: ''
      });
    }
  }, [acuerdoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving acuerdo", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>{acuerdoToEdit ? 'Editar Acuerdo CTE' : 'Nuevo Acuerdo CTE'}</h2>
          <button type="button" className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="acuerdo-form">
          
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label><Calendar size={16}/> Fecha de Sesión *</label>
                <input 
                  type="date" 
                  name="fechaSesion" 
                  value={formData.fechaSesion} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Tag size={16}/> Tipo de Sesión *</label>
                <select name="tipoSesion" value={formData.tipoSesion} onChange={handleChange} required>
                  {TIPOS_SESION.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Acuerdo / Compromiso establecido *</label>
              <textarea 
                name="acuerdo" 
                value={formData.acuerdo} 
                onChange={handleChange} 
                placeholder="Describe el acuerdo tomado en la plenaria..."
                rows={3}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><User size={16}/> Responsable *</label>
                <input 
                  type="text" 
                  name="responsable" 
                  value={formData.responsable} 
                  onChange={handleChange} 
                  placeholder="Nombre del maestro o comisión" 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Clock size={16}/> Fecha Compromiso (Límite) *</label>
                <input 
                  type="date" 
                  name="fechaCompromiso" 
                  value={formData.fechaCompromiso} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Estado del Acuerdo *</label>
                <select name="estado" value={formData.estado} onChange={handleChange} required>
                  {ESTADOS.map(st => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label><FileText size={16}/> Evidencia / Entregable</label>
                <input 
                  type="text" 
                  name="evidencia" 
                  value={formData.evidencia} 
                  onChange={handleChange} 
                  placeholder="Ej. Formato firmado, producto de la sesión..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea 
                name="observaciones" 
                value={formData.observaciones} 
                onChange={handleChange} 
                placeholder="Anota cualquier dificultad o avance parcial..."
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Acuerdo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcuerdoModal;
