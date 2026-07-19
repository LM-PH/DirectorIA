import React, { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import './PEMCPrintView.css';

const PEMCPrintView = ({ acciones, generalData, onClose, ambitos }) => {
  useEffect(() => {
    // Optionally open print dialog automatically
    // window.print();
  }, []);

  const renderText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <p key={index} style={{marginBottom: '0.5rem', textAlign: 'justify'}}>{line}</p>
    ));
  };

  return (
    <div className="pemc-print-wrapper">
      <div className="print-controls no-print">
        <button className="btn-secondary btn-sm" onClick={onClose}>
          <ArrowLeft size={16} /> Volver
        </button>
        <button className="btn-primary btn-sm" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / PDF
        </button>
      </div>

      <div className="pemc-document" id="pemc-print-area">
        <div className="doc-header">
          <h2>PROGRAMA ESCOLAR DE MEJORA CONTINUA</h2>
        </div>

        {generalData.presentacion && (
          <div className="doc-section">
            <h3 className="section-title">PRESENTACIÓN</h3>
            <div className="section-content">
              {renderText(generalData.presentacion)}
            </div>
          </div>
        )}

        {(generalData.mision || generalData.vision) && (
          <div className="doc-section">
            {generalData.mision && (
              <>
                <h3 className="section-title">MISIÓN</h3>
                <div className="section-content">
                  {renderText(generalData.mision)}
                </div>
              </>
            )}
            {generalData.vision && (
              <>
                <h3 className="section-title" style={{marginTop: '1rem'}}>VISIÓN</h3>
                <div className="section-content">
                  {renderText(generalData.vision)}
                </div>
              </>
            )}
          </div>
        )}

        {generalData.decalogo && (
          <div className="doc-section">
            <h3 className="section-title">DECÁLOGO DE COLABORACIÓN</h3>
            <div className="section-content">
              {renderText(generalData.decalogo)}
            </div>
          </div>
        )}

        <div className="doc-section page-break-before">
          <h3 className="section-title">DIAGNÓSTICO SOCIOEDUCATIVO DE LA ESCUELA</h3>
          
          {generalData.diagnosticoExterno && (
            <div className="sub-section">
              <h4>Contexto Externo</h4>
              {renderText(generalData.diagnosticoExterno)}
            </div>
          )}
          
          {generalData.diagnosticoInterno && (
            <div className="sub-section">
              <h4>Contexto Interno</h4>
              {renderText(generalData.diagnosticoInterno)}
            </div>
          )}

          {generalData.diagnosticoDisciplina && (
            <div className="sub-section">
              <h4>Diagnóstico por Disciplina</h4>
              {renderText(generalData.diagnosticoDisciplina)}
            </div>
          )}

          {generalData.diagnosticoPedagogico && (
            <div className="sub-section">
              <h4>Aspectos Pedagógicos</h4>
              {renderText(generalData.diagnosticoPedagogico)}
            </div>
          )}

          {generalData.diagnosticoSociocultural && (
            <div className="sub-section">
              <h4>Aspectos Socioculturales</h4>
              {renderText(generalData.diagnosticoSociocultural)}
            </div>
          )}
        </div>

        <div className="doc-section page-break-before">
          <h3 className="section-title" style={{textAlign: 'center', marginBottom: '2rem'}}>PLAN DE ACTIVIDADES A REALIZAR</h3>
          
          {ambitos.map(ambito => {
            const accionesAmbito = acciones.filter(a => a.ambito === ambito);
            if (accionesAmbito.length === 0 && !generalData[`estrategia_${ambito}`]) return null;
            
            return (
              <div key={ambito} className="ambito-print-section">
                <div className="ambito-title-bar">
                  <strong>ÁMBITO: {ambito.toUpperCase()}</strong>
                </div>
                
                {accionesAmbito.map((accion, i) => (
                  <div key={i} className="accion-print-block">
                    <div className="print-field">
                      <strong>PROBLEMÁTICA DETECTADA: </strong>
                      {accion.problematica}
                    </div>
                    <div className="print-field">
                      <strong>OBJETIVO (S): </strong>
                      {accion.objetivo}
                    </div>
                    <div className="print-field">
                      <strong>META (S): </strong>
                      {accion.meta}
                    </div>
                    
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th>ACCIONES</th>
                          <th>PERIODO</th>
                          <th>RECURSOS</th>
                          <th>RESPONSABLES</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{accion.accion}</td>
                          <td>
                            Inicio: {accion.fechaInicio}<br/>
                            Cierre: {accion.fechaCierre || 'No definido'}
                          </td>
                          <td>{accion.evidencia || 'No especificado'}</td>
                          <td>{accion.responsable}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
                
                {generalData[`estrategia_${ambito}`] && (
                  <div className="estrategias-block">
                    <h4>ESTRATEGIAS DE SEGUIMIENTO Y EVALUACIÓN</h4>
                    <div className="section-content">
                      {renderText(generalData[`estrategia_${ambito}`])}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {generalData.comisionesTexto && (
          <div className="doc-section page-break-before">
            <h3 className="section-title">C O M I S I O N E S</h3>
            <div className="section-content">
              {renderText(generalData.comisionesTexto)}
            </div>
          </div>
        )}

        <div className="doc-section page-break-before firmas-section">
          <h3 className="section-title" style={{textAlign: 'center'}}>CONSEJO DE ORGANIZACIÓN Y SEGUIMIENTO</h3>
          <div className="firmas-grid">
            <div className="firma-box">
              <div className="firma-line"></div>
              <span>DIRECTOR DE LA ESCUELA</span>
            </div>
            <div className="firma-box">
              <div className="firma-line"></div>
              <span>JEFE/A DE ENSEÑANZA ENLACE</span>
            </div>
            <div className="firma-box">
              <div className="firma-line"></div>
              <span>INSPECTOR GENERAL DE LA ZONA ESCOLAR</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PEMCPrintView;
