import React from 'react';
import { Edit2, Trash2, FileText, CheckCircle, XCircle, Clock, Printer } from 'lucide-react';

const ListaPermisos = ({ permisos, onEdit, onDelete, onChangeStatus, onPrint }) => {

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'autorizado': return <span className="badge badge-success">Autorizado</span>;
      case 'rechazado': return <span className="badge badge-error">Rechazado</span>;
      default: return <span className="badge badge-warning">Pendiente</span>;
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'autorizado': return <CheckCircle size={18} className="text-success" />;
      case 'rechazado': return <XCircle size={18} className="text-error" />;
      default: return <Clock size={18} className="text-warning" />;
    }
  };

  if (permisos.length === 0) {
    return (
      <div className="empty-state">
        <h3>No hay permisos registrados</h3>
      </div>
    );
  }

  return (
    <div className="lista-permisos">
      {permisos.map(p => (
        <div key={p.id} className="permiso-card">
          <div className="permiso-header">
            <div className="permiso-meta">
              {getStatusIcon(p.estado)}
              <span className="fw-bold">{p.fecha}</span>
              <span className="text-muted">({p.horaInicio} - {p.horaTermino})</span>
            </div>
            <div className="permiso-actions">
              <button className="btn-icon-small text-info" onClick={() => onPrint(p)} title="Imprimir Formato">
                <Printer size={16} />
              </button>
              {p.adjuntoUrl && (
                <a href={p.adjuntoUrl} target="_blank" rel="noopener noreferrer" className="btn-icon-small text-primary" title="Ver Adjunto">
                  <FileText size={16} />
                </a>
              )}
              <button className="btn-icon-small" onClick={() => onEdit(p)} title="Editar"><Edit2 size={16}/></button>
              <button className="btn-icon-small text-error" onClick={() => onDelete(p.id)} title="Eliminar"><Trash2 size={16}/></button>
            </div>
          </div>
          
          <div className="permiso-body">
            <h3 className="trabajador-nombre">{p.trabajador}</h3>
            <span className="trabajador-funcion">{p.funcion}</span>
            <div className="motivo-box">
              <strong>Motivo:</strong> {p.motivo}
            </div>
            {p.observaciones && (
              <div className="obs-box text-muted">
                <strong>Obs:</strong> {p.observaciones}
              </div>
            )}
          </div>

          <div className="permiso-footer">
            <div className="estado-controls">
              {getStatusBadge(p.estado)}
              {p.estado === 'pendiente' && (
                <div className="quick-actions">
                  <button className="btn-approve" onClick={() => onChangeStatus(p, 'autorizado')}>Aprobar</button>
                  <button className="btn-reject" onClick={() => onChangeStatus(p, 'rechazado')}>Rechazar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListaPermisos;
