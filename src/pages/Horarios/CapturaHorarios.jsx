import React, { useState, useEffect } from 'react';
import { getDocentes, getGrupos, getMaterias, getEspacios, createDocente, createGrupo, createMateria, createEspacio, deleteDocente, deleteGrupo, deleteMateria, deleteEspacio } from '../../services/horariosData';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const CapturaHorarios = () => {
  const [activeTab, setActiveTab] = useState('docentes');
  
  const tabs = [
    { id: 'docentes', name: 'Docentes' },
    { id: 'grupos', name: 'Grupos' },
    { id: 'materias', name: 'Materias' },
    { id: 'espacios', name: 'Espacios' },
    { id: 'asignaciones', name: 'Carga Horaria / Asignaciones' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] flex">
      {/* Sidebar de Navegación de Captura */}
      <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Catálogos</h3>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-6">
        {activeTab === 'docentes' && <DocentesTab />}
        {activeTab === 'grupos' && <GruposTab />}
        {activeTab === 'materias' && <MateriasTab />}
        {activeTab === 'espacios' && <EspaciosTab />}
        {activeTab === 'asignaciones' && <AsignacionesTab />}
      </div>
    </div>
  );
};

// --- DOCENTES ---
const DocentesTab = () => {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  
  const load = async () => setItems(await getDocentes());
  useEffect(() => { load() }, []);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nombre) return;
    await createDocente({ nombre, prioridad: 'Media', restricciones: { noPrimeras: false, noUltimas: false } });
    setNombre('');
    load();
  };

  const handleDel = async (id) => {
    await deleteDocente(id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Docentes</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre del docente" className="flex-1 p-2 border rounded" required/>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Agregar</button>
      </form>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded">
            <span>{item.nombre}</span>
            <button onClick={() => handleDel(item.id)} className="text-red-500"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- GRUPOS ---
const GruposTab = () => {
  const [items, setItems] = useState([]);
  const [grado, setGrado] = useState('1');
  const [grupo, setGrupo] = useState('A');
  
  const load = async () => setItems(await getGrupos());
  useEffect(() => { load() }, []);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    await createGrupo({ grado, grupo, turno: 'Matutino' });
    load();
  };

  const handleDel = async (id) => {
    await deleteGrupo(id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Grupos</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <select value={grado} onChange={e=>setGrado(e.target.value)} className="p-2 border rounded">
          <option value="1">1ro</option><option value="2">2do</option><option value="3">3ro</option>
        </select>
        <input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Grupo (A, B, C...)" className="p-2 border rounded w-24" required/>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Agregar</button>
      </form>
      <div className="grid grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded font-bold text-slate-700">
            <span>{item.grado}° {item.grupo}</span>
            <button onClick={() => handleDel(item.id)} className="text-red-500"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MATERIAS ---
const MateriasTab = () => {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Normal');
  const [horas, setHoras] = useState(3);
  
  const load = async () => setItems(await getMaterias());
  useEffect(() => { load() }, []);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    await createMateria({ nombre, tipo, horasSemanales: Number(horas) });
    setNombre('');
    load();
  };

  const handleDel = async (id) => {
    await deleteMateria(id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Materias</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre materia" className="flex-1 p-2 border rounded" required/>
        <select value={tipo} onChange={e=>setTipo(e.target.value)} className="p-2 border rounded">
          <option value="Normal">Normal</option>
          <option value="Física">Física (Req. Doble)</option>
          <option value="Química">Química (Req. Doble)</option>
          <option value="Taller">Taller (Doble Bloque)</option>
          <option value="Educación Física">Educación Física</option>
        </select>
        <input type="number" value={horas} onChange={e=>setHoras(e.target.value)} className="w-20 p-2 border rounded" min="1" max="15" title="Horas"/>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Agregar</button>
      </form>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded">
            <div>
              <span className="font-bold block">{item.nombre}</span>
              <span className="text-xs text-slate-500">{item.horasSemanales} hrs - {item.tipo}</span>
            </div>
            <button onClick={() => handleDel(item.id)} className="text-red-500"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ESPACIOS ---
const EspaciosTab = () => {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  
  const load = async () => setItems(await getEspacios());
  useEffect(() => { load() }, []);
  
  const handleAdd = async (e) => {
    e.preventDefault();
    await createEspacio({ nombre, tipo: 'Aula' });
    setNombre('');
    load();
  };

  const handleDel = async (id) => {
    await deleteEspacio(id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Espacios (Aulas, Labs, Canchas)</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Laboratorio A" className="flex-1 p-2 border rounded" required/>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Agregar</button>
      </form>
      <div className="grid grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded">
            <span>{item.nombre}</span>
            <button onClick={() => handleDel(item.id)} className="text-red-500"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ASIGNACIONES ---
const AsignacionesTab = () => {
  return (
    <div className="text-center text-slate-500 py-20">
      <p>Vista de asignaciones (Carga Docente-Materia-Grupo).</p>
      <p className="text-sm">En una implementación completa, aquí se cruzan los catálogos.</p>
    </div>
  )
}

export default CapturaHorarios;
