import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Users, Plus } from 'lucide-react';
import './DocumentoModal.css'; // Reusing modal styles where possible

const TIPOS_DOC = [
  'Programa analítico', 'Diagnóstico escolar', 'Diagnóstico socioeducativo', 
  'Planeación docente', 'Evidencia', 'Informe', 'Oficio', 'Acta', 'Otro'
];

const EntregaModal = ({ isOpen, onClose, onSave, entregaToEdit, docentesDisponibles = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipoDocumento: 'Planeación docente',
    fechaLimite: '',
    docentesRequeridos: []
  });

  const [nuevoDocente, setNuevoDocente] = useState('');
  const [listaDocentes, setListaDocentes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Combine existing unique teachers from DB with the ones saved in the edit object
    let combinados = [...new Set([...docentesDisponibles])].sort();
    
    if (entregaToEdit) {
      setFormData(entregaToEdit);
      // Ensure any teacher in entregaToEdit is in the list
      entregaToEdit.docentesRequeridos.forEach(d => {
        if (!combinados.includes(d)) combinados.push(d);
      });
    } else {
      setFormData({
        nombre: '',
        tipoDocumento: 'Planeación docente',
        fechaLimite: new Date().toISOString().split('T')[0],
        docentesRequeridos: []
      });
    }
    
    setListaDocentes(combinados.sort());
  }, [entregaToEdit, isOpen, docentesDisponibles]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (docente) => {
    setFormData(prev => {
      const current = prev.docentesRequeridos;
      if (current.includes(docente)) {
        return { ...prev, docentesRequeridos: current.filter(d => d !== docente) };
      } else {
        return { ...prev, docentesRequeridos: [...current, docente] };
      }
    });
  };

  const selectAll = () => setFormData(prev => ({ ...prev, docentesRequeridos: [...listaDocentes] }));
  const deselectAll = () => setFormData(prev => ({ ...prev, docentesRequeridos: [] }));

  const handleAddDocente = () => {
    if (nuevoDocente.trim() && !listaDocentes.includes(nuevoDocente.trim())) {
      const docName = nuevoDocente.trim();
      setListaDocentes(prev => [...prev, docName].sort());
      setFormData(prev => ({ ...prev, docentesRequeridos: [...prev.docentesRequeridos, docName] }));
      setNuevoDocente('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.docentesRequeridos.length === 0) {
      alert("Debes seleccionar al menos un docente requerido.");
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving entrega", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>{entregaToEdit ? 'Editar Entrega Esperada' : 'Solicitar Nueva Entrega'}</h2>
          <button type="button" className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="doc-form">
          <div className="form-layout">
            <div className="form-column">
              <div className="form-group">
                <label>Nombre de la Solicitud / Entrega *</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej. Planeación de Marzo" 
                  required 
                />
              </div>

              <div className="form-group">
                <label><FileText size={16}/> Tipo de Documento Esperado *</label>
                <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} required>
                  {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label><Calendar size={16}/> Fecha Límite de Entrega *</label>
                <input 
                  type="date" 
                  name="fechaLimite" 
                  value={formData.fechaLimite} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label className="flex justify-between items-center" style={{display:'flex', justifyContent:'space-between'}}>
                  <span><Users size={16} style={{display:'inline-block', verticalAlign:'middle', marginRight:'5px'}}/> Docentes Requeridos *</span>
                  <div className="mini-actions" style={{display:'flex', gap:'10px'}}>
                    <span onClick={selectAll} style={{cursor:'pointer', color:'var(--color-primary)', fontSize:'0.8rem'}}>Marcar Todos</span>
                    <span onClick={deselectAll} style={{cursor:'pointer', color:'var(--color-error)', fontSize:'0.8rem'}}>Desmarcar</span>
                  </div>
                </label>
                
                <div className="checkbox-list" style={{maxHeight:'200px', overflowY:'auto', border:'1px solid var(--color-border)', borderRadius:'8px', padding:'10px', background:'var(--color-background)'}}>
                  {listaDocentes.map(d => (
                    <label key={d} style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', cursor:'pointer'}}>
                      <input 
                        type="checkbox" 
                        checked={formData.docentesRequeridos.includes(d)}
                        onChange={() => handleCheckboxChange(d)}
                      />
                      <span>{d}</span>
                    </label>
                  ))}
                  {listaDocentes.length === 0 && <span className="text-muted" style={{fontSize:'0.85rem'}}>No hay docentes registrados aún. Agrega abajo.</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Agregar otro docente a la lista</label>
                <div style={{display:'flex', gap:'10px'}}>
                  <input 
                    type="text" 
                    value={nuevoDocente} 
                    onChange={e => setNuevoDocente(e.target.value)} 
                    placeholder="Nuevo Nombre..." 
                    onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddDocente(); } }}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddDocente} style={{padding:'0 15px'}}><Plus size={18}/></button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntregaModal;
