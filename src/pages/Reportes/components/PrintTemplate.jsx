import React, { forwardRef } from 'react';
import { useConfig } from '../../../contexts/ConfigContext';
import './PrintTemplate.css';

const PrintTemplate = forwardRef(({ title, subtitle, children }, ref) => {
  const { config } = useConfig();
  
  const hoy = new Date().toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="print-report-wrapper print-only" ref={ref}>
      <div className="print-container">
        
        {/* Encabezado Oficial con Membrete */}
        <div className="print-official-letterhead">
          <div className="letterhead-top">
            <span>SISTEMA EDUCATIVO NACIONAL</span>
            <span>SECRETARÍA DE EDUCACIÓN PÚBLICA</span>
          </div>
          
          <div className="print-header">
            {config?.logoUrl ? (
              <img src={config.logoUrl} alt="Logo Escuela" className="print-logo" />
            ) : (
              <div className="print-logo-placeholder">🏛️</div>
            )}
            <div className="print-header-text">
              <h2>{config?.nombreEscuela || 'Nombre de la Escuela'}</h2>
              <div className="print-meta-grid">
                <p><strong>CCT:</strong> {config?.cct || '---'}</p>
                <p><strong>Zona Escolar:</strong> {config?.zonaEscolar || '---'}</p>
                <p><strong>Sector:</strong> {config?.sector || '---'}</p>
                <p><strong>Turno:</strong> {config?.turno || '---'}</p>
                <p><strong>Nivel:</strong> {config?.nivel || '---'}</p>
                <p><strong>Ciclo Escolar:</strong> {config?.cicloEscolar || '---'}</p>
              </div>
            </div>
          </div>
          
          <div className="letterhead-decor-bar">
            <div className="decor-line color-green"></div>
            <div className="decor-line color-gold"></div>
          </div>
        </div>

        {/* Títulos del Reporte */}
        <div className="print-report-title">
          <h1>{title}</h1>
          {subtitle && <p className="print-subtitle">{subtitle}</p>}
        </div>

        {/* Contenido Dinámico */}
        <div className="print-body">
          {children}
        </div>

        {/* Pie de Página e Información de Firma */}
        <div className="print-footer">
          <div className="print-signatures-container">
            {/* Firma del Director */}
            <div className="print-signature-box">
              <p className="signature-title">AUTORIZÓ</p>
              <div className="signature-line"></div>
              <p className="fw-bold">{config?.director || 'Director(a) de la Escuela'}</p>
              <p className="signature-subtitle">Director(a) Escolar</p>
            </div>
            
            {/* Firma del Subdirector o Sello */}
            <div className="print-signature-box">
              <p className="signature-title">VALIDÓ</p>
              <div className="signature-line"></div>
              <p className="fw-bold">{config?.subdirector || 'Subdirector(a) / Supervisor(a)'}</p>
              <p className="signature-subtitle">{config?.subdirector ? 'Subdirector(a) Escolar' : 'Sello de la Escuela'}</p>
            </div>
          </div>
          
          <div className="print-generation-info">
            <p>Documento oficial generado digitalmente por la plataforma <strong>DirectorIA</strong> el {hoy}.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
});

export default PrintTemplate;
