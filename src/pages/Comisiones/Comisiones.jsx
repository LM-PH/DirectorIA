import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import PrintTemplate from '../Reportes/components/PrintTemplate';
import { 
  ClipboardList, 
  Users, 
  Calendar, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Download, 
  Printer, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Tag,
  Briefcase
} from 'lucide-react';
import './Comisiones.css';

const COMISION_OPTIONS = [
  'Acción social',
  'Higiene y salud',
  'Puntualidad y asistencia',
  'Seguridad escolar',
  'Protección civil',
  'Periódico mural',
  'Biblioteca',
  'Deportes',
  'Convivencia escolar',
  'Guardia escolar',
  'CTE',
  'Evaluación',
  'Otra'
];

const ESTADOS_ACCION = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en proceso', label: 'En proceso' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'no realizada', label: 'No realizada' },
  { value: 'reprogrammed', label: 'Reprogramada' }
];

const Comisiones = () => {
  const { schoolId } = useAuth();
  const { config: schoolConfig } = useConfig();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState('board'); // 'board', 'comisiones', 'acciones', 'calendario', 'reportes'

  // Firestore Collections
  const [comisiones, setComisiones] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search Filters
  const [searchComision, setSearchComision] = useState('');
  const [searchAccion, setSearchAccion] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState({
    comision: false,
    accion: false
  });

  const [editItem, setEditItem] = useState({
    comision: null,
    accion: null
  });

  // Commission Form
  const [formComision, setFormComision] = useState({
    nombre: 'Acción social',
    cicloEscolar: '2025-2026',
    proposito: '',
    responsablePrincipal: '',
    observaciones: '',
    estado: 'activa',
    participantes: [] // { nombre, funcion, cargo, contacto, observaciones }
  });

  // Action Form
  const [formAccion, setFormAccion] = useState({
    comisionId: '',
    comisionNombre: '',
    nombre: '',
    descripcion: '',
    responsable: '',
    participantes: '',
    fechaProgramada: '',
    hora: '',
    lugar: '',
    evidenciaEsperada: '',
    estado: 'pendiente',
    observaciones: '',
    evidenciaUrl: ''
  });

  // Members Sub-Form inside Commission Modal
  const [newMember, setNewMember] = useState({
    nombre: '',
    funcion: 'docente', // docente, administrativo, intendencia, directivo, otro
    cargo: 'integrante', // responsable, secretario, integrante, apoyo
    contacto: '',
    observaciones: ''
  });

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Report States
  const [reportFilters, setReportFilters] = useState({
    comisionId: '',
    mes: '',
    cicloEscolar: '2025-2026',
    responsable: '',
    estado: ''
  });

  // Fetch from Firestore
  useEffect(() => {
    if (!schoolId) return;

    setLoading(true);

    // Sync Comisiones
    const unsubCom = onSnapshot(collection(db, 'schools', schoolId, 'comisiones'), (snap) => {
      setComisiones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sync Acciones
    const unsubAcc = onSnapshot(collection(db, 'schools', schoolId, 'comisiones_acciones'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.fechaProgramada || '').localeCompare(b.fechaProgramada || ''));
      setAcciones(list);
    });

    setLoading(false);

    return () => {
      unsubCom();
      unsubAcc();
    };
  }, [schoolId]);

  // CRUD Comisiones
  const openNewComision = () => {
    setEditItem(prev => ({ ...prev, comision: null }));
    setFormComision({
      nombre: 'Acción social',
      cicloEscolar: '2025-2026',
      proposito: '',
      responsablePrincipal: '',
      observaciones: '',
      estado: 'activa',
      participantes: []
    });
    setModalOpen(prev => ({ ...prev, comision: true }));
  };

  const openEditComision = (comision) => {
    setEditItem(prev => ({ ...prev, comision }));
    setFormComision(comision);
    setModalOpen(prev => ({ ...prev, comision: true }));
  };

  const handleSaveComision = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formComision,
        updatedAt: new Date()
      };

      if (editItem.comision) {
        await updateDoc(doc(db, 'schools', schoolId, 'comisiones', editItem.comision.id), payload);
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'comisiones'), {
          ...payload,
          createdAt: new Date()
        });
      }
      setModalOpen(prev => ({ ...prev, comision: false }));
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDeleteComision = async (id) => {
    if (window.confirm('¿Eliminar esta comisión? Se borrarán sus acciones vinculadas.')) {
      await deleteDoc(doc(db, 'schools', schoolId, 'comisiones', id));
      const linked = acciones.filter(a => a.comisionId === id);
      const promises = linked.map(a => handleCleanupAction(a));
      await Promise.all(promises);
    }
  };

  const handleAddMember = () => {
    if (!newMember.nombre.trim()) return;
    setFormComision(prev => ({
      ...prev,
      participantes: [...prev.participantes, newMember]
    }));
    setNewMember({
      nombre: '',
      funcion: 'docente',
      cargo: 'integrante',
      contacto: '',
      observaciones: ''
    });
  };

  const handleRemoveMember = (idx) => {
    setFormComision(prev => ({
      ...prev,
      participantes: prev.participantes.filter((_, i) => i !== idx)
    }));
  };

  // CRUD Acciones & Bi-directional Sincronización
  const openNewAccion = () => {
    setEditItem(prev => ({ ...prev, accion: null }));
    setFormAccion({
      comisionId: comisiones[0]?.id || '',
      comisionNombre: comisiones[0]?.nombre || '',
      nombre: '',
      descripcion: '',
      responsable: '',
      participantes: '',
      fechaProgramada: new Date().toISOString().split('T')[0],
      hora: '12:00',
      lugar: '',
      evidenciaEsperada: '',
      estado: 'pendiente',
      observaciones: '',
      evidenciaUrl: ''
    });
    setModalOpen(prev => ({ ...prev, accion: true }));
  };

  const openEditAccion = (action) => {
    setEditItem(prev => ({ ...prev, accion: action }));
    setFormAccion(action);
    setModalOpen(prev => ({ ...prev, accion: true }));
  };

  const handleSaveAccion = async (e) => {
    e.preventDefault();
    setSaving(true);

    const comObject = comisiones.find(c => c.id === formAccion.comisionId);
    const comName = comObject ? comObject.nombre : '';

    const payload = {
      ...formAccion,
      comisionNombre: comName,
      updatedAt: new Date()
    };

    try {
      // 1. Sync Event to Agenda Directiva general
      let targetEventId = formAccion.agendaEventId || '';

      const agendaPayload = {
        titulo: `[Comisión: ${comName}] ${formAccion.nombre}`,
        fecha: formAccion.fechaProgramada,
        hora: formAccion.hora,
        tipo: 'Comisiones',
        responsable: formAccion.responsable,
        estado: formAccion.estado === 'realizada' ? 'atendido' : 'pendiente',
        descripcion: formAccion.descripcion,
        observaciones: formAccion.observaciones || '',
        updatedAt: new Date()
      };

      if (editItem.accion && targetEventId) {
        // Update existing agenda event
        await updateDoc(doc(db, 'schools', schoolId, 'agenda', targetEventId), agendaPayload);
      } else {
        // Create new agenda event
        const agendaDoc = await addDoc(collection(db, 'schools', schoolId, 'agenda'), {
          ...agendaPayload,
          createdAt: new Date()
        });
        targetEventId = agendaDoc.id;
        payload.agendaEventId = targetEventId;
      }

      // 2. Save Comisiones_Acciones
      if (editItem.accion) {
        await updateDoc(doc(db, 'schools', schoolId, 'comisiones_acciones', editItem.accion.id), payload);
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'comisiones_acciones'), {
          ...payload,
          createdAt: new Date()
        });
      }

      setModalOpen(prev => ({ ...prev, accion: false }));
    } catch (err) {
      console.error('Error al guardar acción de comisión:', err);
    }

    setSaving(false);
  };

  // Helper cleanup when deleting actions
  const handleCleanupAction = async (action) => {
    await deleteDoc(doc(db, 'schools', schoolId, 'comisiones_acciones', action.id));
    if (action.agendaEventId) {
      try {
        await deleteDoc(doc(db, 'schools', schoolId, 'agenda', action.agendaEventId));
      } catch (e) {
        console.warn('Agenda event not found for deletion:', action.agendaEventId);
      }
    }
  };

  const handleDeleteAccion = async (action) => {
    if (window.confirm('¿Eliminar esta acción de comisión? Se quitará de la agenda.')) {
      await handleCleanupAction(action);
    }
  };

  // ==========================================
  // SECCIÓN 5: MONITOREO & TABLERO SEMÁFORO
  // ==========================================
  const getMonitoreoMetrics = () => {
    const activeCommissions = comisiones.filter(c => c.estado === 'activa').length;
    const pending = acciones.filter(a => a.estado === 'pendiente' || a.estado === 'en proceso').length;
    const completed = acciones.filter(a => a.estado === 'realizada').length;
    const failed = acciones.filter(a => a.estado === 'no realizada').length;
    
    // Near deadline (next 3 days, not completed)
    const today = new Date();
    today.setHours(0,0,0,0);
    const limit = new Date();
    limit.setDate(today.getDate() + 3);
    limit.setHours(23,59,59,999);

    const nextToVence = acciones.filter(a => {
      if (a.estado === 'realizada') return false;
      const d = new Date(`${a.fechaProgramada}T12:00:00`);
      return d >= today && d <= limit;
    });

    // Overdue/Delayed (date < today, not completed)
    const overdue = acciones.filter(a => {
      if (a.estado === 'realizada') return false;
      const d = new Date(`${a.fechaProgramada}T12:00:00`);
      d.setHours(23,59,59,999);
      return d < today;
    });

    return {
      activeCommissions,
      pending,
      completed,
      failed,
      nextToVence,
      overdue
    };
  };

  const metrics = getMonitoreoMetrics();

  // ==========================================
  // SECCIÓN 4: CALENDARIZACIÓN LOCAL
  // ==========================================
  const renderCalendarCells = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayActions = acciones.filter(a => a.fechaProgramada === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      cells.push(
        <div key={d} className={`calendar-cell ${isToday ? 'today' : ''}`}>
          <div className="cell-header">
            <span className="day-number">{d}</span>
          </div>
          <div className="cell-events" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {dayActions.map(action => (
              <div 
                key={action.id} 
                className={`event-badge status-${action.estado.replace(' ', '-')}`}
                onClick={() => openEditAccion(action)}
                title={`${action.hora} - ${action.nombre}`}
                style={{ fontSize: '0.72rem', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
              >
                {action.nombre}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  // ==========================================
  // SECCIÓN 6: REPORTES CON EXPORTACIONES
  // ==========================================
  const getFilteredReportData = () => {
    return comisiones.map(com => {
      // Find all actions linked to this commission
      const comAcciones = acciones.filter(a => {
        const passCom = a.comisionId === com.id;
        
        // Month filter
        let passMonth = true;
        if (reportFilters.mes) {
          const d = new Date(`${a.fechaProgramada}T12:00:00`);
          passMonth = d.getMonth() + 1 === Number(reportFilters.mes);
        }

        // Responsible filter
        let passResp = true;
        if (reportFilters.responsable) {
          passResp = (a.responsable || '').toLowerCase().includes(reportFilters.responsable.toLowerCase());
        }

        // State filter
        let passState = true;
        if (reportFilters.estado) {
          passState = a.estado === reportFilters.estado;
        }

        return passCom && passMonth && passResp && passState;
      });

      const total = comAcciones.length;
      const realizadas = comAcciones.filter(a => a.estado === 'realizada').length;
      const noRealizadas = comAcciones.filter(a => a.estado === 'no realizada').length;
      const reprogramadas = comAcciones.filter(a => a.estado === 'reprogramada').length;
      const cumplimiento = total > 0 ? Math.round((realizadas / total) * 100) : 100;

      return {
        comision: com,
        acciones: comAcciones,
        stats: {
          total,
          realizadas,
          noRealizadas,
          reprogramadas,
          cumplimiento
        }
      };
    }).filter(r => {
      // Filter by selected commission ID
      if (reportFilters.comisionId) {
        return r.comision.id === reportFilters.comisionId;
      }
      return true;
    });
  };

  const reportData = getFilteredReportData();

  const handleExportExcel = (tableId, filename) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const html = table.outerHTML;
    const url = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xls`;
    link.click();
  };

  const filteredComisiones = comisiones.filter(c => c.nombre.toLowerCase().includes(searchComision.toLowerCase()) || c.responsablePrincipal.toLowerCase().includes(searchComision.toLowerCase()));
  const filteredAcciones = acciones.filter(a => a.nombre.toLowerCase().includes(searchAccion.toLowerCase()) || a.comisionNombre.toLowerCase().includes(searchAccion.toLowerCase()));

  return (
    <div className="module-container">
      <div className="tab-header">
        <div>
          <h1 className="module-title">Comisiones Escolares</h1>
          <p className="module-description">Registra, organiza, calendariza y monitorea las comisiones y actividades de tu plantel.</p>
        </div>
      </div>

      <div className="comisiones-layout">
        {/* Navigation Sidebar */}
        <aside className="comisiones-tabs-sidebar">
          <button className={`comisiones-tab-btn ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
            <Briefcase size={18} /> Tablero de Monitoreo
          </button>
          <button className={`comisiones-tab-btn ${activeTab === 'comisiones' ? 'active' : ''}`} onClick={() => setActiveTab('comisiones')}>
            <ClipboardList size={18} /> Registro de Comisiones
          </button>
          <button className={`comisiones-tab-btn ${activeTab === 'acciones' ? 'active' : ''}`} onClick={() => setActiveTab('acciones')}>
            <FileText size={18} /> Acciones Operativas
          </button>
          <button className={`comisiones-tab-btn ${activeTab === 'calendario' ? 'active' : ''}`} onClick={() => setActiveTab('calendario')}>
            <Calendar size={18} /> Calendarización
          </button>
          <button className={`comisiones-tab-btn ${activeTab === 'reportes' ? 'active' : ''}`} onClick={() => setActiveTab('reportes')}>
            <Download size={18} /> Reportes de Cumplimiento
          </button>
        </aside>

        {/* Content Tabs */}
        <main className="comisiones-content-area">

          {/* ======================================= */}
          {/* TAB 1: TABLERO / MONITOREO              */}
          {/* ======================================= */}
          {activeTab === 'board' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Monitoreo General de Comisiones</h2>
                  <p className="tab-header-description">Semáforo de cumplimiento e incidencias de acciones programadas.</p>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><ClipboardList size={22}/></div>
                  <div className="kpi-content">
                    <span className="kpi-value">{metrics.activeCommissions}</span>
                    <span className="kpi-label">Comisiones Activas</span>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}><Clock size={22}/></div>
                  <div className="kpi-content">
                    <span className="kpi-value">{metrics.pending}</span>
                    <span className="kpi-label">Pendientes / Proceso</span>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><CheckCircle2 size={22}/></div>
                  <div className="kpi-content">
                    <span className="kpi-value">{metrics.completed}</span>
                    <span className="kpi-label">Realizadas</span>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><AlertCircle size={22}/></div>
                  <div className="kpi-content">
                    <span className="kpi-value">{metrics.failed}</span>
                    <span className="kpi-label">No Realizadas</span>
                  </div>
                </div>
              </div>

              {/* Warnings and Deadlines Panels */}
              <div className="dashboard-sections-grid">
                
                {/* Atrasadas */}
                <div className="dashboard-panel-card">
                  <h3 style={{ color: '#ef4444' }}><AlertCircle size={18} /> Acciones Atrasadas ({metrics.overdue.length})</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {metrics.overdue.map(a => (
                      <div key={a.id} className="action-alert-item" style={{ borderLeftColor: '#ef4444' }}>
                        <div className="action-alert-info">
                          <span className="action-alert-title">{a.nombre}</span>
                          <span className="action-alert-meta">Comisión: {a.comisionNombre} | Fecha: {a.fechaProgramada}</span>
                        </div>
                        <button className="btn-icon-small" onClick={() => openEditAccion(a)}><ArrowRight size={14} /></button>
                      </div>
                    ))}
                    {metrics.overdue.length === 0 && (
                      <p className="text-muted text-center" style={{ fontSize: '0.85rem', margin: '20px 0' }}>No hay acciones atrasadas.</p>
                    )}
                  </div>
                </div>

                {/* Por Vencer */}
                <div className="dashboard-panel-card">
                  <h3 style={{ color: '#d97706' }}><Clock size={18} /> Próximas a Vencer (3 días) ({metrics.nextToVence.length})</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {metrics.nextToVence.map(a => (
                      <div key={a.id} className="action-alert-item" style={{ borderLeftColor: '#f59e0b' }}>
                        <div className="action-alert-info">
                          <span className="action-alert-title">{a.nombre}</span>
                          <span className="action-alert-meta">Comisión: {a.comisionNombre} | Vence: {a.fechaProgramada}</span>
                        </div>
                        <button className="btn-icon-small" onClick={() => openEditAccion(a)}><ArrowRight size={14} /></button>
                      </div>
                    ))}
                    {metrics.nextToVence.length === 0 && (
                      <p className="text-muted text-center" style={{ fontSize: '0.85rem', margin: '20px 0' }}>No hay vencimientos cercanos.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 2: REGISTRO DE COMISIONES           */}
          {/* ======================================= */}
          {activeTab === 'comisiones' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Registro de Comisiones Escolares</h2>
                  <p className="tab-header-description">Gestiona las mesas de trabajo y sus integrantes.</p>
                </div>
              </div>

              <div className="catalog-toolbar">
                <div className="catalog-search">
                  <input 
                    type="text" 
                    placeholder="Buscar comisión o responsable..."
                    value={searchComision}
                    onChange={e => setSearchComision(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={openNewComision}>
                  <Plus size={16} /> Crear Comisión
                </button>
              </div>

              <div className="comisiones-cards-grid">
                {filteredComisiones.map(c => (
                  <div key={c.id} className="comision-card">
                    <div className="comision-card-header">
                      <h3 className="comision-card-title">{c.nombre}</h3>
                      <span className={`badge badge-${c.estado === 'activa' ? 'success' : c.estado === 'pausada' ? 'warning' : 'neutral'}`}>
                        {c.estado}
                      </span>
                    </div>
                    <div className="comision-card-responsable">
                      <strong>Responsable:</strong> {c.responsablePrincipal}
                    </div>
                    <div className="comision-card-body">
                      <p style={{ margin: '0 0 10px 0' }}>{c.proposito}</p>
                      {c.participantes.length > 0 && (
                        <div className="comision-card-integrantes">
                          <div className="integrantes-title">Integrantes:</div>
                          {c.participantes.map((p, idx) => (
                            <span key={idx} className="integrante-tag" title={`${p.cargo} (${p.funcion})`}>
                              {p.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="comision-card-footer">
                      <small className="text-muted">Ciclo: {c.cicloEscolar}</small>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon-small" onClick={() => openEditComision(c)}><Edit2 size={14} /></button>
                        <button className="btn-icon-small text-error" onClick={() => handleDeleteComision(c.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredComisiones.length === 0 && (
                  <div className="empty-state" style={{ gridColumn: 'span 2' }}>
                    <ClipboardList size={48} className="text-muted" />
                    <h3>No hay comisiones registradas</h3>
                    <p>Registra comisiones y asigna integrantes para comenzar.</p>
                  </div>
                )}
              </div>

              {/* MODAL REGISTRO COMISIÓN */}
              {modalOpen.comision && (
                <div className="modal-overlay">
                  <div className="modal-content modal-large">
                    <div className="modal-header">
                      <h3>{editItem.comision ? 'Editar Comisión' : 'Nueva Comisión'}</h3>
                      <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, comision: false }))}>×</button>
                    </div>
                    <form onSubmit={handleSaveComision}>
                      <div className="config-form-grid">
                        <div className="form-group">
                          <label>Nombre de la Comisión *</label>
                          <select value={formComision.nombre} onChange={e => setFormComision(prev => ({ ...prev, nombre: e.target.value }))} required>
                            {COMISION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Ciclo Escolar *</label>
                          <input type="text" value={formComision.cicloEscolar} onChange={e => setFormComision(prev => ({ ...prev, cicloEscolar: e.target.value }))} placeholder="Ej. 2025-2026" required />
                        </div>
                        <div className="form-group full-width">
                          <label>Propósito de la Comisión *</label>
                          <textarea value={formComision.proposito} onChange={e => setFormComision(prev => ({ ...prev, proposito: e.target.value }))} placeholder="Escribe el propósito u objetivo principal..." rows={2} required />
                        </div>
                        <div className="form-group">
                          <label>Responsable Principal *</label>
                          <input type="text" value={formComision.responsablePrincipal} onChange={e => setFormComision(prev => ({ ...prev, responsablePrincipal: e.target.value }))} placeholder="Nombre del docente responsable" required />
                        </div>
                        <div className="form-group">
                          <label>Estado</label>
                          <select value={formComision.estado} onChange={e => setFormComision(prev => ({ ...prev, estado: e.target.value }))}>
                            <option value="activa">Activa</option>
                            <option value="pausada">Pausada</option>
                            <option value="concluida">Concluida</option>
                          </select>
                        </div>
                        <div className="form-group full-width">
                          <label>Observaciones</label>
                          <input type="text" value={formComision.observaciones || ''} onChange={e => setFormComision(prev => ({ ...prev, observaciones: e.target.value }))} />
                        </div>
                      </div>

                      {/* INTEGRANTES SUB-FORM */}
                      <div className="members-manager-section">
                        <h4>Integrantes de la Comisión</h4>
                        
                        <div className="member-add-row">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Nombre del Colaborador</label>
                            <input 
                              type="text" 
                              value={newMember.nombre} 
                              onChange={e => setNewMember(prev => ({ ...prev, nombre: e.target.value }))}
                              placeholder="Ej. Profr. Juan Pérez"
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Función</label>
                            <select value={newMember.funcion} onChange={e => setNewMember(prev => ({ ...prev, funcion: e.target.value }))}>
                              <option value="docente">Docente</option>
                              <option value="administrativo">Administrativo</option>
                              <option value="intendencia">Intendencia</option>
                              <option value="directivo">Directivo</option>
                              <option value="paae">Personal de apoyo (PAAE)</option>
                              <option value="otro">Otro</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Cargo en Comisión</label>
                            <select value={newMember.cargo} onChange={e => setNewMember(prev => ({ ...prev, cargo: e.target.value }))}>
                              <option value="responsable">Responsable</option>
                              <option value="secretario">Secretario</option>
                              <option value="tesorero">Tesorero</option>
                              <option value="integrante">Integrante</option>
                              <option value="apoyo">Apoyo</option>
                            </select>
                          </div>
                          <button type="button" className="btn-primary" onClick={handleAddMember} style={{ height: '38px', padding: '0 16px' }}>
                            Agregar
                          </button>
                        </div>

                        <div className="members-added-list">
                          {formComision.participantes.map((member, index) => (
                            <div key={index} className="member-list-item">
                              <div>
                                <strong>{member.nombre}</strong> &nbsp;|&nbsp; 
                                <span className="text-muted">{member.funcion}</span> &nbsp;|&nbsp; 
                                <span className="badge badge-info">{member.cargo}</span>
                              </div>
                              <button type="button" className="btn-icon-small text-error" onClick={() => handleRemoveMember(index)}>×</button>
                            </div>
                          ))}
                          {formComision.participantes.length === 0 && (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                              No hay colaboradores agregados todavía.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, comision: false }))}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={saving}>Guardar Comisión</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 3: ACCIONES OPERATIVAS              */}
          {/* ======================================= */}
          {activeTab === 'acciones' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Acciones Operativas</h2>
                  <p className="tab-header-description">Programa, describe y registra la evidencia de cumplimiento de las comisiones.</p>
                </div>
              </div>

              <div className="catalog-toolbar">
                <div className="catalog-search">
                  <input 
                    type="text" 
                    placeholder="Buscar acción o comisión..."
                    value={searchAccion}
                    onChange={e => setSearchAccion(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={openNewAccion} disabled={comisiones.length === 0}>
                  <Plus size={16} /> Programar Acción
                </button>
              </div>

              <div className="actions-container">
                {filteredAcciones.map(a => (
                  <div key={a.id} className="action-card">
                    <div className={`action-status-border bg-${a.estado.replace(' ', '-')}`}></div>
                    <div className="action-card-content">
                      <div className="action-card-header">
                        <div>
                          <h3 className="action-card-title">{a.nombre}</h3>
                          <span className="action-card-comision">Comisión: {a.comisionNombre}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`badge badge-${a.estado.replace(' ', '-')}`}>
                            {a.estado}
                          </span>
                          <button className="btn-icon-small" onClick={() => openEditAccion(a)}><Edit2 size={14} /></button>
                          <button className="btn-icon-small text-error" onClick={() => handleDeleteAccion(a)}><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <p className="action-card-description">{a.descripcion}</p>

                      <div className="action-card-meta-row">
                        <span><strong>Responsable:</strong> {a.responsable}</span>
                        <span><strong>Lugar:</strong> {a.lugar || '---'}</span>
                        <span><strong>Fecha y Hora:</strong> {a.fechaProgramada} ({a.hora})</span>
                        {a.evidenciaEsperada && <span><strong>Evidencia esperada:</strong> {a.evidenciaEsperada}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAcciones.length === 0 && (
                  <div className="empty-state">
                    <FileText size={48} className="text-muted" />
                    <h3>No hay acciones programadas</h3>
                    <p>Agrega acciones para que se reflejen en la agenda escolar.</p>
                  </div>
                )}
              </div>

              {/* MODAL REGISTRO ACCIÓN */}
              {modalOpen.accion && (
                <div className="modal-overlay">
                  <div className="modal-content modal-large">
                    <div className="modal-header">
                      <h3>{editItem.accion ? 'Editar Acción' : 'Programar Acción'}</h3>
                      <button className="btn-close" onClick={() => setModalOpen(prev => ({ ...prev, accion: false }))}>×</button>
                    </div>
                    <form onSubmit={handleSaveAccion}>
                      <div className="config-form-grid">
                        <div className="form-group">
                          <label>Comisión Vinculada *</label>
                          <select value={formAccion.comisionId} onChange={e => setFormAccion(prev => ({ ...prev, comisionId: e.target.value }))} required>
                            {comisiones.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Nombre de la Acción *</label>
                          <input type="text" value={formAccion.nombre} onChange={e => setFormAccion(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej. Campaña de limpieza escolar" required />
                        </div>
                        <div className="form-group full-width">
                          <label>Descripción detallada</label>
                          <textarea value={formAccion.descripcion} onChange={e => setFormAccion(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Describe el plan a ejecutar..." rows={2} required />
                        </div>
                        <div className="form-group">
                          <label>Responsable de la Acción *</label>
                          <input type="text" value={formAccion.responsable} onChange={e => setFormAccion(prev => ({ ...prev, responsable: e.target.value }))} placeholder="Nombre completo" required />
                        </div>
                        <div className="form-group">
                          <label>Participantes / Auxiliares</label>
                          <input type="text" value={formAccion.participantes} onChange={e => setFormAccion(prev => ({ ...prev, participantes: e.target.value }))} placeholder="Nombres de apoyo" />
                        </div>
                        <div className="form-group">
                          <label>Fecha Programada *</label>
                          <input type="date" value={formAccion.fechaProgramada} onChange={e => setFormAccion(prev => ({ ...prev, fechaProgramada: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label>Hora Programada *</label>
                          <input type="time" value={formAccion.hora} onChange={e => setFormAccion(prev => ({ ...prev, hora: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label>Lugar / Ubicación *</label>
                          <input type="text" value={formAccion.lugar} onChange={e => setFormAccion(prev => ({ ...prev, lugar: e.target.value }))} placeholder="Ej. Patio escolar" required />
                        </div>
                        <div className="form-group">
                          <label>Estado de Ejecución</label>
                          <select value={formAccion.estado} onChange={e => setFormAccion(prev => ({ ...prev, estado: e.target.value }))}>
                            {ESTADOS_ACCION.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Evidencia Esperada</label>
                          <input type="text" value={formAccion.evidenciaEsperada} onChange={e => setFormAccion(prev => ({ ...prev, evidenciaEsperada: e.target.value }))} placeholder="Ej. Fotos en periódico mural" />
                        </div>
                        <div className="form-group">
                          <label>Evidencia Adjunta (Enlace / Notas)</label>
                          <input type="text" value={formAccion.evidenciaUrl} onChange={e => setFormAccion(prev => ({ ...prev, evidenciaUrl: e.target.value }))} placeholder="Ej. Enlace a carpeta Drive o descripción" />
                        </div>
                        <div className="form-group full-width">
                          <label>Observaciones</label>
                          <input type="text" value={formAccion.observaciones || ''} onChange={e => setFormAccion(prev => ({ ...prev, observaciones: e.target.value }))} />
                        </div>
                      </div>
                      <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setModalOpen(prev => ({ ...prev, accion: false }))}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={saving}>Programar</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 4: CALENDARIZACIÓN                  */}
          {/* ======================================= */}
          {activeTab === 'calendario' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Calendarización de Comisiones</h2>
                  <p className="tab-header-description">Visualiza las acciones programadas en el mes actual.</p>
                </div>
              </div>

              <div className="calendar-view-pane">
                <div className="calendar-container" style={{ border: 'none', padding: 0 }}>
                  <div className="calendar-header" style={{ marginBottom: '1.5rem' }}>
                    <div className="month-selector">
                      <button className="btn-icon" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}><ChevronLeft size={20}/></button>
                      <h2>{['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][calendarDate.getMonth()]} {calendarDate.getFullYear()}</h2>
                      <button className="btn-icon" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}><ChevronRight size={20}/></button>
                    </div>
                  </div>
                  
                  <div className="calendar-grid">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="calendar-day-name">{day}</div>
                    ))}
                    {renderCalendarCells()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 5: REPORTES DE CUMPLIMIENTO         */}
          {/* ======================================= */}
          {activeTab === 'reportes' && (
            <div>
              <div className="tab-header" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                <div>
                  <h2>Reporte de Cumplimiento</h2>
                  <p className="tab-header-description">Genera actas oficiales del avance y ejecución de comisiones.</p>
                </div>
              </div>

              <div className="reports-toolbar">
                <div className="form-group">
                  <label>Comisión</label>
                  <select value={reportFilters.comisionId} onChange={e => setReportFilters(prev => ({ ...prev, comisionId: e.target.value }))}>
                    <option value="">Todas las Comisiones</option>
                    {comisiones.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Mes</label>
                  <select value={reportFilters.mes} onChange={e => setReportFilters(prev => ({ ...prev, mes: e.target.value }))}>
                    <option value="">Todos los Meses</option>
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Responsable</label>
                  <input 
                    type="text" 
                    value={reportFilters.responsable} 
                    onChange={e => setReportFilters(prev => ({ ...prev, responsable: e.target.value }))}
                    placeholder="Filtrar por nombre..."
                  />
                </div>

                <div className="form-group">
                  <label>Estado de Acción</label>
                  <select value={reportFilters.estado} onChange={e => setReportFilters(prev => ({ ...prev, estado: e.target.value }))}>
                    <option value="">Todos los Estados</option>
                    {ESTADOS_ACCION.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => handleExportExcel('printable-report-comisiones-table', `Reporte_Comisiones_${reportFilters.cicloEscolar}`)}>
                    <Download size={16} /> Excel
                  </button>
                  <button className="btn-primary" onClick={() => window.print()}>
                    <Printer size={16} /> Imprimir
                  </button>
                </div>
              </div>

              {reportData.length > 0 ? (
                <div>
                  {/* Totals Summary */}
                  <div className="report-summary-stats">
                    <div className="report-stat-item">
                      <div className="report-stat-val">
                        {reportData.reduce((acc, curr) => acc + curr.stats.total, 0)}
                      </div>
                      <div className="report-stat-lbl">Acciones Totales</div>
                    </div>
                    <div className="report-stat-item">
                      <div className="report-stat-val" style={{ color: '#10b981' }}>
                        {reportData.reduce((acc, curr) => acc + curr.stats.realizadas, 0)}
                      </div>
                      <div className="report-stat-lbl">Realizadas</div>
                    </div>
                    <div className="report-stat-item">
                      <div className="report-stat-val" style={{ color: '#ef4444' }}>
                        {reportData.reduce((acc, curr) => acc + curr.stats.noRealizadas, 0)}
                      </div>
                      <div className="report-stat-lbl">No Realizadas</div>
                    </div>
                    <div className="report-stat-item">
                      <div className="report-stat-val" style={{ color: '#3b82f6' }}>
                        {Math.round(
                          reportData.reduce((acc, curr) => acc + curr.stats.realizadas, 0) /
                          Math.max(1, reportData.reduce((acc, curr) => acc + curr.stats.total, 0)) * 100
                        )}%
                      </div>
                      <div className="report-stat-lbl">Cumplimiento Global</div>
                    </div>
                  </div>

                  {/* Preview of SEP Report */}
                  <div style={{ background: '#f1f5f9', padding: '30px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                    <div style={{ width: '800px', background: 'white', padding: '40px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <PrintTemplate 
                        title="Informe de Cumplimiento de Comisiones"
                        subtitle={`Ciclo Escolar: ${reportFilters.cicloEscolar} | Generado el: ${new Date().toLocaleDateString('es-MX')}`}
                        isScreenPreview={true}
                      >
                        <table className="report-table" id="printable-report-comisiones-table">
                          <thead>
                            <tr>
                              <th>Comisión / Propósito</th>
                              <th>Responsable e Integrantes</th>
                              <th>Acciones (Totales / Realizadas)</th>
                              <th>Efectividad</th>
                              <th>Evidencias y Observaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.map(r => (
                              <tr key={r.comision.id}>
                                <td>
                                  <strong>{r.comision.nombre}</strong>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                    {r.comision.proposito}
                                  </div>
                                </td>
                                <td>
                                  <strong>{r.comision.responsablePrincipal}</strong>
                                  <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>
                                    {r.comision.participantes.map(p => `${p.nombre} (${p.cargo})`).join(', ') || 'Sin integrantes'}
                                  </div>
                                </td>
                                <td>
                                  {r.stats.total} acciones programadas
                                  <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>
                                    ✓ {r.stats.realizadas} realizadas
                                  </div>
                                  {r.stats.reprogramadas > 0 && (
                                    <div style={{ fontSize: '0.72rem', color: '#3b82f6' }}>
                                      ✎ {r.stats.reprogramadas} reprogramadas
                                    </div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                  <span style={{ color: r.stats.cumplimiento > 80 ? '#047857' : r.stats.cumplimiento > 50 ? '#b45309' : '#b91c1c' }}>
                                    {r.stats.cumplimiento}%
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {r.acciones.filter(a => a.evidenciaUrl).map(a => (
                                      <div key={a.id}>• <strong>{a.nombre}:</strong> {a.evidenciaUrl}</div>
                                    ))}
                                    {r.comision.observaciones && <div><strong>Obs:</strong> {r.comision.observaciones}</div>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </PrintTemplate>
                    </div>
                  </div>

                  {/* Print-only template for browser print mechanism */}
                  <div className="print-only">
                    <PrintTemplate 
                      title="Informe de Cumplimiento de Comisiones"
                      subtitle={`Ciclo Escolar: ${reportFilters.cicloEscolar} | Generado el: ${new Date().toLocaleDateString('es-MX')}`}
                    >
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>Comisión / Propósito</th>
                            <th>Responsable e Integrantes</th>
                            <th>Acciones (Totales / Realizadas)</th>
                            <th>Efectividad</th>
                            <th>Evidencias y Observaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map(r => (
                            <tr key={r.comision.id}>
                              <td>
                                <strong>{r.comision.nombre}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                  {r.comision.proposito}
                                </div>
                              </td>
                              <td>
                                <strong>{r.comision.responsablePrincipal}</strong>
                                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>
                                  {r.comision.participantes.map(p => `${p.nombre} (${p.cargo})`).join(', ')}
                                </div>
                              </td>
                              <td>
                                {r.stats.total} programadas
                                <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>
                                  ✓ {r.stats.realizadas} realizadas
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                <span>{r.stats.cumplimiento}%</span>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.75rem' }}>
                                  {r.acciones.filter(a => a.evidenciaUrl).map(a => (
                                    <div key={a.id}>• {a.nombre}: {a.evidenciaUrl}</div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </PrintTemplate>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <ClipboardList size={48} className="text-muted" />
                  <h3>No hay datos para reportar</h3>
                  <p>Comienza programando acciones para tus comisiones para generar reportes.</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Comisiones;
