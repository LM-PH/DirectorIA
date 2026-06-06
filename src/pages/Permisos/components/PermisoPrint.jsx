import React, { forwardRef } from 'react';
import { useConfig } from '../../../contexts/ConfigContext';
import './PermisoPrint.css';

const PermisoPrint = forwardRef(({ permiso }, ref) => {
  const { config } = useConfig();

  if (!permiso) return null;

  const hoy = new Date().toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="print-only" ref={ref}>
      <div className="print-container">
        
        {/* Encabezado */}
        <div className="print-header">
          {config?.logoUrl && (
            <img src={config.logoUrl} alt="Logo Escuela" className="print-logo" />
          )}
          <div className="print-header-text">
            <h2>{config?.nombreEscuela || 'Nombre de la Escuela No Configurado'}</h2>
            <p><strong>CCT:</strong> {config?.cct || '---'} | <strong>Zona:</strong> {config?.zona || '---'} | <strong>Sector:</strong> {config?.sector || '---'}</p>
            <p>Ciclo Escolar: {config?.cicloEscolar || '---'}</p>
          </div>
        </div>

        <h1 className="print-title">FORMATO DE AUTORIZACIÓN DE PERMISO</h1>

        {/* Cuerpo del Formato */}
        <div className="print-body">
          <table className="print-table">
            <tbody>
              <tr>
                <td className="print-label">Nombre del Trabajador:</td>
                <td className="print-value fw-bold">{permiso.trabajador}</td>
              </tr>
              <tr>
                <td className="print-label">Función:</td>
                <td className="print-value" style={{textTransform: 'capitalize'}}>{permiso.funcion}</td>
              </tr>
              <tr>
                <td className="print-label">Fecha Solicitada:</td>
                <td className="print-value">{permiso.fecha}</td>
              </tr>
              <tr>
                <td className="print-label">Horario de Ausencia:</td>
                <td className="print-value">De {permiso.horaInicio} a {permiso.horaTermino}</td>
              </tr>
              <tr>
                <td className="print-label">Tipo de Permiso:</td>
                <td className="print-value">{permiso.tipoPermiso}</td>
              </tr>
              <tr>
                <td className="print-label">Motivo:</td>
                <td className="print-value">{permiso.motivo}</td>
              </tr>
              <tr>
                <td className="print-label">Estado de Autorización:</td>
                <td className="print-value" style={{textTransform: 'uppercase', fontWeight: 'bold'}}>
                  {permiso.estado}
                </td>
              </tr>
              <tr>
                <td className="print-label">Observaciones:</td>
                <td className="print-value">{permiso.observaciones || 'Ninguna'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-date">
          <p>Fecha de elaboración: {hoy}</p>
        </div>

        {/* Firmas */}
        <div className="print-signatures">
          <div className="signature-box">
            <div className="signature-line"></div>
            <p className="fw-bold">{permiso.trabajador}</p>
            <p>Firma del Trabajador</p>
          </div>
          
          <div className="signature-box">
            <div className="signature-line"></div>
            <p className="fw-bold">{config?.director || 'Director de la Escuela'}</p>
            <p>Firma del Director(a)</p>
          </div>
        </div>
        
      </div>
    </div>
  );
});

export default PermisoPrint;
