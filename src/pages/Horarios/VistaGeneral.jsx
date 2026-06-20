import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getConfig, getGrupos, getDocentes, getMaterias, getHorariosGenerados, saveHorarioGenerado } from '../../services/horariosData';
import { Calendar, AlertCircle, Save } from 'lucide-react';
import './Horarios.css';

const VistaGeneral = () => {
  const { schoolId } = useAuth();
  const [dataReady, setDataReady] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  
  // Db and Local state
  const [horarioDb, setHorarioDb] = useState(null);
  const [localHorario, setLocalHorario] = useState([]);
  const [localSinAsignar, setLocalSinAsignar] = useState([]);
  const [hayCambios, setHayCambios] = useState(false);

  const [viewMode, setViewMode] = useState('grupo');
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [selectedDocente, setSelectedDocente] = useState(null);
  
  // Drag state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [conf, g, d, m, h] = await Promise.all([
        getConfig(schoolId),
        getGrupos(schoolId),
        getDocentes(schoolId),
        getMaterias(schoolId),
        getHorariosGenerados(schoolId)
      ]);
      setConfig(conf);
      setGrupos(g.sort((a, b) => (Number(a.grado) || 0) - (Number(b.grado) || 0) || (a.grupo || '').localeCompare(b.grupo || '')));
      setDocentes(d);
      setMaterias(m);

      if (h.length > 0) {
        const latest = h.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        setHorarioDb(latest);
        setLocalHorario(latest.horario || []);
        setLocalSinAsignar(latest.clasesSinAsignar || []);
      }
      setDataReady(true);
    };
    fetchData();
  }, [schoolId]);

  useEffect(() => {
    if (grupos.length > 0 && !selectedGrupo) setSelectedGrupo(grupos[0].id);
    if (docentes.length > 0 && !selectedDocente) setSelectedDocente(docentes[0].id);
  }, [grupos, docentes, selectedGrupo, selectedDocente]);

  // Helpers
  const getDocenteName = (id) => docentes.find(d => d.id === id)?.nombre || 'Docente Desconocido';
  const getMateriaName = (id) => materias.find(m => m.id === id)?.nombre || 'Materia';

  const diasLaborables = config?.diasLaborables || [1, 2, 3, 4, 5];
  const modulosPorDia = config?.modulosPorDia || 7;
  const recesoIndex = (config?.receso?.despuesDeModulo || 3) - 1;
  const diasMap = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

  // DND Handlers
  const handleDragStart = (e, clase, source) => {
    setDraggedItem({ clase, source });
    e.dataTransfer.setData('application/json', JSON.stringify({ clase, source }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const isCellAvailable = (clase, targetDia, targetModulo) => {
    // Verificar si el maestro está ocupado en ese día y módulo
    const conflictoDocente = localHorario.some(h => 
      Number(h.dia) === Number(targetDia) && 
      Number(h.modulo) === Number(targetModulo) && 
      h.docenteId === clase.docenteId &&
      h.id !== clase.id // No chocar consigo misma si viene del grid
    );
    return !conflictoDocente;
  };

  const handleDragOver = (e, dia, modulo) => {
    e.preventDefault();
    if (!draggedItem) return;
    setDragOverCell(`${dia}-${modulo}`);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverCell(null);
  };

  const handleDrop = (e, targetDia, targetModulo) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!draggedItem) return;

    const { clase, source } = draggedItem;

    if (!isCellAvailable(clase, targetDia, targetModulo)) {
      alert('Movimiento Inválido: El docente ya tiene clase en este horario.');
      return;
    }

    const newHorario = [...localHorario];
    const newSinAsignar = [...localSinAsignar];

    // Remover del origen
    if (source === 'banco') {
      const idx = newSinAsignar.findIndex(c => c.id === clase.id);
      if (idx > -1) newSinAsignar.splice(idx, 1);
    } else {
      const idx = newHorario.findIndex(h => h.id === clase.id);
      if (idx > -1) newHorario.splice(idx, 1);
    }

    // Insertar en destino
    newHorario.push({
      ...clase,
      dia: targetDia,
      modulo: targetModulo
    });

    setLocalHorario(newHorario);
    setLocalSinAsignar(newSinAsignar);
    setHayCambios(true);
    setDraggedItem(null);
  };

  const handleSaveManualChanges = async () => {
    if (!horarioDb) return;
    setSaving(true);
    try {
      const newData = {
        ...horarioDb,
        fecha: new Date().toISOString(),
        horario: localHorario,
        clasesSinAsignar: localSinAsignar,
        esValido: localSinAsignar.length === 0
      };
      await saveHorarioGenerado(schoolId, newData);
      setHorarioDb(newData);
      setHayCambios(false);
      alert('Cambios manuales guardados exitosamente.');
    } catch (error) {
      console.error(error);
      alert('Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (!dataReady) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando datos...</div>;
  if (!horarioDb) return <div style={{ padding: '2rem', textAlign: 'center' }}>No hay horarios generados. Ve a "Motor Heurístico".</div>;

  const currentSinAsignar = localSinAsignar.filter(c => 
    viewMode === 'grupo' ? (c.grupoId === selectedGrupo || (!c.grupoId && c.isTaller)) : c.docenteId === selectedDocente
  );

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      
      {/* Columna Principal: Cuadrícula */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tab-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
              <Calendar size={24} /> Editor Visual de Horarios
            </h2>
            <p className="tab-header-description">Arrastra clases para arreglar choques. (Modo: {viewMode})</p>
          </div>
          {hayCambios && (
            <button className="btn-primary" onClick={handleSaveManualChanges} disabled={saving} style={{ background: '#eab308', borderColor: '#eab308', color: '#000' }}>
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios Manuales'}
            </button>
          )}
        </div>

        <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0, display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ margin: 0 }}>Vista por:</label>
            <div className="toggle-group" style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`btn-secondary ${viewMode === 'grupo' ? 'active' : ''}`} onClick={() => setViewMode('grupo')}>Grupo</button>
              <button className={`btn-secondary ${viewMode === 'docente' ? 'active' : ''}`} onClick={() => setViewMode('docente')}>Docente</button>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            {viewMode === 'grupo' ? (
              <select className="form-group" style={{ marginBottom: 0, minWidth: '200px' }} value={selectedGrupo || ''} onChange={(e) => setSelectedGrupo(e.target.value)}>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.grado}° {g.grupo} - {g.turno}</option>)}
              </select>
            ) : (
              <select className="form-group" style={{ marginBottom: 0, minWidth: '200px' }} value={selectedDocente || ''} onChange={(e) => setSelectedDocente(e.target.value)}>
                {[...docentes].sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="timetable-wrapper card" style={{ padding: '0' }}>
          <table className="timetable-grid">
            <thead>
              <tr>
                <th className="time-column">Módulo</th>
                {diasLaborables.map(d => <th key={d}>{diasMap[d] || `Día ${d}`}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: modulosPorDia }).map((_, mIdx) => {
                const isRecess = mIdx === recesoIndex;

                return (
                  <React.Fragment key={mIdx}>
                    {isRecess && (
                      <tr className="recess-row">
                        <td style={{ background: '#e2e8f0' }}>RECESO</td>
                        <td colSpan={diasLaborables.length} style={{ background: '#f1f5f9', letterSpacing: '2px', color: '#64748b' }}>
                          RECESO ESCOLAR
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ background: '#f8fafc', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Módulo {mIdx + 1}</td>
                      {diasLaborables.map(dia => {
                        const selGrp = grupos.find(g => g.id === selectedGrupo);
                        const slots = localHorario.filter(h => 
                          Number(h.dia) === Number(dia) && 
                          Number(h.modulo) === Number(mIdx) && 
                          (viewMode === 'grupo' 
                            ? (h.grupoId === selectedGrupo || (!h.grupoId && h.isTaller && (!h.gradoTaller || Number(h.gradoTaller) === Number(selGrp?.grado))))
                            : h.docenteId === selectedDocente)
                        );

                        const isOver = dragOverCell === `${dia}-${mIdx}`;
                        let isAllowed = true;
                        if (draggedItem && isOver) {
                          isAllowed = isCellAvailable(draggedItem.clase, dia, mIdx);
                        }

                        let cellBg = '';
                        if (isOver) {
                          cellBg = isAllowed ? '#dcfce7' : '#fee2e2'; // Green or Red
                        }

                        return (
                          <td 
                            key={`${dia}-${mIdx}`}
                            style={{ background: cellBg, transition: 'background 0.2s' }}
                            onDragOver={(e) => isAllowed ? handleDragOver(e, dia, mIdx) : e.preventDefault()}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, dia, mIdx)}
                          >
                            {slots.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                                {slots.map((slot, i) => (
                                  <div 
                                    key={i} 
                                    className="timetable-class-card" 
                                    style={{ height: '100%', minHeight: '60px', borderLeftColor: slot.isTaller ? '#22c55e' : 'var(--color-primary)', cursor: 'grab' }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, slot, 'grid')}
                                  >
                                    <div className="class-card-subject" style={{ color: slot.isTaller ? '#166534' : 'inherit' }}>{getMateriaName(slot.materiaId)}</div>
                                    <div className="schedule-teacher">
                                      {viewMode === 'grupo' 
                                        ? getDocenteName(slot.docenteId) 
                                        : (slot.grupoId ? `${grupos.find(g=>g.id===slot.grupoId)?.grado}° ${grupos.find(g=>g.id===slot.grupoId)?.grupo}` : 'Taller General')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ height: '100%', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.8rem' }}>
                                Libre
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Columna Derecha: Banco de Fichas */}
      <div style={{ width: '300px', flexShrink: 0, position: 'sticky', top: '1rem' }}>
        <div className="card" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem', color: '#b91c1c' }}>
            <AlertCircle size={20} /> Banco Sin Asignar ({currentSinAsignar.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Arrastra estas fichas hacia el horario. Se iluminará en verde si el docente está libre.
          </p>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentSinAsignar.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>No hay clases sueltas.</div>
            ) : (
              currentSinAsignar.map((slot, i) => (
                <div 
                  key={slot.id || i} 
                  className="timetable-class-card" 
                  style={{ borderLeftColor: '#b91c1c', cursor: 'grab', background: '#fef2f2', border: '1px solid #fecaca', borderLeftWidth: '4px' }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, slot, 'banco')}
                >
                  <div className="class-card-subject" style={{ color: '#991b1b' }}>{getMateriaName(slot.materiaId)}</div>
                  <div className="schedule-teacher" style={{ color: '#b91c1c' }}>
                    {getDocenteName(slot.docenteId)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default VistaGeneral;
