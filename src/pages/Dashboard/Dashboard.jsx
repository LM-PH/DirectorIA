import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  FileCheck, 
  AlertTriangle, 
  FileText, 
  BookOpen, 
  Activity,
  RefreshCw,
  Bell,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { schoolId } = useAuth();
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    eventosHoy: 0,
    permisosPendientes: 0,
    acuerdosVencer: 0,
    documentosRecientes: 0,
    accionesPEMCAtrasadas: 0,
    planeacionesPendientes: 0
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!schoolId) return;
    import('firebase/firestore').then(({ collection, getDocs }) => {
      const { db } = require('../../config/firebase');

      const fetchDashboardData = async () => {
        try {
          const base = `schools/${schoolId}`;
          // Fetch collections
          const [agendaSnap, permisosSnap, acuerdosSnap, docsSnap, pemcSnap, entregasSnap] = await Promise.all([
            getDocs(collection(db, base, 'agenda')),
            getDocs(collection(db, base, 'permisos')),
            getDocs(collection(db, base, 'acuerdos_cte')),
            getDocs(collection(db, base, 'documentos')),
            getDocs(collection(db, base, 'pemc')),
            getDocs(collection(db, base, 'entregas_esperadas'))
          ]);

          const todayDate = new Date();
          todayDate.setHours(0,0,0,0);
          const todayStr = todayDate.toISOString().split('T')[0];

          // 1. Eventos Hoy
          const eventosHoy = agendaSnap.docs.filter(doc => (doc.data().fecha || doc.data().date) === todayStr).length;

          // 2. Permisos Pendientes
          const permisosPendientes = permisosSnap.docs.filter(doc => doc.data().estado === 'pendiente').length;

          // 3. Acuerdos a vencer (no cumplidos y vencen en los próximos 3 días o ya están atrasados)
          let acuerdosVencer = 0;
          acuerdosSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.estado !== 'cumplido') {
              const compDate = new Date(data.fechaCompromiso + 'T12:00:00');
              const diffDays = Math.ceil((compDate - todayDate) / (1000 * 60 * 60 * 24));
              if (diffDays <= 3) acuerdosVencer++;
            }
          });

          // 4. Documentos (todos o recientes)
          const documentosRecientes = docsSnap.size;

          // 5. Acciones PEMC Atrasadas
          let accionesPEMCAtrasadas = 0;
          pemcSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.estado !== 'completado') {
              const compDate = new Date(data.fechaTermino + 'T12:00:00');
              if (compDate < todayDate) accionesPEMCAtrasadas++;
            }
          });

          // 6. Entregas (Planeaciones u otras)
          const planeacionesPendientes = entregasSnap.size; // Simplificado por ahora

          setSummaryData({
            eventosHoy,
            permisosPendientes,
            acuerdosVencer,
            documentosRecientes,
            accionesPEMCAtrasadas,
            planeacionesPendientes
          });

          // Construir Actividad Reciente combinando los más nuevos
          const allActivities = [];

          // Documentos recientes
          docsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.createdAt) {
              allActivities.push({
                id: `doc-${doc.id}`,
                type: 'documento',
                title: 'Nuevo documento recibido',
                description: `${data.tipo}: ${data.nombre} (${data.docente})`,
                timestamp: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                module: 'Repositorio',
                icon: <FileText size={18} />,
                colorClass: 'bg-info'
              });
            }
          });

          // Permisos recientes
          permisosSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.createdAt) {
              allActivities.push({
                id: `perm-${doc.id}`,
                type: 'permiso',
                title: `Permiso ${data.estado}`,
                description: `${data.trabajador} - ${data.motivo}`,
                timestamp: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                module: 'Permisos',
                icon: <Clock size={18} />,
                colorClass: data.estado === 'pendiente' ? 'bg-warning' : (data.estado === 'autorizado' ? 'bg-success' : 'bg-danger')
              });
            }
          });

          // Sort by timestamp desc and take top 5
          allActivities.sort((a, b) => b.timestamp - a.timestamp);
          const topActivities = allActivities.slice(0, 5).map(act => ({
            ...act,
            time: act.timestamp.toLocaleDateString() + ' ' + act.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }));

          setActivities(topActivities);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setLoading(false);
        }
      };

      fetchDashboardData();
    });
  }, [schoolId]);

  const today = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{textAlign: 'center', color: 'var(--color-text-secondary)'}}>
          <RefreshCw size={32} className="text-info" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Conectando con la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Panel Principal</h1>
          <p>Resumen del estado actual de la escuela</p>
        </div>
        <div className="date-badge">
          <CalendarDays size={18} className="text-info" />
          <span style={{ textTransform: 'capitalize' }}>{today}</span>
        </div>
      </header>

      {/* Summary Grid */}
      <section className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon bg-info">
            <CalendarDays size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Eventos Hoy</h3>
            <div className="summary-value">
              {summaryData?.eventosHoy} <span className="summary-label text-neutral">programados</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-warning">
            <Clock size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Permisos Econ.</h3>
            <div className="summary-value text-warning">
              {summaryData?.permisosPendientes} <span className="summary-label text-warning">pendientes</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-danger">
            <AlertTriangle size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Acuerdos Vencen</h3>
            <div className="summary-value text-danger">
              {summaryData?.acuerdosVencer} <span className="summary-label text-danger">próximos</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-success">
            <FileCheck size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Doc. Recibidos</h3>
            <div className="summary-value text-success">
              {summaryData?.documentosRecientes} <span className="summary-label text-success">recientes</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-danger">
            <Activity size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">PEMC Atrasado</h3>
            <div className="summary-value text-danger">
              {summaryData?.accionesPEMCAtrasadas} <span className="summary-label text-danger">acciones</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-primary">
            <BookOpen size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Planeaciones</h3>
            <div className="summary-value">
              {summaryData?.planeacionesPendientes} <span className="summary-label text-neutral">pendientes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Section */}
      <section className="activity-section">
        <div className="activity-header">
          <h2><Bell size={20} /> Actividad Reciente</h2>
          <button className="btn-icon" title="Actualizar">
            <RefreshCw size={18} />
          </button>
        </div>
        <ul className="activity-list">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <li key={activity.id} className="activity-item">
                <div className={`activity-item-icon ${activity.colorClass}`}>
                  {activity.icon}
                </div>
                <div className="activity-item-content">
                  <h4 className="activity-item-title">{activity.title}</h4>
                  <p className="activity-item-desc">{activity.description}</p>
                  <div className="activity-item-meta">
                    <span className="meta-time">{activity.time}</span>
                    <span className="meta-module">{activity.module}</span>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="activity-item" style={{ justifyContent: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
              No hay actividad reciente registrada.
            </li>
          )}
        </ul>
      </section>

    </div>
  );
};

export default Dashboard;
