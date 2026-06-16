import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { getConfig, getDocentes, getGrupos, getMaterias, getEspacios, saveHorarioGenerado } from '../../services/horariosData';
import { ScheduleGenerator } from '../../services/ScheduleGenerator';
import { ScheduleValidator } from '../../services/ScheduleValidator';

const GeneradorPanel = () => {
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  // Datos precargados
  const [config, setConfig] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [espacios, setEspacios] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const conf = await getConfig();
      const doc = await getDocentes();
      const gru = await getGrupos();
      const mat = await getMaterias();
      const esp = await getEspacios();
      
      setConfig(conf);
      setDocentes(doc);
      setGrupos(gru);
      setMaterias(mat);
      setEspacios(esp);
      setDataReady(true);
    };
    fetchData();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setProgreso(10);
    setResultado(null);

    // Simular tiempo de carga/procesamiento para UI response
    await new Promise(r => setTimeout(r, 500));
    setProgreso(40);

    try {
      const generator = new ScheduleGenerator(config, docentes, grupos, materias, espacios);
      const output = generator.generar();
      
      setProgreso(70);

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
      alert('Error en el generador heurístico.');
    } finally {
      setLoading(false);
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
      alert('Horario guardado correctamente en la base de datos.');
    } catch (e) {
      console.error(e);
      alert('Error al guardar.');
    }
  };

  if (!dataReady) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando motor...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Motor de Generación</h2>
        <p className="text-slate-500 text-sm">
          El algoritmo asignará las clases respetando las reglas obligatorias y buscará optimizar la puntuación.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
          ) : (
            <Play size={20} />
          )}
          {loading ? 'Generando...' : 'Iniciar Generador Automático'}
        </button>
      </div>

      {loading && (
        <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
          <div className="bg-indigo-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }}></div>
        </div>
      )}

      {resultado && (
        <div className="mt-8 border-t pt-8 space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Resultado de Generación</h3>
              <p className="text-sm text-slate-500">Puntuación Heurística: <span className="font-bold text-indigo-600">{resultado.puntuacion} puntos</span></p>
            </div>
            
            <div className="flex items-center gap-2">
              {resultado.esValido ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  <CheckCircle size={18} /> Válido
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                  <AlertTriangle size={18} /> Inválido
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
              <h4 className="font-medium text-slate-700">Validador ({resultado.conflictos.length} Conflictos)</h4>
            </div>
            <div className="p-4 max-h-60 overflow-auto space-y-2">
              {resultado.conflictos.length === 0 ? (
                <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle size={16}/> No hay conflictos detectados.</p>
              ) : (
                resultado.conflictos.map((c, idx) => (
                  <div key={idx} className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{c.mensaje}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <Save size={18} /> Guardar y Ver Horario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneradorPanel;
