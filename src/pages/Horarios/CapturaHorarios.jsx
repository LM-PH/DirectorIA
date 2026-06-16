import React, { useState, useEffect } from 'react';
import { getDocentes, getGrupos, getMaterias, getEspacios, createDocente, createGrupo, createMateria, createEspacio, deleteDocente, deleteGrupo, deleteMateria, deleteEspacio } from '../../services/horariosData';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Users, BookOpen, MapPin, Grid, Layers } from 'lucide-react';
import './Horarios.css';

const CapturaHorarios = () => {
  const { schoolId } = useAuth();
  const [activeTab, setActiveTab] = useState('docentes');
  
  const tabs = [
    { id: 'docentes', name: 'Docentes', icon: Users },
    { id: 'grupos', name: 'Grupos', icon: Grid },
    { id: 'materias', name: 'Materias', icon: BookOpen },
    { id: 'espacios', name: 'Espacios', icon: MapPin },
    { id: 'asignaciones', name: 'Carga Horaria', icon: Layers }
  ];

  return (
    <div className="horarios-layout module-container">
      <div className="horarios-tabs-sidebar card">
        <h3 style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Catálogos</h3>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`horarios-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              {tab.name}
            </button>
          );
        })}
      </div>
      <div className="horarios-content-area">
        {activeTab === 'docentes' && <DocentesTab schoolId={schoolId} />}
        {activeTab === 'grupos' && <GruposTab schoolId={schoolId} />}
        {activeTab === 'materias' && <MateriasTab schoolId={schoolId} />}
        {activeTab === 'espacios' && <EspaciosTab schoolId={schoolId} />}
        {activeTab === 'asignaciones' && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)' }}>
            <Layers size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--color-primary)' }}>Matriz de Asignaciones</h2>
            <p>Aquí se cruzarán Docentes ↔ Materias ↔ Grupos en la próxima actualización.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- DOCENTES ---
const DocentesTab = ({ schoolId }) => {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  
  const load = async () => setItems(await getDocentes(schoolId));
  useEffect(() => { load() }, [schoolId]);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nombre) return;
    await createDocente(schoolId, { nombre, prioridad: 'Media', restricciones: { noPrimeras: false, noUltimas: false } });
    setNombre('');
    load();
  };

  const handleDel = async (id) => {
    await deleteDocente(schoolId, id);
    load();
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h2>Directorio de Docentes</h2>
          <p className="tab-header-description">Gestiona el personal docente de la escuela.</p>
        </div>
      </div>
      
      <form onSubmit={handleAdd} className="card" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Nombre del Docente</label>
          <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Juan Pérez..." required/>
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={18}/> Agregar
        </button>
      </form>

      <table className="table-modern">
        <thead>
          <tr>
            <th>Nombre</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td style={{ fontWeight: 500 }}>{item.nombre}</td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => handleDel(item.id)} className="btn-danger" style={{ padding: '0.4rem' }}>
                  <Trash2 size={16}/>
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>No hay docentes registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- GRUPOS ---
const GruposTab = ({ schoolId }) => {
  const [items, setItems] = useState([]);
  const [grado, setGrado] = useState('1');
  const [grupo, setGrupo] = useState('A');
  
  const load = async () => setItems(await getGrupos(schoolId));
  useEffect(() => { load() }, [schoolId]);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    await createGrupo(schoolId, { grado, grupo, turno: 'Matutino' });
    load();
  };

  const handleDel = async (id) => {
    await deleteGrupo(schoolId, id);
    load();
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h2>Grupos Escolares</h2>
          <p className="tab-header-description">Organización de grados y secciones.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="card" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Grado</label>
          <select value={grado} onChange={e=>setGrado(e.target.value)}>
            <option value="1">1er Grado</option><option value="2">2do Grado</option><option value="3">3er Grado</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Grupo / Sección</label>
          <input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Letra (A, B...)" required style={{ width: '150px' }}/>
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={18}/> Agregar Grupo
        </button>
      </form>

      <table className="table-modern">
        <thead>
          <tr>
            <th>Grado</th>
            <th>Grupo</th>
            <th>Turno</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td style={{ fontWeight: 600 }}>{item.grado}°</td>
              <td style={{ fontWeight: 600 }}>{item.grupo}</td>
              <td><span className="badge badge-info">{item.turno}</span></td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => handleDel(item.id)} className="btn-danger" style={{ padding: '0.4rem' }}>
                  <Trash2 size={16}/>
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>No hay grupos registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- MATERIAS ---
const MateriasTab = ({ schoolId }) => {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Normal');
  const [horas, setHoras] = useState(3);
  
  const load = async () => setItems(await getMaterias(schoolId));
  useEffect(() => { load() }, [schoolId]);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    await createMateria(schoolId, { nombre, tipo, horasSemanales: Number(horas) });
    setNombre('');
    load();
  };

  const handleDel = async (id) => {
    await deleteMateria(schoolId, id);
    load();
  }

  const getBadgeClass = (tipo) => {
    if (!tipo) return 'badge-neutral';
    if (tipo.includes('Física') || tipo.includes('Química')) return 'badge-error';
    if (tipo.includes('Taller')) return 'badge-warning';
    return 'badge-neutral';
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h2>Catálogo de Materias</h2>
          <p className="tab-header-description">Define las asignaturas y sus reglas de bloques especiales.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="card config-form-grid" style={{ marginBottom: '2rem', alignItems: 'flex-end', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
          <label>Nombre de Materia</label>
          <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Matemáticas" required/>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
          <label>Tipo / Restricción</label>
          <select value={tipo} onChange={e=>setTipo(e.target.value)}>
            <option value="Normal">Normal</option>
            <option value="Física">Física (Req. Doble)</option>
            <option value="Química">Química (Req. Doble)</option>
            <option value="Taller">Taller (Doble Bloque)</option>
            <option value="Educación Física">Educación Física</option>
          </select>
        </div>
        <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
          <label>Horas</label>
          <input type="number" value={horas} onChange={e=>setHoras(e.target.value)} min="1" max="15" required/>
        </div>
        <button type="submit" className="btn-primary" style={{ marginBottom: 0 }}>
          <Plus size={18}/> Add
        </button>
      </form>

      <table className="table-modern">
        <thead>
          <tr>
            <th>Materia</th>
            <th>Tipo</th>
            <th>Horas Semanales</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td style={{ fontWeight: 500 }}>{item.nombre}</td>
              <td><span className={`badge ${getBadgeClass(item.tipo)}`}>{item.tipo}</span></td>
              <td>{item.horasSemanales} HRS</td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => handleDel(item.id)} className="btn-danger" style={{ padding: '0.4rem' }}>
                  <Trash2 size={16}/>
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>No hay materias registradas.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- ESPACIOS ---
const EspaciosTab = ({ schoolId }) => {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  
  const load = async () => setItems(await getEspacios(schoolId));
  useEffect(() => { load() }, [schoolId]);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    await createEspacio(schoolId, { nombre, tipo: 'Aula' });
    setNombre('');
    load();
  };

  const handleDel = async (id) => {
    await deleteEspacio(schoolId, id);
    load();
  }

  return (
    <div>
      <div className="tab-header">
        <div>
          <h2>Espacios Físicos</h2>
          <p className="tab-header-description">Aulas, laboratorios y canchas disponibles.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="card" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Nombre del Espacio</label>
          <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Laboratorio de Cómputo B..." required/>
        </div>
        <button type="submit" className="btn-primary">
          <Plus size={18}/> Agregar
        </button>
      </form>

      <table className="table-modern">
        <thead>
          <tr>
            <th>Espacio</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td style={{ fontWeight: 500 }}>{item.nombre}</td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => handleDel(item.id)} className="btn-danger" style={{ padding: '0.4rem' }}>
                  <Trash2 size={16}/>
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>No hay espacios registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CapturaHorarios;
