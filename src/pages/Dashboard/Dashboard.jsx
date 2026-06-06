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
import './Dashboard.css';

const Dashboard = () => {
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [activities, setActivities] = useState([]);

  // Mock data loading to simulate Firestore fetch
  useEffect(() => {
    // TODO: Replace this with actual Firestore listeners
    // import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
    // import { db } from '../../config/firebase';
    
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSummaryData({
        eventosHoy: 2,
        permisosPendientes: 3,
        acuerdosVencer: 1,
        documentosRecientes: 5,
        accionesPEMCAtrasadas: 2,
        planeacionesPendientes: 4
      });

      setActivities([
        {
          id: '1',
          type: 'documento',
          title: 'Nuevo oficio recibido',
          description: 'Oficio circular de supervisión escolar No. 045/2026',
          time: 'Hace 30 minutos',
          module: 'Repositorio',
          icon: <FileText size={18} />,
          colorClass: 'bg-info'
        },
        {
          id: '2',
          type: 'permiso',
          title: 'Solicitud de permiso económico',
          description: 'Prof. Juan Pérez - Ausencia por motivos personales (2 días)',
          time: 'Hace 2 horas',
          module: 'Permisos',
          icon: <Clock size={18} />,
          colorClass: 'bg-warning'
        },
        {
          id: '3',
          type: 'pemc',
          title: 'Meta de PEMC actualizada',
          description: 'Ámbito: Aprovechamiento académico. Avance registrado: 80%',
          time: 'Ayer, 14:30',
          module: 'PEMC',
          icon: <CheckCircle2 size={18} />,
          colorClass: 'bg-success'
        },
        {
          id: '4',
          type: 'acuerdo',
          title: 'Acuerdo de CTE próximo a vencer',
          description: 'Entrega de diagnósticos grupales (Vence mañana)',
          time: 'Ayer, 10:15',
          module: 'Acuerdos CTE',
          icon: <AlertTriangle size={18} />,
          colorClass: 'bg-danger'
        },
        {
          id: '5',
          type: 'planeacion',
          title: 'Planeación entregada',
          description: 'Profa. María González (3° "A") - Bloque II',
          time: 'Hace 2 días',
          module: 'Planeaciones',
          icon: <BookOpen size={18} />,
          colorClass: 'bg-primary'
        }
      ]);
      
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const today = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <RefreshCw size={32} className="text-info" style={{ animation: 'spin 1s linear infinite' }} />
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
