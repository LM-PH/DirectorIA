import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle, CheckCircle, Save, Cpu, Zap, BarChart2, ShieldCheck, ServerCrash } from 'lucide-react';
import { getConfig, getDocentes, getGrupos, getMaterias, getEspacios, getAsignaciones, saveHorarioGenerado } from '../../services/horariosData';
import { useAuth } from '../../contexts/AuthContext';
import { ScheduleGenerator } from '../../services/ScheduleGenerator';
import { ScheduleValidator } from '../../services/ScheduleValidator';
import './Horarios.css';

const GeneradorPanel = () => {
  const { schoolId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  const [config, setConfig] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const conf = await getConfig(schoolId);
      setConfig(conf);
      setDocentes(await getDocentes(schoolId));
      setGrupos(await getGrupos(schoolId));
      setMaterias(await getMaterias(schoolId));
      setEspacios(await getEspacios(schoolId));
      setAsignaciones(await getAsignaciones(schoolId));
      setDataReady(true);
    };
    fetchData();
  }, [schoolId]);

  const handleGenerate = async () => {
    setLoading(true);
    setProgreso(10);
    setResultado(null);

    await new Promise(r => setTimeout(r, 800)); // Simulando
    setProgreso(40);

    try {
      const generator = new ScheduleGenerator(config, docentes, grupos, materias, espacios, asignaciones);
      const output = generator.generar();
      
      setProgreso(75);
      await new Promise(r => setTimeout(r, 600)); // Validación

      const validator = new ScheduleValidator(config, output.horario, docentes, grupos, espacios, asignaciones);
      const validacion = validator.validar();

      setProgreso(100);
      setResultado({
        ...output,
        esValido: validacion.esValido,
        conflictos: [...output.conflictos, ...validacion.conflictos]
      });

    } catch (err) {
      console.error(err);
      alert('Error crítico en el motor heurístico.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleSave = async () => {
    if (!resultado) return;
    try {
      await saveHorarioGenerado(schoolId, {
        fecha: new Date().toISOString(),
        puntuacion: resultado.puntuacion,
        horario: resultado.horario,
        esValido: resultado.esValido
      });
      alert('¡Horario guardado en la base de datos con éxito!');
    } catch (e) {
      console.error(e);
      alert('Error al guardar.');
    }
  };

  if (!dataReady) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-primary)' }}>
      Inicializando Motor IA...
    </div>
  );

  return (
    <div>
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
        <Cpu size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
        <h2 className="module-title">Motor Generador IA</h2>
        <p className="module-description" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          El algoritmo procesará {grupos.length} grupos y {docentes.length} docentes buscando la permutación óptima, respetando restricciones de módulos dobles, talleres y recesos.
        </p>

        {!loading && !resultado && (
          <button onClick={handleGenerate} className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            <Zap size={24} /> Ejecutar Generador
          </button>
        )}

        {loading && (
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>Procesando Heurística...</span>
              <span style={{ color: 'var(--color-primary)' }}>{progreso}%</span>
            </div>
            <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-primary)', height: '100%', width: `${progreso}%`, transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS */}
      {resultado && !loading && (
        <div className="card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <h3 className="module-title" style={{ marginBottom: '1.5rem' }}>Resultados del Generador</h3>
          
          <div className="generator-status-panel">
            <div className="quality-card" style={{ '--q-color': 'var(--color-primary)', '--q-val': (resultado.puntuacion / 100) * 100 }}>
              <div className="quality-progress-circle">
                <span className="quality-value-text">{resultado.puntuacion}</span>
              </div>
              <div className="quality-info">
                <span className="quality-title">Puntuación de Calidad</span>
                <span className="quality-score">{resultado.puntuacion} / 100</span>
              </div>
            </div>

            <div className="quality-card" style={{ '--q-color': resultado.esValido ? 'var(--color-success)' : 'var(--color-error)', '--q-val': 100 }}>
              <div className="quality-progress-circle">
                <span className="quality-value-text">
                  {resultado.esValido ? <ShieldCheck size={28} color="var(--color-success)" /> : <ServerCrash size={28} color="var(--color-error)" />}
                </span>
              </div>
              <div className="quality-info">
                <span className="quality-title">Estado del Horario</span>
                <span className="quality-score" style={{ color: resultado.esValido ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {resultado.esValido ? 'Válido' : 'Con Conflictos'}
                </span>
              </div>
            </div>
          </div>

          <div className="conflicts-panel" style={{ background: resultado.conflictos.length === 0 ? '#f0fdf4' : '#fef2f2', borderColor: resultado.conflictos.length === 0 ? '#d1fae5' : '#fee2e2', borderLeftColor: resultado.conflictos.length === 0 ? '#10b981' : '#ef4444' }}>
            <div className="conflicts-header" style={{ color: resultado.conflictos.length === 0 ? '#065f46' : '#991b1b' }}>
              {resultado.conflictos.length === 0 ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              Log del Validador ({resultado.conflictos.length} alertas)
            </div>
            
            {resultado.conflictos.length > 0 && (
              <ul className="conflicts-list">
                {resultado.conflictos.map((c, idx) => (
                  <li key={idx}>{c.mensaje}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <button onClick={handleGenerate} className="btn-secondary">
              Regenerar
            </button>
            <button onClick={handleSave} className="btn-primary" style={{ background: 'var(--color-accent)' }}>
              <Save size={18} /> Aprobar y Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneradorPanel;
