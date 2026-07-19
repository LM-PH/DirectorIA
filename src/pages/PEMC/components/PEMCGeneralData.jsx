import React from 'react';
import { Save } from 'lucide-react';

const PEMCGeneralData = ({ generalData, onChange, onSave, isSaving }) => {
  return (
    <div className="pemc-general-data">
      <div className="ambito-header">
        <h2>Datos Generales del PEMC</h2>
        <button className="btn-primary btn-sm" onClick={onSave} disabled={isSaving}>
          <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Datos'}
        </button>
      </div>
      
      <div className="form-section">
        <h3>Presentación e Identidad</h3>
        <div className="form-group">
          <label>Presentación</label>
          <textarea 
            name="presentacion"
            value={generalData.presentacion || ''}
            onChange={onChange}
            placeholder="Escribe la presentación del PEMC..."
            rows={4}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Misión</label>
            <textarea 
              name="mision"
              value={generalData.mision || ''}
              onChange={onChange}
              placeholder="Misión de la escuela..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Visión</label>
            <textarea 
              name="vision"
              value={generalData.vision || ''}
              onChange={onChange}
              placeholder="Visión de la escuela..."
              rows={3}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Decálogo de Colaboración</label>
          <textarea 
            name="decalogo"
            value={generalData.decalogo || ''}
            onChange={onChange}
            placeholder="Escribe el decálogo de colaboración..."
            rows={4}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Diagnóstico Socioeducativo</h3>
        <div className="form-group">
          <label>Contexto Externo</label>
          <textarea 
            name="diagnosticoExterno"
            value={generalData.diagnosticoExterno || ''}
            onChange={onChange}
            placeholder="Contexto externo de la escuela..."
            rows={4}
          />
        </div>
        <div className="form-group">
          <label>Contexto Interno</label>
          <textarea 
            name="diagnosticoInterno"
            value={generalData.diagnosticoInterno || ''}
            onChange={onChange}
            placeholder="Contexto interno de la escuela..."
            rows={4}
          />
        </div>
        <div className="form-group">
          <label>Diagnóstico por Disciplina</label>
          <textarea 
            name="diagnosticoDisciplina"
            value={generalData.diagnosticoDisciplina || ''}
            onChange={onChange}
            placeholder="Diagnóstico disciplinar..."
            rows={4}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Aspectos Pedagógicos</label>
            <textarea 
              name="diagnosticoPedagogico"
              value={generalData.diagnosticoPedagogico || ''}
              onChange={onChange}
              placeholder="Aspectos pedagógicos..."
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>Aspectos Socioculturales</label>
            <textarea 
              name="diagnosticoSociocultural"
              value={generalData.diagnosticoSociocultural || ''}
              onChange={onChange}
              placeholder="Aspectos socioculturales..."
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Comisiones</h3>
        <p className="text-muted text-sm mb-3">Si no usas el módulo de Comisiones, puedes anotarlas aquí libremente para que salgan en la impresión del PEMC.</p>
        <div className="form-group">
          <label>Descripción de Comisiones</label>
          <textarea 
            name="comisionesTexto"
            value={generalData.comisionesTexto || ''}
            onChange={onChange}
            placeholder="Ej. Acción Social: Profesor A, Profesora B..."
            rows={5}
          />
        </div>
      </div>
    </div>
  );
};

export default PEMCGeneralData;
