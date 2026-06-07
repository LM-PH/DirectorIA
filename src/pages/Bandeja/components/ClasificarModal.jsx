import React, { useState, useEffect } from 'react';
import { X, FolderKanban, FileText, CheckCircle, CheckSquare, Users } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import '../../Repositorio/components/DocumentoModal.css';

const TIPOS_DOC = [
  'Programa analítico', 'Diagnóstico escolar', 'Diagnóstico socioeducativo', 
  'Planeación docente', 'Evidencia', 'Informe', 'Oficio', 'Acta', 'Otro'
];

const ClasificarModal = ({ isOpen, onClose, onSave, correo }) => {
  const { schoolId } = useAuth();
  const [moduloDestino, setModuloDestino] = useState('Repositorio');
  const [clasificacion, setClasificacion] = useState('');
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);

  const [pemcList, setPemcList] = useState([]);
  const [cteList, setCteList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      cargarListasExtras();
    }
    if (correo && isOpen) {
      if (correo.tipoSugerido === 'Permiso económico' || correo.asunto.toLowerCase().includes('permiso')) {
        setModuloDestino('Permisos');
        setClasificacion('Permiso Económico');
      } else {
        setModuloDestino('Repositorio');
        setClasificacion(correo.tipoSugerido || 'Planeación docente');
      }
      setTargetId('');
    }
  }, [correo, isOpen]);

  const cargarListasExtras = async () => {
    try {
      if (!schoolId) return;
      const qPemc = query(collection(db, 'schools', schoolId, 'pemc'), orderBy('fechaInicio', 'desc'));
      const snapPemc = await getDocs(qPemc);
      setPemcList(snapPemc.docs.map(d => ({ id: d.id, ...d.data() })));

      const qCte = query(collection(db, 'schools', schoolId, 'acuerdos_cte'), orderBy('fechaCompromiso', 'desc'));
      const snapCte = await getDocs(qCte);
      setCteList(snapCte.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error cargando PEMC/CTE:", e);
    }
  };

  if (!isOpen || !correo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((moduloDestino === 'PEMC' || moduloDestino === 'CTE') && !targetId) {
      alert('Debes seleccionar el registro específico al cual vincular la evidencia.');
      return;
    }

    setLoading(true);
    let observacionesPrevias = '';
    
    if (moduloDestino === 'PEMC') {
      const rec = pemcList.find(p => p.id === targetId);
      if(rec) observacionesPrevias = rec.observaciones;
    } else if (moduloDestino === 'CTE') {
      const rec = cteList.find(c => c.id === targetId);
      if(rec) observacionesPrevias = rec.observaciones;
    }

    await onSave({
      id: correo.id,
      moduloDestino,
      clasificacion,
      targetId,
      observacionesPrevias,
      remitenteNombre: correo.remitenteNombre,
      asunto: correo.asunto,
      cuerpo: correo.cuerpo,
      adjuntos: correo.adjuntos
    });
    setLoading(false);
    onClose();
  };

  const moduleOptionStyle = (modName) => ({
    flex: 1, padding: '12px 10px', 
    border: `2px solid ${moduloDestino === modName ? 'var(--color-primary)' : 'var(--color-border)'}`,
    borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
    background: moduloDestino === modName ? 'rgba(59, 130, 246, 0.05)' : 'white',
    minWidth: '45%'
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '550px'}}>
        <div className="modal-header">
          <h2>Clasificar Correo Entrante</h2>
          <button type="button" className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{background: '#F8FAFC', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem'}}>
          <p><strong>De:</strong> {correo.remitenteNombre}</p>
          <p><strong>Asunto:</strong> {correo.asunto}</p>
          {correo.adjuntos?.length > 0 ? (
            <p className="text-info" style={{marginTop: '5px'}}>📎 Contiene {correo.adjuntos.length} archivo(s) adjunto(s)</p>
          ) : (
            <p className="text-warning" style={{marginTop: '5px'}}>⚠️ No contiene archivos adjuntos</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="doc-form">
          <div className="form-group">
            <label>¿A dónde quieres enviar esta solicitud o evidencia?</label>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
              
              <div onClick={() => setModuloDestino('Repositorio')} style={moduleOptionStyle('Repositorio')}>
                <FolderKanban size={24} color={moduloDestino === 'Repositorio' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}/>
                <span style={{fontWeight: 'bold', color: moduloDestino === 'Repositorio' ? 'var(--color-primary)' : 'var(--color-text-primary)', fontSize:'0.9rem', textAlign:'center'}}>Repositorio Documental</span>
              </div>
              
              <div onClick={() => setModuloDestino('Permisos')} style={moduleOptionStyle('Permisos')}>
                <FileText size={24} color={moduloDestino === 'Permisos' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}/>
                <span style={{fontWeight: 'bold', color: moduloDestino === 'Permisos' ? 'var(--color-primary)' : 'var(--color-text-primary)', fontSize:'0.9rem', textAlign:'center'}}>Permisos Económicos</span>
              </div>

              <div onClick={() => setModuloDestino('PEMC')} style={moduleOptionStyle('PEMC')}>
                <CheckSquare size={24} color={moduloDestino === 'PEMC' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}/>
                <span style={{fontWeight: 'bold', color: moduloDestino === 'PEMC' ? 'var(--color-primary)' : 'var(--color-text-primary)', fontSize:'0.9rem', textAlign:'center'}}>Evidencia PEMC</span>
              </div>

              <div onClick={() => setModuloDestino('CTE')} style={moduleOptionStyle('CTE')}>
                <Users size={24} color={moduloDestino === 'CTE' ? 'var(--color-primary)' : 'var(--color-text-secondary)'}/>
                <span style={{fontWeight: 'bold', color: moduloDestino === 'CTE' ? 'var(--color-primary)' : 'var(--color-text-primary)', fontSize:'0.9rem', textAlign:'center'}}>Evidencia CTE</span>
              </div>

            </div>
          </div>

          {moduloDestino === 'Repositorio' && (
            <div className="form-group" style={{marginTop: '20px'}}>
              <label>Clasificación del Documento</label>
              <select value={clasificacion} onChange={e => setClasificacion(e.target.value)} required>
                {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {moduloDestino === 'Permisos' && (
            <div className="form-group" style={{marginTop: '20px', background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '8px', border: '1px dashed #10B981'}}>
              <p style={{margin:0, fontSize: '0.85rem', color: '#047857'}}>
                <CheckCircle size={14} style={{display:'inline', verticalAlign:'middle'}}/> Se creará un permiso económico a nombre de <strong>{correo.remitenteNombre}</strong>.
              </p>
            </div>
          )}

          {moduloDestino === 'PEMC' && (
            <div className="form-group" style={{marginTop: '20px'}}>
              <label>Vincular a Acción del PEMC</label>
              <select value={targetId} onChange={e => setTargetId(e.target.value)} required>
                <option value="">-- Selecciona una acción --</option>
                {pemcList.map(p => (
                  <option key={p.id} value={p.id}>{p.accion} ({p.ambito})</option>
                ))}
              </select>
              <span className="text-muted" style={{fontSize:'0.8rem', display:'block', marginTop:'5px'}}>Se adjuntará el archivo del correo como evidencia y se marcará la meta como cumplida.</span>
            </div>
          )}

          {moduloDestino === 'CTE' && (
            <div className="form-group" style={{marginTop: '20px'}}>
              <label>Vincular a Acuerdo del CTE</label>
              <select value={targetId} onChange={e => setTargetId(e.target.value)} required>
                <option value="">-- Selecciona un acuerdo --</option>
                {cteList.map(c => (
                  <option key={c.id} value={c.id}>{c.acuerdo} ({c.fechaSesion})</option>
                ))}
              </select>
              <span className="text-muted" style={{fontSize:'0.8rem', display:'block', marginTop:'5px'}}>Se adjuntará el archivo del correo como evidencia y se marcará el acuerdo como cumplido.</span>
            </div>
          )}

          <div className="modal-footer" style={{marginTop: '25px'}}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Procesando...' : 'Clasificar y Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClasificarModal;
