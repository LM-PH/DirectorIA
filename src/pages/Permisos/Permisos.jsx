import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, List, Calendar as CalendarIcon, AlertTriangle, ShieldAlert } from 'lucide-react';
import PermisoModal from './components/PermisoModal';
import ListaPermisos from './components/ListaPermisos';
import CalendarioPermisos from './components/CalendarioPermisos';
import PermisoPrint from './components/PermisoPrint';
import { useAlert } from '../../contexts/AlertContext';
import './Permisos.css';

// Helper: Get ISO Week number
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
};

const Permisos = () => {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permisoToEdit, setPermisoToEdit] = useState(null);
  
  const [alertas, setAlertas] = useState([]);
  
  const [permisoToPrint, setPermisoToPrint] = useState(null);
  const printRef = useRef(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    const q = query(collection(db, 'permisos'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPermisos(data);
      analizarAlertas(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching permisos:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (permisoToPrint) {
      setTimeout(() => {
        window.print();
        setPermisoToPrint(null);
      }, 100);
    }
  }, [permisoToPrint]);

  const analizarAlertas = (data) => {
    // Solo contar pendientes y autorizados (ignorar rechazados)
    const activos = data.filter(p => p.estado !== 'rechazado');
    
    const agrupadosPorFecha = {};
    const agrupadosPorSemana = {};

    activos.forEach(p => {
      // Por fecha
      if (!agrupadosPorFecha[p.fecha]) agrupadosPorFecha[p.fecha] = [];
      agrupadosPorFecha[p.fecha].push(p);

      // Por semana (usando año y numero de semana)
      const d = new Date(`${p.fecha}T12:00:00`);
      const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
      if (!agrupadosPorSemana[weekKey]) agrupadosPorSemana[weekKey] = [];
      agrupadosPorSemana[weekKey].push(p);
    });

    const nuevasAlertas = [];

    // Análisis diario
    for (const [fecha, lista] of Object.entries(agrupadosPorFecha)) {
      if (lista.length > 3) {
        nuevasAlertas.push({
          id: `dia-${fecha}`,
          tipo: 'critical',
          mensaje: `¡Alerta! Hay ${lista.length} permisos solicitados para el día ${fecha}.`
        });
      }

      // Análisis por función en el mismo día
      const porFuncion = {};
      lista.forEach(p => {
        porFuncion[p.funcion] = (porFuncion[p.funcion] || 0) + 1;
      });

      for (const [funcion, qty] of Object.entries(porFuncion)) {
        if (qty >= 2) {
          nuevasAlertas.push({
            id: `func-${fecha}-${funcion}`,
            tipo: 'warning',
            mensaje: `Cuidado: Hay ${qty} permisos de personal "${funcion}" el día ${fecha}.`
          });
        }
      }
    }

    // Análisis semanal
    for (const [week, lista] of Object.entries(agrupadosPorSemana)) {
      if (lista.length > 5) {
        nuevasAlertas.push({
          id: `week-${week}`,
          tipo: 'warning',
          mensaje: `Atención: La semana ${week} tiene una alta saturación (${lista.length} permisos en total).`
        });
      }
    }

    setAlertas(nuevasAlertas);
  };

  const handleOpenNew = () => {
    setPermisoToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (permiso) => {
    setPermisoToEdit(permiso);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta solicitud definitivamente?')) {
      try {
        await deleteDoc(doc(db, 'permisos', id));
        showAlert('Solicitud eliminada.', 'success');
      } catch (error) {
        if (error.code === 'permission-denied') showAlert('Error: Permisos insuficientes. Inicia sesión.', 'error');
        else showAlert('Error al eliminar.', 'error');
      }
    }
  };

  const handleChangeStatus = async (permiso, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'permisos', permiso.id), { estado: nuevoEstado, updatedAt: new Date() });
      showAlert(`Estado actualizado a ${nuevoEstado}.`, 'success');
    } catch (error) {
      if (error.code === 'permission-denied') showAlert('Error: Permisos insuficientes. Inicia sesión.', 'error');
      else showAlert('Error al actualizar estado.', 'error');
    }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const { id, ...updateData } = data;
        await updateDoc(doc(db, 'permisos', id), { ...updateData, updatedAt: new Date() });
        showAlert('Permiso actualizado.', 'success');
      } else {
        await addDoc(collection(db, 'permisos'), { ...data, createdAt: new Date() });
        showAlert('Permiso creado correctamente.', 'success');
      }
      setIsModalOpen(false); // asumiendo que cerramos el modal aqui si todo va bien
    } catch (error) {
      if (error.code === 'permission-denied') showAlert('Error de seguridad: Permisos insuficientes. Inicia sesión.', 'error');
      else showAlert('Error al guardar el permiso.', 'error');
    }
  };

  const handlePrint = (permiso) => {
    setPermisoToPrint(permiso);
  };

  return (
    <div className="module-container permisos-module">
      <div className="permisos-header">
        <div>
          <h1 className="module-title">Permisos Económicos</h1>
          <p className="module-description">Administra y autoriza las ausencias del personal.</p>
        </div>
        
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={18} />
            </button>
          </div>
          <button className="btn-primary" onClick={handleOpenNew}>
            <Plus size={18} /> Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Alertas Inteligentes */}
      {alertas.length > 0 && (
        <div className="alertas-panel">
          <div className="alertas-header">
            <ShieldAlert size={20} />
            <h3>Advertencias del Sistema</h3>
          </div>
          <ul className="alertas-list">
            {alertas.map(a => (
              <li key={a.id} className={`alerta-item alerta-${a.tipo}`}>
                <AlertTriangle size={16} />
                <span>{a.mensaje}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Cargando solicitudes...</div>
      ) : (
        <div className="permisos-content">
          {viewMode === 'list' ? (
            <ListaPermisos 
              permisos={permisos} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onChangeStatus={handleChangeStatus}
              onPrint={handlePrint}
            />
          ) : (
            <CalendarioPermisos permisos={permisos} />
          )}
        </div>
      )}

      <PermisoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        permisoToEdit={permisoToEdit}
      />

      <PermisoPrint ref={printRef} permiso={permisoToPrint} />
    </div>
  );
};

export default Permisos;
