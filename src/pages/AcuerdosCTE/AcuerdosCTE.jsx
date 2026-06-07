import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, CheckCircle, Clock, AlertTriangle, AlertCircle, Edit2, Trash2, Filter } from 'lucide-react';
import AcuerdoModal from './components/AcuerdoModal';
import './AcuerdosCTE.css';

const AcuerdosCTE = () => {
  const { schoolId } = useAuth();
  const [acuerdos, setAcuerdos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [acuerdoToEdit, setAcuerdoToEdit] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    responsable: '',
    estado: '',
    fechaSesion: '',
    tipoSesion: ''
  });

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'schools', schoolId, 'acuerdos_cte'), orderBy('fechaCompromiso', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAcuerdos(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching acuerdos CTE:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [schoolId]);

  const handleOpenNew = () => {
    setAcuerdoToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (acuerdo) => {
    setAcuerdoToEdit(acuerdo);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este acuerdo?')) {
      await deleteDoc(doc(db, 'schools', schoolId, 'acuerdos_cte', id));
    }
  };

  const handleSave = async (data) => {
    if (data.id) {
      const { id, ...updateData } = data;
      await updateDoc(doc(db, 'schools', schoolId, 'acuerdos_cte', id), { ...updateData, updatedAt: new Date() });
    } else {
      await addDoc(collection(db, 'schools', schoolId, 'acuerdos_cte'), { ...data, createdAt: new Date() });
    }
  };

  // Helper to compute smart status
  const getSmartStatus = (acuerdo) => {
    if (acuerdo.estado === 'cumplido') return { id: 'cumplido', label: 'Cumplido', color: 'success' };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Convert YYYY-MM-DD to local date correctly
    const [y, m, d] = acuerdo.fechaCompromiso.split('-');
    const compDate = new Date(y, m - 1, d);
    compDate.setHours(0,0,0,0);

    const diffTime = compDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { id: 'atrasado', label: 'Atrasado', color: 'error' };
    } else if (diffDays >= 0 && diffDays <= 3) {
      return { id: 'proximo', label: 'Próximo a Vencer', color: 'warning' };
    }
    
    if (acuerdo.estado === 'en proceso') {
      return { id: 'en proceso', label: 'En proceso', color: 'info' };
    }
    
    return { id: 'pendiente', label: 'Pendiente', color: 'neutral' };
  };

  // Compute stats for top cards
  const stats = acuerdos.reduce((acc, curr) => {
    const s = getSmartStatus(curr);
    acc[s.id] = (acc[s.id] || 0) + 1;
    // Group 'pendiente' and 'en proceso' as 'pendientes_total' for the card
    if (s.id === 'pendiente' || s.id === 'en proceso') {
      acc.pendientes_total = (acc.pendientes_total || 0) + 1;
    }
    return acc;
  }, { cumplido: 0, atrasado: 0, proximo: 0, pendientes_total: 0 });

  // Get unique lists for filters
  const responsablesList = [...new Set(acuerdos.map(a => a.responsable))].sort();
  const sesionesList = [...new Set(acuerdos.map(a => a.fechaSesion))].sort((a,b) => b.localeCompare(a)); // desc

  // Filter the list
  const filteredAcuerdos = acuerdos.filter(a => {
    const s = getSmartStatus(a);
    const passResponsable = filters.responsable ? a.responsable === filters.responsable : true;
    const passEstado = filters.estado ? s.id === filters.estado : true;
    const passFecha = filters.fechaSesion ? a.fechaSesion === filters.fechaSesion : true;
    const passTipo = filters.tipoSesion ? a.tipoSesion === filters.tipoSesion : true;
    return passResponsable && passEstado && passFecha && passTipo;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ responsable: '', estado: '', fechaSesion: '', tipoSesion: '' });
  };

  return (
    <div className="module-container cte-module">
      <div className="cte-header">
        <div>
          <h1 className="module-title">Acuerdos de CTE</h1>
          <p className="module-description">Seguimiento a los compromisos del Consejo Técnico Escolar.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenNew}>
          <Plus size={18} /> Nuevo Acuerdo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-info-light text-info"><Clock size={24}/></div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.pendientes_total || 0}</span>
            <span className="kpi-label">Pendientes / En Proceso</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-warning-light text-warning"><AlertTriangle size={24}/></div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.proximo || 0}</span>
            <span className="kpi-label">Próximos a Vencer (3 días)</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-error-light text-error"><AlertCircle size={24}/></div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.atrasado || 0}</span>
            <span className="kpi-label">Atrasados</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-success-light text-success"><CheckCircle size={24}/></div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.cumplido || 0}</span>
            <span className="kpi-label">Cumplidos</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="filters-header">
          <Filter size={18} />
          <strong>Filtros</strong>
        </div>
        <div className="filters-grid">
          <select name="responsable" value={filters.responsable} onChange={handleFilterChange}>
            <option value="">Todos los Responsables</option>
            {responsablesList.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select name="estado" value={filters.estado} onChange={handleFilterChange}>
            <option value="">Todos los Estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en proceso">En proceso</option>
            <option value="proximo">Próximo a Vencer</option>
            <option value="atrasado">Atrasado</option>
            <option value="cumplido">Cumplido</option>
          </select>

          <select name="fechaSesion" value={filters.fechaSesion} onChange={handleFilterChange}>
            <option value="">Todas las Sesiones</option>
            {sesionesList.map(f => <option key={f} value={f}>Sesión: {f}</option>)}
          </select>

          <select name="tipoSesion" value={filters.tipoSesion} onChange={handleFilterChange}>
            <option value="">Todos los Tipos</option>
            <option value="Ordinaria">Ordinaria</option>
            <option value="Intensiva">Intensiva</option>
            <option value="Extraordinaria">Extraordinaria</option>
          </select>
          
          <button className="btn-secondary btn-clear" onClick={clearFilters}>Limpiar</button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-state">Cargando acuerdos...</div>
      ) : filteredAcuerdos.length === 0 ? (
        <div className="empty-state">
          <h3>No hay acuerdos que mostrar</h3>
          <p>No se encontraron resultados para los filtros seleccionados o la base de datos está vacía.</p>
        </div>
      ) : (
        <div className="acuerdos-list">
          {filteredAcuerdos.map(acuerdo => {
            const status = getSmartStatus(acuerdo);
            return (
              <div key={acuerdo.id} className="acuerdo-card">
                <div className={`acuerdo-status-bar bg-${status.color}`}></div>
                <div className="acuerdo-content">
                  <div className="acuerdo-header-row">
                    <div className="acuerdo-meta">
                      <span className="sesion-badge">Sesión {acuerdo.tipoSesion} ({acuerdo.fechaSesion})</span>
                      <span className={`badge badge-${status.color}`}>{status.label}</span>
                    </div>
                    <div className="acuerdo-actions">
                      <button className="btn-icon-small" onClick={() => handleEdit(acuerdo)} title="Editar"><Edit2 size={16}/></button>
                      <button className="btn-icon-small text-error" onClick={() => handleDelete(acuerdo.id)} title="Eliminar"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  
                  <div className="acuerdo-text">
                    <p>{acuerdo.acuerdo}</p>
                  </div>

                  <div className="acuerdo-footer-row">
                    <div className="footer-item">
                      <strong>Responsable:</strong>
                      <span>{acuerdo.responsable}</span>
                    </div>
                    <div className="footer-item">
                      <strong>Fecha Compromiso:</strong>
                      <span className={status.id === 'atrasado' || status.id === 'proximo' ? `text-${status.color} fw-bold` : ''}>
                        {acuerdo.fechaCompromiso}
                      </span>
                    </div>
                    {acuerdo.evidencia && (
                      <div className="footer-item">
                        <strong>Evidencia:</strong>
                        <span>{acuerdo.evidencia}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AcuerdoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        acuerdoToEdit={acuerdoToEdit}
      />
    </div>
  );
};

export default AcuerdosCTE;
