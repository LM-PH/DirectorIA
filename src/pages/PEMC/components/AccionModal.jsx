import React, { useState, useEffect } from 'react';
import { X, Target, FileText, User, Calendar, Activity, AlertCircle, TrendingUp } from 'lucide-react';
import './AccionModal.css';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en proceso', label: 'En proceso' },
  { value: 'cumplido', label: 'Cumplido' },
  { value: 'atrasado', label: 'Atrasado' }
];

const AccionModal = ({ isOpen, onClose, onSave, accionToEdit, ambitoActivo }) => {
  const [formData, setFormData] = useState({
    ambito: ambitoActivo,
    problematica: '',
    objetivo: '',
    meta: '',
    accion: '',
    responsable: '',
    fechaInicio: '',
    fechaCierre: '',
    evidencia: '',
    avance: 0,
    estado: 'pendiente',
    observaciones: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accionToEdit) {
      setFormData(accionToEdit);
    } else {
      setFormData({
        ambito: ambitoActivo,
        problematica: '',
        objetivo: '',
        meta: '',
        accion: '',
        responsable: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaCierre: '',
        evidencia: '',
        avance: 0,
        estado: 'pendiente',
        observaciones: ''
      });
    }
  }, [accionToEdit, ambitoActivo, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-update estado basado en el avance (Opcional, pero muy útil)
    if (name === 'avance') {
      const numValue = parseInt(value, 10);
      let nuevoEstado = formData.estado;
      if (numValue === 100) nuevoEstado = 'cumplido';
      else if (numValue > 0 && formData.estado === 'pendiente') nuevoEstado = 'en proceso';
      
      setFormData(prev => ({ ...prev, avance: numValue, estado: nuevoEstado }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving action", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <div>
            <h2>{accionToEdit ? 'Editar Acción del PEMC' : 'Nueva Acción'}</h2>
            <p className="subtitle">Ámbito: <strong>{ambitoActivo}</strong></p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="accion-form">
          
          <div className="form-section">
            <h3><AlertCircle size={18}/> Diagnóstico y Planeación</h3>
            
            <div className="form-group">
              <label>Problemática detectada *</label>
              <textarea 
                name="problematica" 
                value={formData.problematica} 
                onChange={handleChange} 
                placeholder="Describe la problemática escolar..."
                rows={2}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Objetivo *</label>
                <textarea 
                  name="objetivo" 
                  value={formData.objetivo} 
                  onChange={handleChange} 
                  placeholder="¿Qué queremos lograr?"
                  rows={2}
                  required
                />
              </div>
              <div className="form-group">
                <label>Meta *</label>
                <textarea 
                  name="meta" 
                  value={formData.meta} 
                  onChange={handleChange} 
                  placeholder="¿Cuánto, de qué manera y cuándo?"
                  rows={2}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><Target size={18}/> Implementación</h3>
            
            <div className="form-group">
              <label>Acción específica a realizar *</label>
              <textarea 
                name="accion" 
                value={formData.accion} 
                onChange={handleChange} 
                placeholder="Describe la acción concreta..."
                rows={2}
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
                  placeholder="Nombre o cargo del responsable" 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><Calendar size={16}/> Fecha de inicio *</label>
                <input 
                  type="date" 
                  name="fechaInicio" 
                  value={formData.fechaInicio} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label><Calendar size={16}/> Fecha de cierre *</label>
                <input 
                  type="date" 
                  name="fechaCierre" 
                  value={formData.fechaCierre} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><TrendingUp size={18}/> Seguimiento</h3>

            <div className="form-row">
              <div className="form-group">
                <label><Activity size={16}/> Estado de la acción *</label>
                <select name="estado" value={formData.estado} onChange={handleChange} required>
                  {ESTADOS.map(st => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Avance General ({formData.avance}%)</label>
                <div className="range-container">
                  <input 
                    type="range" 
                    name="avance" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={formData.avance} 
                    onChange={handleChange} 
                    className="slider"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label><FileText size={16}/> Evidencias</label>
              <input 
                type="text" 
                name="evidencia" 
                value={formData.evidencia} 
                onChange={handleChange} 
                placeholder="Ej. Listas de asistencia, fotografías, reporte..."
              />
            </div>

            <div className="form-group">
              <label>Observaciones / Resultados</label>
              <textarea 
                name="observaciones" 
                value={formData.observaciones} 
                onChange={handleChange} 
                placeholder="Anota cualquier desvío, logro o comentario importante..."
                rows={2}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Acción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccionModal;
