import React, { useState, useRef, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Printer, FileText, CheckSquare, Users, FolderKanban, Briefcase, Calendar as CalendarIcon, Download } from 'lucide-react';
import PrintTemplate from './components/PrintTemplate';
import './Reportes.css';

// Import Templates (to be created)
import ReportePermisos from './templates/ReportePermisos';
import ReporteCTE from './templates/ReporteCTE';
import ReportePEMC from './templates/ReportePEMC';
import ReporteDocumentos from './templates/ReporteDocumentos';
import ReporteEntregas from './templates/ReporteEntregas';
import ReporteAgenda from './templates/ReporteAgenda';

const REPORT_TYPES = [
  { id: 'permisos', title: 'Permisos Económicos', icon: <Briefcase size={24}/>, desc: 'Historial de ausencias autorizadas por mes.', color: 'var(--color-primary)' },
  { id: 'cte', title: 'Acuerdos CTE', icon: <Users size={24}/>, desc: 'Listado de acuerdos pendientes y cumplidos.', color: 'var(--color-info)' },
  { id: 'pemc', title: 'Avance PEMC', icon: <CheckSquare size={24}/>, desc: 'Progreso de metas por ámbito.', color: 'var(--color-success)' },
  { id: 'documentos', title: 'Documentos Recibidos', icon: <FolderKanban size={24}/>, desc: 'Inventario del archivo digital escolar.', color: 'var(--color-warning)' },
  { id: 'entregas', title: 'Control de Entregas', icon: <FileText size={24}/>, desc: 'Matriz de planeaciones entregadas vs docentes.', color: 'var(--color-error)' },
  { id: 'agenda', title: 'Agenda Mensual', icon: <CalendarIcon size={24}/>, desc: 'Eventos y reuniones programadas.', color: 'var(--color-primary)' },
];

