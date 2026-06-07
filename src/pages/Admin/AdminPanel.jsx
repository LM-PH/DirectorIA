import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, Clock, XCircle,
  Search, RefreshCw, BadgeDollarSign, Shield
} from 'lucide-react';
import './AdminPanel.css';

const getDetailedStatus = (user) => {
  if (user.suspendido) {
    return { label: '🚫 Suspendido', cls: 'badge-suspendido', isBlocked: true };
  }
  if (user.pagado) {
    return { label: '✅ Pagado', cls: 'badge-pagado', isBlocked: false };
  }
  
  // Calcular días de prueba restantes (7 días de prueba)
  const regTime = user.fechaRegistro?.toDate?.()?.getTime() || new Date(user.fechaRegistro).getTime() || Date.now();
  const daysDiff = (Date.now() - regTime) / (1000 * 60 * 60 * 24);
  
  if (daysDiff > 7) {
    return { label: '⏳ Prueba Expirada', cls: 'badge-expired', isBlocked: true };
  } else {
    const daysLeft = Math.max(0, Math.ceil(7 - daysDiff));
    return { label: `⏳ Prueba (${daysLeft}d restantes)`, cls: 'badge-prueba', isBlocked: false };
  }
};

const fmt = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
};

const AdminPanel = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState(null); // uid
  const [noteTemp, setNoteTemp] = useState('');

  // Protección: si no es admin, redirige
  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, '_admin_users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const ta = a.fechaRegistro?.toDate?.() || new Date(0);
        const tb = b.fechaRegistro?.toDate?.() || new Date(0);
        return tb - ta; // más recientes primero
      });
      setUsers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [isAdmin]);

  const handleTogglePagado = async (user) => {
    await updateDoc(doc(db, '_admin_users', user.id), {
      pagado: !user.pagado,
    });
  };

  const handleToggleSuspendido = async (user) => {
    await updateDoc(doc(db, '_admin_users', user.id), {
      suspendido: !user.suspendido,
    });
  };

  const handleSaveNote = async (uid) => {
    await updateDoc(doc(db, '_admin_users', uid), { notas: noteTemp });
    setEditingNote(null);
  };

  const filtered = users.filter(u =>
    u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPagados = users.filter(u => u.pagado && !u.suspendido).length;
  const totalPrueba  = users.filter(u => !u.pagado && !u.suspendido).length;
  const totalSuspendidos = users.filter(u => u.suspendido).length;

  if (!isAdmin) return null;

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <Shield size={22} />
            <h1>Director<span>IA</span> <small>Admin</small></h1>
          </div>
          <p>Panel de control exclusivo para el administrador del sistema.</p>
        </div>
        <div className="admin-header-right">
          <button onClick={() => navigate('/')} className="admin-btn-back">
            Ir a la App
          </button>
          <span className="admin-email-badge">{currentUser?.email}</span>
        </div>
      </header>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card total">
          <Users size={28} />
          <div>
            <span className="stat-num">{users.length}</span>
            <span className="stat-label">Total registrados</span>
          </div>
        </div>
        <div className="stat-card pagado">
          <CheckCircle size={28} />
          <div>
            <span className="stat-num">{totalPagados}</span>
            <span className="stat-label">Activos / Pagaron</span>
          </div>
        </div>
        <div className="stat-card prueba">
          <Clock size={28} />
          <div>
            <span className="stat-num">{totalPrueba}</span>
            <span className="stat-label">Prueba activa</span>
          </div>
        </div>
        <div className="stat-card suspendido" style={{ borderLeft: '4px solid #ef4444' }}>
          <XCircle size={28} style={{ color: '#ef4444' }} />
          <div>
            <span className="stat-num">{totalSuspendidos}</span>
            <span className="stat-label">Suspendidos</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search-bar">
        <Search size={18} />
        <input
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">
          <RefreshCw size={28} className="spin" />
          <p>Cargando directores registrados...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Director(a)</th>
                <th>Correo</th>
                <th>Registro</th>
                <th>Último acceso</th>
                <th>Estado</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>
                    No hay directores registrados aún.
                  </td>
                </tr>
              ) : filtered.map(u => {
                const status = getDetailedStatus(u);
                const rowCls = u.suspendido 
                  ? 'row-suspendido' 
                  : status.label === '⏳ Prueba Expirada' 
                  ? 'row-expired' 
                  : u.pagado 
                  ? 'row-pagado' 
                  : '';
                return (
                  <tr key={u.id} className={rowCls}>
                    {/* Avatar + Nombre */}
                    <td>
                      <div className="user-cell">
                        {u.fotoUrl
                          ? <img src={u.fotoUrl} alt="" className="user-avatar" />
                          : <div className="user-avatar-initials">{(u.nombre || u.email || '?').charAt(0).toUpperCase()}</div>
                        }
                        <span>{u.nombre || '—'}</span>
                      </div>
                    </td>
                    <td className="email-cell">{u.email}</td>
                    <td>{fmt(u.fechaRegistro)}</td>
                    <td>{fmt(u.ultimoAcceso)}</td>

                    {/* Estado */}
                    <td>
                      <span className={`estado-badge ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* Notas */}
                    <td className="notes-cell">
                      {editingNote === u.id ? (
                        <div className="note-edit">
                          <input
                            autoFocus
                            value={noteTemp}
                            onChange={e => setNoteTemp(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveNote(u.id)}
                            placeholder="Ej. Pagó 15 jun, cobrar jul..."
                          />
                          <button className="note-save" onClick={() => handleSaveNote(u.id)}>✓</button>
                          <button className="note-cancel" onClick={() => setEditingNote(null)}>✕</button>
                        </div>
                      ) : (
                        <span
                          className="note-text"
                          onClick={() => { setEditingNote(u.id); setNoteTemp(u.notas || ''); }}
                          title="Clic para editar nota"
                        >
                          {u.notas || <em style={{color:'#94a3b8'}}>+ agregar nota</em>}
                        </span>
                      )}
                    </td>

                    {/* Acción */}
                    <td>
                      <div className="actions-cell">
                        <button
                          className={`toggle-paid-btn ${u.pagado ? 'unpay' : 'pay'}`}
                          onClick={() => handleTogglePagado(u)}
                          title={u.pagado ? "Quitar estado de pago" : "Registrar pago único"}
                        >
                          {u.pagado ? <><XCircle size={14}/> Sin Pago</> : <><BadgeDollarSign size={14}/> Pagado</>}
                        </button>
                        
                        <button
                          className={`toggle-suspend-btn ${u.suspendido ? 'unsuspend' : 'suspend'}`}
                          onClick={() => handleToggleSuspendido(u)}
                          title={u.suspendido ? "Habilitar acceso" : "Suspender acceso"}
                        >
                          {u.suspendido ? <><CheckCircle size={14}/> Activar</> : <><XCircle size={14}/> Suspender</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
