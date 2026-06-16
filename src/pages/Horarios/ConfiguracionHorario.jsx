import React, { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../../services/horariosData';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Settings2 } from 'lucide-react';

const ConfiguracionHorario = () => {
  const { schoolId } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const data = await getConfig(schoolId);
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
      await saveConfig(schoolId, config.id, config);
      alert('Configuración guardada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-primary)' }}>
      Cargando configuración...
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
    <div>
      <div className="tab-header">
        <div>
          <h2><Settings2 size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }}/> Parámetros de la Escuela</h2>
          <p className="tab-header-description">Configura las reglas base antes de generar los horarios.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>

      <form className="card" onSubmit={handleSave} style={{ marginBottom: '2rem' }}>
        <h3 className="module-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Datos Generales</h3>
        
        <div className="config-form-grid">
          <div className="form-group">
            <label>Nombre de la Escuela</label>
            <input type="text" name="escuela" value={config.escuela || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Turno</label>
            <select name="turno" value={config.turno || 'Matutino'} onChange={handleChange}>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Tiempo Completo">Tiempo Completo</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>Ciclo Escolar</label>
            <input type="text" name="cicloEscolar" value={config.cicloEscolar || ''} onChange={handleChange} placeholder="Ej. 2024-2025" required style={{ maxWidth: '300px' }}/>
          </div>
        </div>

        <h3 className="module-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', marginTop: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Estructura del Día</h3>
        
        <div className="config-form-grid">
          <div className="form-group">
            <label>Hora de Entrada</label>
            <input type="time" name="horaEntrada" value={config.horaEntrada || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Hora de Salida</label>
            <input type="time" name="horaSalida" value={config.horaSalida || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Módulos por Día</label>
            <input type="number" name="modulosPorDia" value={config.modulosPorDia || 7} onChange={handleChange} min="1" max="15" required />
          </div>
          <div className="form-group">
            <label>Duración del Módulo (minutos)</label>
            <input type="number" name="duracionModulo" value={config.duracionModulo || 50} onChange={handleChange} min="10" max="120" required />
          </div>
        </div>

        <h3 className="module-title" style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Regla del Receso Escolar</h3>
        <div className="config-form-grid" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Ocurre después del Módulo:</label>
            <input type="number" name="despuesDeModulo" value={config.receso?.despuesDeModulo || 3} onChange={handleRecesoChange} min="1" max={config.modulosPorDia - 1} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Duración del Receso (minutos):</label>
            <input type="number" name="duracion" value={config.receso?.duracion || 20} onChange={handleRecesoChange} min="5" max="120" required />
          </div>
        </div>

        <h3 className="module-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', marginTop: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Días Laborables</h3>
        <div className="form-group full-width">
          <div className="checkbox-group-days">
            {diasSemana.map(dia => {
              const isSelected = config.diasLaborables?.includes(dia.id);
              return (
                <label key={dia.id} className="checkbox-day-label">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDiaLaborable(dia.id)}
                    style={{ width: 'auto' }}
                  />
                  <span>{dia.nombre}</span>
                </label>
              );
            })}
          </div>
        </div>

      </form>
    </div>
  );
};

export default ConfiguracionHorario;