const Reportes = () => {
  const { schoolId } = useAuth();
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [extraData, setExtraData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [filtroSesionCTE, setFiltroSesionCTE] = useState('');

  const printRef = useRef(null);

  const fetchReportData = async (reportId) => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const base = `schools/${schoolId}`;
      if (reportId === 'permisos') {
        const snap = await getDocs(collection(db, base, 'permisos'));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a,b) => (a.fecha || '').localeCompare(b.fecha || ''));
        setReportData(data);
      } else if (reportId === 'cte') {
        const snap = await getDocs(collection(db, base, 'acuerdos_cte'));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a,b) => (a.fechaCompromiso || '').localeCompare(b.fechaCompromiso || ''));
        setReportData(data);
      } else if (reportId === 'pemc') {
        const snap = await getDocs(collection(db, base, 'pemc'));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a,b) => (a.fechaInicio || '').localeCompare(b.fechaInicio || ''));
        setReportData(data);
      } else if (reportId === 'documentos') {
        const snap = await getDocs(collection(db, base, 'documentos'));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a,b) => (a.fechaRecepcion || '').localeCompare(b.fechaRecepcion || ''));
        setReportData(data);
      } else if (reportId === 'agenda') {
        const snap = await getDocs(collection(db, base, 'agenda'));
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a,b) => (a.fecha || '').localeCompare(b.fecha || ''));
        setReportData(data);
      } else if (reportId === 'entregas') {
        const snapEntregas = await getDocs(collection(db, base, 'entregas_esperadas'));
        let data = snapEntregas.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a,b) => (a.fechaLimite || '').localeCompare(b.fechaLimite || ''));
        setReportData(data);
        
        const snapDocs = await getDocs(collection(db, base, 'documentos'));
        setExtraData(snapDocs.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) {
      console.error("Error fetching report data", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeReport) {
      fetchReportData(activeReport.id);
      // Auto-scroll on mobile
      if (window.innerWidth <= 1024) {
        setTimeout(() => {
          document.querySelector('.reportes-preview-area')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [activeReport, filtroMes, filtroAnio]);

  // Auto-select latest CTE Session when CTE report is loaded
  useEffect(() => {
    if (activeReport?.id === 'cte' && reportData.length > 0) {
      const sessions = [...new Set(reportData.map(a => `${a.tipoSesion} - ${a.fechaSesion}`))].sort((a,b) => b.localeCompare(a));
      if (sessions.length > 0 && !filtroSesionCTE) {
        setFiltroSesionCTE(sessions[0]);
      }
    } else if (activeReport?.id !== 'cte') {
      setFiltroSesionCTE('');
    }
  }, [activeReport, reportData]);

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  const getFilteredCTEData = () => {
    if (!filtroSesionCTE) return reportData;
    const [tipo, fecha] = filtroSesionCTE.split(' - ');
    return reportData.filter(a => a.tipoSesion === tipo && a.fechaSesion === fecha);
  };

  const getReportTitle = () => {
    if (!activeReport) return '';
    if (activeReport.id === 'cte' && filtroSesionCTE) {
      return `Acuerdos de CTE: Sesión ${filtroSesionCTE}`;
    }
    return `Reporte de ${activeReport.title}`;
  };

  const renderActiveTemplate = () => {
    if (!activeReport) return null;
    
    const props = { data: reportData, extraData, filtroMes, filtroAnio };
    
    switch (activeReport.id) {
      case 'permisos': return <ReportePermisos {...props} />;
      case 'cte': return <ReporteCTE data={getFilteredCTEData()} />;
      case 'pemc': return <ReportePEMC {...props} />;
      case 'documentos': return <ReporteDocumentos {...props} />;
      case 'entregas': return <ReporteEntregas {...props} />;
      case 'agenda': return <ReporteAgenda {...props} />;
      default: return null;
    }
  };

  return (
    <div className="module-container reportes-module">
      <div className="reportes-header">
        <div>
          <h1 className="module-title">Reportes Oficiales</h1>
          <p className="module-description">Genera documentos físicos para firmas y evidencia de la supervisión.</p>
        </div>
      </div>

      <div className="reportes-layout">
        
        {/* Selector de Reportes */}
        <div className="reportes-selector">
          <h2>Tipos de Reporte</h2>
          <div className="reports-grid">
            {REPORT_TYPES.map(rt => (
              <div 
                key={rt.id} 
                className={`report-card ${activeReport?.id === rt.id ? 'active' : ''}`}
                onClick={() => setActiveReport(rt)}
                style={{ '--highlight': rt.color }}
              >
                <div className="report-icon" style={{color: rt.color}}>{rt.icon}</div>
                <div className="report-card-content">
                  <h3>{rt.title}</h3>
                  <p>{rt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vista Previa del Reporte */}
        <div className="reportes-preview-area">
          {activeReport ? (
            <div className="preview-container">
              <div className="preview-toolbar">
                <div className="preview-filters">
                  {/* Algunos reportes necesitan filtro de mes/año */}
                  {['permisos', 'agenda', 'documentos'].includes(activeReport.id) && (
                    <>
                      <select value={filtroMes} onChange={e => setFiltroMes(Number(e.target.value))}>
                        <option value={1}>Enero</option>
                        <option value={2}>Febrero</option>
                        <option value={3}>Marzo</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Mayo</option>
                        <option value={6}>Junio</option>
                        <option value={7}>Julio</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Septiembre</option>
                        <option value={10}>Octubre</option>
                        <option value={11}>Noviembre</option>
                        <option value={12}>Diciembre</option>
                      </select>
                      <select value={filtroAnio} onChange={e => setFiltroAnio(Number(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </>
                  )}

                  {/* Filtro específico para CTE */}
                  {activeReport.id === 'cte' && (
                    <select 
                      value={filtroSesionCTE} 
                      onChange={e => setFiltroSesionCTE(e.target.value)}
                      style={{ minWidth: '220px' }}
                    >
                      <option value="">Todas las Sesiones</option>
                      {[...new Set(reportData.map(a => `${a.tipoSesion} - ${a.fechaSesion}`))].sort((a,b) => b.localeCompare(a)).map(session => (
                        <option key={session} value={session}>Sesión: {session}</option>
                      ))}
                    </select>
                  )}
                </div>
                <button className="btn-primary" onClick={handlePrint} disabled={loading}>
                  <Printer size={18} /> Imprimir / PDF
                </button>
              </div>

              <div className="preview-box">
                {loading ? (
                  <div className="loading-state">Extrayendo datos de la base de datos...</div>
                ) : (
                  <div className="preview-content-simulated">
                    {/* Esta es la vista previa en pantalla, similar al impreso pero sin ocultar la app */}
                    <div className="preview-glass" style={{ padding: 0, background: 'transparent', boxShadow: 'none', minHeight: 'auto' }}>
                      <div className="preview-watermark" style={{ zIndex: 10 }}>VISTA PREVIA</div>
                      <PrintTemplate 
                        title={getReportTitle()}
                        subtitle={`Fecha de corte: ${new Date().toLocaleDateString('es-MX')}`}
                        isScreenPreview={true}
                      >
                        {renderActiveTemplate()}
                      </PrintTemplate>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Printer size={48} className="text-muted" />
              <h3>Selecciona un reporte</h3>
              <p>Elige una opción a la izquierda para generar la vista previa.</p>
            </div>
          )}
        </div>
      </div>

      {/* Componente Oculto que se inyecta al dar Print */}
      {activeReport && !loading && (
        <PrintTemplate 
          ref={printRef} 
          title={getReportTitle()}
          subtitle={`Fecha de corte: ${new Date().toLocaleDateString('es-MX')}`}
        >
          {renderActiveTemplate()}
        </PrintTemplate>
      )}

    </div>
  );
};

export default Reportes;
