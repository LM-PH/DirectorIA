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
        
        {/* Encabezado Oficial */}
        <div className="print-header">
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="Logo Escuela" className="print-logo" />
          ) : (
            <div className="print-logo-placeholder"></div>
          )}
          <div className="print-header-text">
            <h2>{config?.nombreEscuela || 'Nombre de la Escuela'}</h2>
            <p><strong>CCT:</strong> {config?.cct || '---'} &nbsp;|&nbsp; <strong>Zona Escolar:</strong> {config?.zona || '---'} &nbsp;|&nbsp; <strong>Sector:</strong> {config?.sector || '---'}</p>
            <p>Ciclo Escolar: {config?.cicloEscolar || '---'}</p>
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

        {/* Pie de Página */}
        <div className="print-footer">
          <p>Documento generado por DirectorIA el {hoy}.</p>
          <div className="print-signature-area">
            <div className="signature-line"></div>
            <p className="fw-bold">{config?.director || 'Director de la Escuela'}</p>
            <p>Director(a) Escolar</p>
          </div>
        </div>
        
      </div>
    </div>
  );
});

export default PrintTemplate;
