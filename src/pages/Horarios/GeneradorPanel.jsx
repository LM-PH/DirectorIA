import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle, CheckCircle, Save, Cpu, Zap, BarChart2, ShieldCheck, ServerCrash } from 'lucide-react';
import { getConfig, getDocentes, getGrupos, getMaterias, getEspacios, saveHorarioGenerado } from '../../services/horariosData';
import { ScheduleGenerator } from '../../services/ScheduleGenerator';
import { ScheduleValidator } from '../../services/ScheduleValidator';

const GeneradorPanel = () => {
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  const [config, setConfig] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [espacios, setEspacios] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const conf = await getConfig();
      setConfig(conf);
      setDocentes(await getDocentes());
      setGrupos(await getGrupos());
      setMaterias(await getMaterias());
      setEspacios(await getEspacios());
      setDataReady(true);
    };
    fetchData();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setProgreso(10);
    setResultado(null);

    await new Promise(r => setTimeout(r, 800)); // Animación
    setProgreso(40);

    try {
      const generator = new ScheduleGenerator(config, docentes, grupos, materias, espacios);
      const output = generator.generar();
      
      setProgreso(75);
      await new Promise(r => setTimeout(r, 600)); // Animación validación

      const validator = new ScheduleValidator(config, output.horario, docentes, grupos, espacios);
      const validacion = validator.validar();

      setProgreso(100);
      setResultado({
        ...output,
        esValido: validacion.esValido,
        conflictos: [...output.conflictos, ...validacion.conflictos]
      });

    } catch (err) {
      console.error(err);
      alert('Error crítico en el motor heurístico.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleSave = async () => {
    if (!resultado) return;
    try {
      await saveHorarioGenerado({
        fecha: new Date().toISOString(),
        puntuacion: resultado.puntuacion,
        horario: resultado.horario,
        esValido: resultado.esValido
      });
      alert('¡Horario guardado en la base de datos con éxito!');
    } catch (e) {
      console.error(e);
      alert('Error al guardar.');
    }
  };

  if (!dataReady) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-indigo-600 font-bold tracking-widest uppercase text-sm animate-pulse">Inicializando Motor Neuronal...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      
      <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-200/40 border border-slate-100 overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
        
        <div className="p-10 text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-300 transform rotate-3 hover:rotate-0 transition-all duration-500 mb-6">
            <Cpu size={48} className="text-white" />
          </div>
          
          <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Motor Generador IA</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            El algoritmo procesará <span className="font-bold text-indigo-600">{grupos.length}</span> grupos y <span className="font-bold text-indigo-600">{docentes.length}</span> docentes buscando la permutación óptima, respetando restricciones de módulos dobles, talleres y recesos.
          </p>

          <div className="mt-12">
            {!loading && !resultado && (
              <button
                onClick={handleGenerate}
                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-slate-900 hover:bg-black text-white text-lg font-black rounded-2xl transition-all shadow-xl shadow-slate-400 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Zap size={24} className="text-amber-400 relative z-10 animate-pulse" />
                <span className="relative z-10">Iniciación Cuántica (Generar)</span>
              </button>
            )}

            {loading && (
              <div className="max-w-md mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                <div className="flex justify-between text-sm font-bold text-slate-600 mb-3">
                  <span>Procesando Heurística...</span>
                  <span className="text-indigo-600">{progreso}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out relative" style={{ width: `${progreso}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_1s_infinite]"></div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest">{progreso < 50 ? 'Asignando Bloques Fijos...' : progreso < 80 ? 'Optimizando Huecos...' : 'Validando Conflictos...'}</p>
              </div>
            )}
          </div>
        </div>

        {/* RESULTADOS */}
        {resultado && !loading && (
          <div className="bg-slate-50 border-t border-slate-200 p-8 animate-in slide-in-from-bottom-8 duration-700">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Score Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center border-4 border-indigo-100">
                  <BarChart2 size={28} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Puntuación Total</p>
                  <p className="text-4xl font-black text-indigo-600">{resultado.puntuacion}</p>
                </div>
              </div>

              {/* Status Card */}
              <div className={`bg-white rounded-2xl p-6 border shadow-sm flex items-center gap-6 ${resultado.esValido ? 'border-emerald-200' : 'border-red-200'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${resultado.esValido ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  {resultado.esValido ? <ShieldCheck size={28} className="text-emerald-600" /> : <ServerCrash size={28} className="text-red-600" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Estado del Horario</p>
                  <p className={`text-3xl font-black ${resultado.esValido ? 'text-emerald-600' : 'text-red-600'}`}>
                    {resultado.esValido ? 'Válido' : 'Inválido'}
                  </p>
                </div>
              </div>
            </div>

            {/* Conflictos Log */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle size={18} className={resultado.conflictos.length > 0 ? "text-amber-400" : "text-slate-500"} />
                  Log del Validador
                </h4>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {resultado.conflictos.length} Alertas
                </span>
              </div>
              <div className="p-6 max-h-72 overflow-auto custom-scrollbar space-y-3 bg-slate-800 text-slate-300 font-mono text-sm">
                {resultado.conflictos.length === 0 ? (
                  <p className="text-emerald-400 flex items-center gap-2"><CheckCircle size={16}/> [SYS] 0 conflictos detectados. Validación superada.</p>
                ) : (
                  resultado.conflictos.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                      <span className="text-red-400 mt-0.5">[ERROR]</span>
                      <span className="text-slate-300">{c.mensaje}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-8 gap-4">
              <button 
                onClick={handleGenerate}
                className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm"
              >
                Regenerar
              </button>
              <button 
                onClick={handleSave}
                disabled={!resultado.esValido && resultado.conflictos.length > 0} // Si se desea obligar
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} /> Aprobar y Guardar
              </button>
            </div>

          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
};

export default GeneradorPanel;
