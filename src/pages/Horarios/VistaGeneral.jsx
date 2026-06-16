import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getConfig, getGrupos, getDocentes, getMaterias, getHorariosGenerados } from '../../services/horariosData';
import { Calendar, AlertCircle } from 'lucide-react';
import './Horarios.css';

const VistaGeneral = () => {
  const { schoolId } = useAuth();
  const [dataReady, setDataReady] = useState(false);
  const [config, setConfig] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [horarioDb, setHorarioDb] = useState(null);
  const [selectedGrupo, setSelectedGrupo] = useState(null);

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
      setGrupos(g.sort((a, b) => a.grado - b.grado || a.grupo.localeCompare(b.grupo)));
      setDocentes(d);
      setMaterias(m);

      if (h.length > 0) {
        // Obtenemos el más reciente
        const latest = h.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        setHorarioDb(latest);
      }

      setDataReady(true);
    };
    fetchData();
  }, [schoolId]);

  useEffect(() => {
    if (grupos.length > 0 && !selectedGrupo) {
      setSelectedGrupo(grupos[0].id);
    }
  }, [grupos, selectedGrupo]);

  if (!dataReady) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-primary)' }}>
        Cargando cuadrícula de horarios...
      </div>
    );
  }

  if (!horarioDb) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)' }}>
        <Calendar size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--color-primary)' }}>Sin Horarios Generados</h2>
        <p>Aún no hay ningún horario aprobado. Ve al Motor IA para generar uno.</p>
      </div>
    );
  }

  const getMateriaName = (id) => materias.find(m => m.id === id)?.nombre || 'Desconocida';
  const getDocenteName = (id) => docentes.find(d => d.id === id)?.nombre || 'Sin Docente';

  const diasMap = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
  };

  const diasLaborables = config.diasLaborables || [1, 2, 3, 4, 5];
  const modulosPorDia = config.modulosPorDia || 7;
  const recesoIndex = config.receso?.despuesDeModulo || 3;

  return (
    <div className="card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="tab-header" style={{ borderBottom: 'none', marginBottom: '1rem' }}>
        <div>
          <h3 className="module-title" style={{ marginBottom: '0.5rem' }}>Vista General de Horarios</h3>
          <p className="tab-header-description">Consulta la cuadrícula interactiva del horario activo.</p>
        </div>
      </div>

      <div className="schedule-view-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Seleccionar Grupo:</span>
          <select 
            className="form-group" 
            style={{ marginBottom: 0, minWidth: '200px' }}
            value={selectedGrupo || ''}
            onChange={(e) => setSelectedGrupo(e.target.value)}
          >
            {grupos.map(g => (
              <option key={g.id} value={g.id}>{g.grado}° {g.grupo} - {g.turno}</option>
            ))}
          </select>
        </div>
        
        {horarioDb.puntuacion && (
          <div className={`badge ${horarioDb.esValido ? 'badge-success' : 'badge-error'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            {horarioDb.esValido ? 'Horario Válido' : 'Horario con Conflictos'} (Eficiencia: {horarioDb.puntuacion}%)
          </div>
        )}
      </div>

      <div className="timetable-wrapper">
        <table className="timetable-grid">
          <thead>
            <tr>
              <th className="time-column">Módulo</th>
              {diasLaborables.map(d => (
                <th key={d}>{diasMap[d] || `Día ${d}`}</th>
              ))}
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
                        RECESO ESCOLAR ({config.receso?.duracion || 20} min)
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ background: '#f8fafc', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
                      Módulo {mIdx + 1}
                    </td>
                    {diasLaborables.map(dia => {
                      // Buscar asignación para este grupo, día y módulo
                      const slot = horarioDb.horario.find(h => 
                        h.grupoId === selectedGrupo && h.dia === dia && h.modulo === mIdx
                      );

                      return (
                        <td key={`${dia}-${mIdx}`}>
                          {slot ? (
                            <div className="timetable-class-card" style={{ height: '100%' }}>
                              <div className="class-card-subject">{getMateriaName(slot.materiaId)}</div>
                              <div className="class-card-teacher">{getDocenteName(slot.docenteId)}</div>
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
  );
};

export default VistaGeneral;
