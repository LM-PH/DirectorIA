import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Save } from 'lucide-react';

const ReporteGeneral = ({ data }) => {
  const { schoolId } = useAuth();
  const [cualitativo, setCualitativo] = useState({
    logros: '',
    areasMejora: '',
    retos: '',
    conclusiones: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    const unsub = onSnapshot(doc(db, 'schools', schoolId, 'reporte_general', 'cualitativo'), (docSnap) => {
      if (docSnap.exists()) {
        setCualitativo(docSnap.data());
      }
    });
    return unsub;
  }, [schoolId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCualitativo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'schools', schoolId, 'reporte_general', 'cualitativo'), cualitativo, { merge: true });
      alert("Análisis cualitativo guardado correctamente.");
    } catch (e) {
      console.error(e);
      alert("Error al guardar.");
    }
    setIsSaving(false);
  };

  if (!data || !data.pemc) return <div className="text-center p-4">Cargando datos generales...</div>;

  // Cálculos cuantitativos
  const pemcTotal = data.pemc.length;
  const pemcCumplidos = data.pemc.filter(a => a.avance === 100).length;
  const pemcAvancePromedio = pemcTotal > 0 ? Math.round(data.pemc.reduce((sum, a) => sum + (a.avance || 0), 0) / pemcTotal) : 0;

  const cteTotal = data.cte.length;
  const cteCumplidos = data.cte.filter(a => a.estado === 'Cumplido').length;

  const totalPermisos = data.permisos.length;
  const totalDocumentos = data.documentos.length;
  
  // Calcular porcentaje de entregas si existen
  let porcentajeEntregas = 0;
  let totalEntregas = 0;
  if (data.entregas.length > 0) {
    const docentes = data.documentos.filter(d => d.tipo === 'Planeación' || d.tipo === 'planeacion');
    // Esto es un aproximado simple, el cálculo real depende de cuántos entregaron vs total esperados
    totalEntregas = data.entregas.length;
  }

  return (
    <div className="reporte-general">
      <p style={{textAlign: 'justify', marginBottom: '2rem'}}>
        El presente documento muestra un resumen estadístico y cualitativo de las actividades, gestiones, avances y cumplimiento
        de los distintos ámbitos educativos e institucionales a lo largo del ciclo escolar vigente.
      </p>

      {/* SECCIÓN CUANTITATIVA */}
      <h3 style={{ borderBottom: '2px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        I. ANÁLISIS CUANTITATIVO (ESTADÍSTICAS)
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Tarjeta PEMC */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>PEMC</h4>
          <p style={{ margin: '0.5rem 0' }}><strong>Total de acciones:</strong> {pemcTotal}</p>
          <p style={{ margin: '0.5rem 0' }}><strong>Acciones completadas:</strong> {pemcCumplidos}</p>
          <div style={{ marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Avance Global</span>
            <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', marginTop: '0.5rem' }}>
              <div style={{ width: `${pemcAvancePromedio}%`, height: '100%', background: '#3b82f6', borderRadius: '5px' }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{pemcAvancePromedio}%</div>
          </div>
        </div>

        {/* Tarjeta CTE */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Acuerdos de CTE</h4>
          <p style={{ margin: '0.5rem 0' }}><strong>Total de acuerdos:</strong> {cteTotal}</p>
          <p style={{ margin: '0.5rem 0' }}><strong>Acuerdos cumplidos:</strong> {cteCumplidos}</p>
          <div style={{ marginTop: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Cumplimiento</span>
            <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', marginTop: '0.5rem' }}>
              <div style={{ width: `${cteTotal > 0 ? (cteCumplidos/cteTotal)*100 : 0}%`, height: '100%', background: '#10b981', borderRadius: '5px' }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
              {cteTotal > 0 ? Math.round((cteCumplidos/cteTotal)*100) : 0}%
            </div>
          </div>
        </div>

        {/* Tarjeta Administración */}
        <div style={{ border: '1px solid #ddd', padding: '1.5rem', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Gestión Administrativa</h4>
          <p style={{ margin: '0.5rem 0' }}><strong>Permisos económicos solicitados:</strong> {totalPermisos}</p>
          <p style={{ margin: '0.5rem 0' }}><strong>Documentos institucionales recibidos:</strong> {totalDocumentos}</p>
          <p style={{ margin: '0.5rem 0' }}><strong>Procesos de entrega programados:</strong> {totalEntregas}</p>
        </div>

      </div>

      {/* SECCIÓN CUALITATIVA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>
          II. ANÁLISIS CUALITATIVO (EVALUACIÓN DIRECTIVA)
        </h3>
        <button className="btn-secondary btn-sm no-print" onClick={handleSave} disabled={isSaving}>
          <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Análisis'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Logros Principales del Ciclo Escolar</label>
          <textarea
            name="logros"
            value={cualitativo.logros}
            onChange={handleChange}
            placeholder="Redacta los principales logros alcanzados..."
            rows={4}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            className="print-textarea"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Áreas de Mejora y Dificultades Encontradas</label>
          <textarea
            name="areasMejora"
            value={cualitativo.areasMejora}
            onChange={handleChange}
            placeholder="Redacta las áreas de mejora detectadas..."
            rows={4}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            className="print-textarea"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Retos para el Próximo Ciclo</label>
          <textarea
            name="retos"
            value={cualitativo.retos}
            onChange={handleChange}
            placeholder="Redacta los retos que quedan pendientes..."
            rows={4}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            className="print-textarea"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Conclusiones Generales</label>
          <textarea
            name="conclusiones"
            value={cualitativo.conclusiones}
            onChange={handleChange}
            placeholder="Comentario final del directivo..."
            rows={4}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            className="print-textarea"
          />
        </div>

      </div>

      {/* FIRMAS */}
      <div className="doc-section page-break-before firmas-section" style={{ marginTop: '5rem' }}>
        <h3 className="section-title" style={{textAlign: 'center', marginBottom: '4rem'}}>VALIDACIÓN DEL INFORME</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem' }}>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
            <span>DIRECTOR DE LA ESCUELA</span>
          </div>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
            <span>SUPERVISOR / INSPECTOR ESCOLAR</span>
          </div>
        </div>
      </div>

      {/* Estilos para que los textareas se impriman sin borde */}
      <style>{`
        @media print {
          .print-textarea {
            border: none !important;
            resize: none !important;
            background: transparent !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReporteGeneral;
