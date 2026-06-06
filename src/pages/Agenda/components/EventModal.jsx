import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlignLeft, User, Tag, AlertCircle } from 'lucide-react';
import './EventModal.css';

const EVENT_TYPES = [
  'Reunión', 'CTE', 'Incidencia', 'Visita de supervisión', 
  'Evento escolar', 'Entrega de documentos', 'Permiso del personal', 'Otro'
];

const EVENT_STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en proceso', label: 'En proceso' },
  { value: 'atendido', label: 'Atendido' }
];

const EventModal = ({ isOpen, onClose, onSave, eventToEdit }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    tipo: 'Reunión',
    responsable: '',
    estado: 'pendiente',
    observaciones: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setFormData(eventToEdit);
    } else {
      // Defaults for new event
      setFormData({
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: '08:00',
        tipo: 'Reunión',
        responsable: '',
        estado: 'pendiente',
        observaciones: ''
      });
    }
  }, [eventToEdit, isOpen]);

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
      console.error("Error saving event", error);
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{eventToEdit ? 'Editar Evento' : 'Nuevo Evento'}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label>Título del evento *</label>
            <input 
              type="text" 
              name="titulo" 
              value={formData.titulo} 
              onChange={handleChange} 
              placeholder="Ej. Reunión de academia" 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Calendar size={16}/> Fecha *</label>
              <input 
                type="date" 
                name="fecha" 
                value={formData.fecha} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label><Clock size={16}/> Hora *</label>
              <input 
                type="time" 
                name="hora" 
                value={formData.hora} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Tag size={16}/> Tipo de evento *</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange} required>
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label><AlertCircle size={16}/> Estado *</label>
              <select name="estado" value={formData.estado} onChange={handleChange} required>
                {EVENT_STATUSES.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><User size={16}/> Responsable *</label>
            <input 
              type="text" 
              name="responsable" 
              value={formData.responsable} 
              onChange={handleChange} 
              placeholder="Nombre del encargado" 
              required 
            />
          </div>

          <div className="form-group">
            <label><AlignLeft size={16}/> Descripción</label>
            <textarea 
              name="descripcion" 
              value={formData.descripcion} 
              onChange={handleChange} 
              placeholder="Detalles del evento..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea 
              name="observaciones" 
              value={formData.observaciones} 
              onChange={handleChange} 
              placeholder="Notas adicionales (opcional)"
              rows={2}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
