import { getDocentes, getGrupos, getMaterias, getEspacios, getAsignaciones, createDocente, createGrupo, createMateria, createEspacio, createAsignacion, deleteDocente, deleteGrupo, deleteMateria, deleteEspacio, deleteAsignacion } from '../../services/horariosData';
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
        {activeTab === 'asignaciones' && <AsignacionesTab schoolId={schoolId} />}
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

// --- ASIGNACIONES ---
const AsignacionesTab = ({ schoolId }) => {
  const [items, setItems] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [espacios, setEspacios] = useState([]);

  const [form, setForm] = useState({ docenteId: '', materiaId: '', grupoId: '', espacioId: '', horas: 3 });

  const load = async () => {
    const [a, d, m, g, e] = await Promise.all([
      getAsignaciones(schoolId),
      getDocentes(schoolId),
      getMaterias(schoolId),
      getGrupos(schoolId),
      getEspacios(schoolId)
    ]);
    setItems(a); setDocentes(d); setMaterias(m); setGrupos(g); setEspacios(e);
  };

  useEffect(() => { load() }, [schoolId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.docenteId || !form.materiaId || !form.grupoId) return;
    await createAsignacion(schoolId, form);
    setForm({ docenteId: '', materiaId: '', grupoId: '', espacioId: '', horas: 3 });
    load();
  };

  const handleDel = async (id) => {
    await deleteAsignacion(schoolId, id);
    load();
  };

  const getName = (list, id) => list.find(x => x.id === id)?.nombre || list.find(x => x.id === id)?.grupo || '???';

  return (
    <div>
      <div className="tab-header">
        <div>
          <h2>Matriz de Asignaciones</h2>
          <p className="tab-header-description">Cruza Docentes, Materias y Grupos para nutrir al Motor IA.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="card config-form-grid" style={{ marginBottom: '2rem', alignItems: 'flex-end', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
          <label>Docente *</label>
          <select value={form.docenteId} onChange={e=>setForm({...form, docenteId: e.target.value})} required>
            <option value="">Selecciona...</option>
            {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
          <label>Materia *</label>
          <select value={form.materiaId} onChange={e=>{
            const mId = e.target.value;
            const mat = materias.find(x=>x.id === mId);
            setForm({...form, materiaId: mId, horas: mat ? mat.horasSemanales : 3});
          }} required>
            <option value="">Selecciona...</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
          <label>Grupo *</label>
          <select value={form.grupoId} onChange={e=>setForm({...form, grupoId: e.target.value})} required>
            <option value="">Selecciona...</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.grado}° {g.grupo}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
          <label>Espacio</label>
          <select value={form.espacioId} onChange={e=>setForm({...form, espacioId: e.target.value})}>
            <option value="">(Aula Base)</option>
            {espacios.map(esp => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
          <label>Hrs</label>
          <input type="number" value={form.horas} onChange={e=>setForm({...form, horas: Number(e.target.value)})} min="1" max="15" required/>
        </div>
        <button type="submit" className="btn-primary" style={{ marginBottom: 0 }}>
          <Plus size={18}/> Add
        </button>
      </form>

      <table className="table-modern">
        <thead>
          <tr>
            <th>Docente</th>
            <th>Materia</th>
            <th>Grupo</th>
            <th>Espacio</th>
            <th>Horas</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td style={{ fontWeight: 500 }}>{getName(docentes, item.docenteId)}</td>
              <td>{getName(materias, item.materiaId)}</td>
              <td><span className="badge badge-info">{getName(grupos, item.grupoId)}</span></td>
              <td>{item.espacioId ? getName(espacios, item.espacioId) : <span style={{color:'#94a3b8'}}>-</span>}</td>
              <td>{item.horas} HRS</td>
              <td style={{ textAlign: 'center' }}>
                <button onClick={() => handleDel(item.id)} className="btn-danger" style={{ padding: '0.4rem' }}>
                  <Trash2 size={16}/>
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>No hay asignaciones creadas.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CapturaHorarios;
