import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Target, Plus, CheckCircle, Clock, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import AccionModal from './components/AccionModal';
import './PEMC.css';

const AMBITOS = [
  'Aprovechamiento académico y asistencia de los alumnos',
  'Prácticas docentes y directivas',
  'Formación docente',
  'Avance de planes y programas educativos',
  'Participación de la comunidad',
  'Desempeño de la autoridad escolar',
  'Infraestructura y equipamiento',
  'Carga administrativa'
];

const PEMC = () => {
  const { schoolId } = useAuth();
  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accionToEdit, setAccionToEdit] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    // Listen to pemc collection
    const q = query(collection(db, 'schools', schoolId, 'pemc'), orderBy('fechaInicio', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAcciones(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching PEMC:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [schoolId]);

  const handleOpenNew = () => {
    setAccionToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (accion) => {
    setAccionToEdit(accion);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta acción del PEMC permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'schools', schoolId, 'pemc', id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const { id, ...updateData } = data;
        await updateDoc(doc(db, 'schools', schoolId, 'pemc', id), { ...updateData, updatedAt: new Date() });
      } else {
        await addDoc(collection(db, 'schools', schoolId, 'pemc'), { ...data, createdAt: new Date() });
      }
    } catch (error) {
      console.error("Error saving:", error);
      throw error;
    }
  };

  // Cálculos de progreso general
  const calculateProgress = () => {
    if (acciones.length === 0) return { percent: 0, color: 'neutral' };
    
    const totalAvance = acciones.reduce((sum, acc) => sum + (acc.avance || 0), 0);
    const avg = Math.round(totalAvance / acciones.length);
    
    let color = 'rojo'; // Menor a 50
    if (avg >= 50 && avg < 80) color = 'amarillo';
    if (avg >= 80) color = 'verde';
    
    return { percent: avg, color };
  };

  const progress = calculateProgress();
  const accionesActivas = acciones.filter(a => a.ambito === AMBITOS[activeTab]);

  return (
    <div className="module-container pemc-module">
      <div className="pemc-header">
        <div>
          <h1 className="module-title">Programa Escolar de Mejora Continua</h1>
          <p className="module-description">Planificación, seguimiento y evaluación (PEMC).</p>
        </div>
        
        {/* Semáforo y Progreso Global */}
        <div className="progress-dashboard">
          <div className="progress-info">
            <span className="progress-label">Avance General</span>
            <span className={`progress-value text-${progress.color}`}>{progress.percent}%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill bg-${progress.color}`} 
              style={{ width: `${progress.percent}%` }}
            ></div>
          </div>
          <div className="semaforo">
            <div className={`luz ${progress.color === 'rojo' ? 'activa-rojo' : ''}`}></div>
            <div className={`luz ${progress.color === 'amarillo' ? 'activa-amarillo' : ''}`}></div>
            <div className={`luz ${progress.color === 'verde' ? 'activa-verde' : ''}`}></div>
          </div>
        </div>
      </div>

      <div className="pemc-layout">
        {/* Sidebar / Tabs */}
        <div className="ambitos-sidebar">
          <h3>Ámbitos del PEMC</h3>
          <ul className="ambitos-list">
            {AMBITOS.map((ambito, index) => {
              const count = acciones.filter(a => a.ambito === ambito).length;
              return (
                <li 
                  key={index} 
                  className={`ambito-item ${activeTab === index ? 'active' : ''}`}
                  onClick={() => setActiveTab(index)}
                >
                  <span className="ambito-name">{ambito}</span>
                  {count > 0 && <span className="ambito-badge">{count}</span>}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Content Area */}
        <div className="ambito-content">
          <div className="ambito-header">
            <h2>{AMBITOS[activeTab]}</h2>
            <button className="btn-primary btn-sm" onClick={handleOpenNew}>
              <Plus size={16} /> Agregar Acción
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Cargando PEMC...</div>
          ) : accionesActivas.length === 0 ? (
            <div className="empty-state">
              <Target size={48} className="text-muted" />
              <h3>Sin acciones registradas</h3>
              <p>No hay metas ni acciones para este ámbito aún.</p>
            </div>
          ) : (
            <div className="acciones-grid">
              {accionesActivas.map(accion => (
                <div key={accion.id} className="accion-card">
                  <div className="accion-card-header">
                    <span className={`badge badge-${accion.estado.replace(' ', '-')}`}>
                      {accion.estado}
                    </span>
                    <div className="accion-actions">
                      <button className="btn-icon-small text-primary" onClick={() => handleEdit(accion)}><Edit2 size={14}/></button>
                      <button className="btn-icon-small text-error" onClick={() => handleDelete(accion.id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  
                  <div className="accion-progress">
                    <div className="progress-header">
                      <span>Avance</span>
                      <span>{accion.avance}%</span>
                    </div>
                    <div className="progress-bar-bg-small">
                      <div 
                        className="progress-bar-fill-small" 
                        style={{ 
                          width: `${accion.avance}%`,
                          backgroundColor: accion.avance === 100 ? '#10B981' : 'var(--color-primary)'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="accion-body">
                    <div className="accion-field">
                      <strong>Problemática:</strong>
                      <p>{accion.problematica}</p>
                    </div>
                    <div className="accion-field highlight">
                      <strong>Acción:</strong>
                      <p>{accion.accion}</p>
                    </div>
                    <div className="accion-meta">
                      <span><Clock size={14}/> {accion.fechaCierre || 'Sin fecha'}</span>
                      <span>Responsable: {accion.responsable}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AccionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        accionToEdit={accionToEdit}
        ambitoActivo={AMBITOS[activeTab]}
      />
    </div>
  );
};

export default PEMC;
