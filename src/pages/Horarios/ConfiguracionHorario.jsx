import React, { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../../services/horariosData';
import { Save, Clock, CalendarDays, Settings2 } from 'lucide-react';

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

  if (loading || !config) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;

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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <Settings2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración Escolar</h1>
          <p className="text-slate-500">Parámetros base para la generación de horarios</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre de la Escuela</label>
            <input type="text" name="escuela" value={config.escuela || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Turno</label>
            <select name="turno" value={config.turno || 'Matutino'} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none">
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Tiempo Completo">Tiempo Completo</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ciclo Escolar</label>
            <input type="text" name="cicloEscolar" value={config.cicloEscolar || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="Ej. 2024-2025" required />
          </div>
        </div>

        {/* Estructura del Día */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" /> 
            Estructura del Día
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora de Entrada</label>
              <input type="time" name="horaEntrada" value={config.horaEntrada || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora de Salida</label>
              <input type="time" name="horaSalida" value={config.horaSalida || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Módulos por Día</label>
              <input type="number" name="modulosPorDia" value={config.modulosPorDia || 7} onChange={handleChange} min="1" max="15" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Duración Módulo (min)</label>
              <input type="number" name="duracionModulo" value={config.duracionModulo || 50} onChange={handleChange} min="10" max="120" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none" required />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Configuración de Receso</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">El receso ocurre después del módulo:</label>
                <input type="number" name="despuesDeModulo" value={config.receso?.despuesDeModulo || 3} onChange={handleRecesoChange} min="1" max={config.modulosPorDia - 1} className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Duración del Receso (min):</label>
                <input type="number" name="duracion" value={config.receso?.duracion || 20} onChange={handleRecesoChange} min="5" max="120" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none" required />
              </div>
            </div>
          </div>
        </div>

        {/* Días Laborables */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <CalendarDays size={20} className="text-indigo-500" />
            Días Laborables
          </h3>
          <div className="flex flex-wrap gap-3">
            {diasSemana.map(dia => {
              const isSelected = config.diasLaborables?.includes(dia.id);
              return (
                <button
                  key={dia.id}
                  type="button"
                  onClick={() => toggleDiaLaborable(dia.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dia.nombre}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ConfiguracionHorario;
