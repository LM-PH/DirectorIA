import React, { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../../services/horariosData';
import { Save, Clock, CalendarDays, Settings2, School, Sun, Moon } from 'lucide-react';

const ConfiguracionHorario = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const data = await getConfig();
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    if (type === 'number') parsedValue = parseInt(value, 10);
    
    setConfig(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleRecesoChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      receso: {
        ...prev.receso,
        [name]: parseInt(value, 10)
      }
    }));
  };

  const toggleDiaLaborable = (diaId) => {
    setConfig(prev => {
      const dias = [...prev.diasLaborables];
      const index = dias.indexOf(diaId);
      if (index > -1) {
        dias.splice(index, 1);
      } else {
        dias.push(diaId);
        dias.sort();
      }
      return { ...prev, diasLaborables: dias };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveConfig(config.id, config);
      alert('Configuración guardada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-indigo-600 font-medium">Cargando configuración...</p>
    </div>
  );

  const diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 0, nombre: 'Domingo' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
        
        {/* Banner Superior */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Settings2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Parámetros de la Escuela</h1>
              <p className="text-indigo-100 mt-1">Configura las reglas base antes de generar los horarios.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-10">
          
          {/* Datos Generales */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <School size={22} className="text-indigo-500" /> Datos Generales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-semibold text-slate-700">Nombre de la Escuela</label>
                <input type="text" name="escuela" value={config.escuela || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none shadow-inner" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Turno</label>
                <div className="relative">
                  <select name="turno" value={config.turno || 'Matutino'} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none shadow-inner appearance-none">
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Tiempo Completo">Tiempo Completo</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    {config.turno === 'Matutino' ? <Sun size={18} className="text-amber-500"/> : <Moon size={18} className="text-indigo-400"/>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Ciclo Escolar</label>
                <input type="text" name="cicloEscolar" value={config.cicloEscolar || ''} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none shadow-inner" placeholder="Ej. 2024-2025" required />
              </div>
            </div>
          </div>

          {/* Estructura del Día */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <Clock size={22} className="text-indigo-500" /> Estructura del Día
            </h3>
            
            <div className="bg-gradient-to-b from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Entrada</label>
                  <input type="time" name="horaEntrada" value={config.horaEntrada || ''} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-center" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Salida</label>
                  <input type="time" name="horaSalida" value={config.horaSalida || ''} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-center" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Módulos/Día</label>
                  <input type="number" name="modulosPorDia" value={config.modulosPorDia || 7} onChange={handleChange} min="1" max="15" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-center" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Minutos x Módulo</label>
                  <input type="number" name="duracionModulo" value={config.duracionModulo || 50} onChange={handleChange} min="10" max="120" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-center" required />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200/60">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Regla del Receso Escolar</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Ocurre después del Módulo:</label>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-600 font-bold">Módulo</span>
                      <input type="number" name="despuesDeModulo" value={config.receso?.despuesDeModulo || 3} onChange={handleRecesoChange} min="1" max={config.modulosPorDia - 1} className="w-24 p-3 border border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-mono text-center bg-white" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Duración del Receso:</label>
                    <div className="flex items-center gap-3">
                      <input type="number" name="duracion" value={config.receso?.duracion || 20} onChange={handleRecesoChange} min="5" max="120" className="w-24 p-3 border border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-mono text-center bg-white" required />
                      <span className="text-slate-500 font-medium">minutos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Días Laborables */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <CalendarDays size={22} className="text-indigo-500" /> Días Laborables
            </h3>
            <div className="flex flex-wrap gap-3">
              {diasSemana.map(dia => {
                const isSelected = config.diasLaborables?.includes(dia.id);
                return (
                  <button
                    key={dia.id}
                    type="button"
                    onClick={() => toggleDiaLaborable(dia.id)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                      isSelected 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 border-transparent' 
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {dia.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acción Guardar */}
          <div className="pt-8 border-t flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="group relative flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-300 overflow-hidden disabled:opacity-70"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Save size={20} className="relative z-10" />
              <span className="relative z-10">{saving ? 'Guardando...' : 'Confirmar Configuración'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ConfiguracionHorario;
