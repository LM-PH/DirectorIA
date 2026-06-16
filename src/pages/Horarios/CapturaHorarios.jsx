import React, { useState, useEffect } from 'react';
import { getDocentes, getGrupos, getMaterias, getEspacios, createDocente, createGrupo, createMateria, createEspacio, deleteDocente, deleteGrupo, deleteMateria, deleteEspacio } from '../../services/horariosData';
import { Plus, Trash2, Users, BookOpen, MapPin, Grid, Layers, Sparkles } from 'lucide-react';

const CapturaHorarios = () => {
  const [activeTab, setActiveTab] = useState('docentes');
  
  const tabs = [
    { id: 'docentes', name: 'Docentes', icon: Users },
    { id: 'grupos', name: 'Grupos', icon: Grid },
    { id: 'materias', name: 'Materias', icon: BookOpen },
    { id: 'espacios', name: 'Espacios', icon: MapPin },
    { id: 'asignaciones', name: 'Carga Horaria', icon: Layers }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 min-h-[700px] flex overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-72 bg-gradient-to-b from-slate-50 to-slate-100/50 border-r border-slate-200 p-6 flex flex-col">
        <div className="mb-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-2">Administración</h3>
          <p className="text-xl font-bold text-slate-800 px-4">Catálogos</p>
        </div>
        
        <div className="space-y-2 flex-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive 
                  ? 'bg-white text-indigo-600 shadow-sm shadow-indigo-100 border border-indigo-50/50 scale-100' 
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 scale-95 hover:scale-100 border border-transparent'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
                {tab.name}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
        
        <div className="mt-auto p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-800 font-bold mb-1">
            <Sparkles size={16} className="text-indigo-500" /> Tips
          </div>
          <p className="text-xs text-indigo-600 font-medium">Registra todos los datos antes de pasar al motor generador para evitar conflictos.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white p-8 relative overflow-auto custom-scrollbar">
        <div className="max-w-4xl animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === 'docentes' && <DocentesTab />}
          {activeTab === 'grupos' && <GruposTab />}
          {activeTab === 'materias' && <MateriasTab />}
          {activeTab === 'espacios' && <EspaciosTab />}
          {activeTab === 'asignaciones' && <AsignacionesTab />}
        </div>
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
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b pb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={28} /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Directorio de Docentes</h2>
          <p className="text-slate-500 text-sm">Gestiona el personal docente de la escuela.</p>
        </div>
      </div>
      
      <form onSubmit={handleAdd} className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
        <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre completo del docente..." className="flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" required/>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all transform hover:scale-105">
          <Plus size={18}/> Agregar
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className="group flex justify-between items-center p-4 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 rounded-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold uppercase border border-blue-200">
                {item.nombre.charAt(0)}
              </div>
              <span className="font-bold text-slate-700">{item.nombre}</span>
            </div>
            <button onClick={() => handleDel(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={18}/>
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-400 italic col-span-2 text-center py-8">No hay docentes registrados.</p>}
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
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b pb-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Grid size={28} /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Grupos Escolares</h2>
          <p className="text-slate-500 text-sm">Organización de grados y secciones.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
        <select value={grado} onChange={e=>setGrado(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 w-32">
          <option value="1">1er Grado</option><option value="2">2do Grado</option><option value="3">3er Grado</option>
        </select>
        <input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Letra (A, B...)" className="p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 w-32 text-center" required/>
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all transform hover:scale-105 ml-auto">
          <Plus size={18}/> Agregar Grupo
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.id} className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden border border-emerald-400">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{item.grado}°{item.grupo}</span>
              <span className="text-emerald-100 text-xs font-bold mt-1 tracking-widest uppercase">{item.turno}</span>
            </div>
            <button onClick={() => handleDel(item.id)} className="absolute top-2 right-2 text-white/50 hover:text-white hover:bg-black/20 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={16}/>
            </button>
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

  const getBadgeColor = (tipo) => {
    if (tipo.includes('Física') || tipo.includes('Química')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (tipo.includes('Taller')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b pb-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><BookOpen size={28} /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Catálogo de Materias</h2>
          <p className="text-slate-500 text-sm">Define las asignaturas y sus reglas de bloques especiales.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
        <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre materia..." className="flex-[2] min-w-[200px] p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700" required/>
        <select value={tipo} onChange={e=>setTipo(e.target.value)} className="flex-1 min-w-[150px] p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-slate-700">
          <option value="Normal">Normal</option>
          <option value="Física">Física (Req. Doble)</option>
          <option value="Química">Química (Req. Doble)</option>
          <option value="Taller">Taller (Doble Bloque)</option>
          <option value="Educación Física">Educación Física</option>
        </select>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 focus-within:ring-4 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all">
          <span className="text-xs font-bold text-slate-400">HRS</span>
          <input type="number" value={horas} onChange={e=>setHoras(e.target.value)} className="w-12 py-3 bg-transparent outline-none font-bold text-slate-700 text-center" min="1" max="15"/>
        </div>
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-200 transition-all transform hover:scale-105">
          <Plus size={18}/> Add
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className="group flex justify-between items-center p-4 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 rounded-2xl transition-all">
            <div>
              <span className="font-bold text-slate-800 block text-lg">{item.nombre}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{item.horasSemanales} HRS</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getBadgeColor(item.tipo)}`}>{item.tipo}</span>
              </div>
            </div>
            <button onClick={() => handleDel(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={18}/>
            </button>
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
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b pb-4">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><MapPin size={28} /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Espacios Físicos</h2>
          <p className="text-slate-500 text-sm">Carga las aulas, laboratorios y canchas disponibles.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
        <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Laboratorio de Cómputo B..." className="flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-medium text-slate-700" required/>
        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-200 transition-all transform hover:scale-105">
          <Plus size={18}/> Agregar
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="group relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3">
              <MapPin size={24} />
            </div>
            <span className="font-bold text-slate-700">{item.nombre}</span>
            <button onClick={() => handleDel(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ASIGNACIONES ---
const AsignacionesTab = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Layers size={40} className="text-indigo-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Matriz de Asignaciones</h2>
      <p className="text-slate-500 max-w-md font-medium">
        Aquí se cruzarán Docentes ↔ Materias ↔ Grupos.<br/><br/>
        <span className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg inline-block">Esta vista compleja está en desarrollo.</span>
      </p>
    </div>
  )
}

export default CapturaHorarios;
