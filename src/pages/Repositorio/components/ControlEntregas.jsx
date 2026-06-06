import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import './ControlEntregas.css';

const ControlEntregas = ({ entregas, documentos, onOpenNew, onEdit, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatus = (docente, entrega) => {
    // Buscar si hay un documento asociado a esta entrega específica de este docente
    const haEntregado = documentos.some(
      doc => doc.docente === docente && doc.entregaId === entrega.id
    );

    if (haEntregado) return { type: 'entregado', label: 'Entregado', icon: <CheckCircle size={16}/>, color: 'success' };

    const today = new Date();
    today.setHours(0,0,0,0);
    const [y, m, d] = entrega.fechaLimite.split('-');
    const limitDate = new Date(y, m - 1, d);
    limitDate.setHours(0,0,0,0);

    if (today > limitDate) {
      return { type: 'atrasado', label: 'Atrasado', icon: <AlertCircle size={16}/>, color: 'error' };
    } else {
      return { type: 'pendiente', label: 'Pendiente', icon: <Clock size={16}/>, color: 'warning' };
    }
  };

  if (entregas.length === 0) {
    return (
      <div className="empty-state">
        <Clock size={48} className="text-muted" />
        <h3>No hay entregas configuradas</h3>
        <p>Crea una nueva solicitud de entrega para monitorear el cumplimiento de tus docentes.</p>
        <button className="btn-primary mt-3" onClick={onOpenNew}>
          <Plus size={18} /> Pedir Entrega
        </button>
      </div>
    );
  }

  return (
    <div className="control-entregas">
      <div className="entregas-toolbar">
        <h2>Monitoreo de Cumplimiento</h2>
        <button className="btn-primary" onClick={onOpenNew}>
          <Plus size={18} /> Pedir Nueva Entrega
        </button>
      </div>

      <div className="entregas-list">
        {entregas.map(entrega => {
          const isExpanded = expandedId === entrega.id;
          
          // Calcular estadísticas globales de esta entrega
          let counts = { entregado: 0, pendiente: 0, atrasado: 0 };
          const teacherStatuses = entrega.docentesRequeridos.map(d => {
            const st = getStatus(d, entrega);
            counts[st.type]++;
            return { docente: d, status: st };
          });
          
          const total = entrega.docentesRequeridos.length;
          const pctEntregado = total > 0 ? Math.round((counts.entregado / total) * 100) : 0;

          return (
            <div key={entrega.id} className={`entrega-card ${isExpanded ? 'expanded' : ''}`}>
              <div className="entrega-header" onClick={() => toggleExpand(entrega.id)}>
                <div className="entrega-title-area">
                  <button className="btn-expand-icon">
                    {isExpanded ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                  </button>
                  <div>
                    <h3 className="entrega-title">{entrega.nombre}</h3>
                    <span className="entrega-subtitle">{entrega.tipoDocumento} • Vence: {entrega.fechaLimite}</span>
                  </div>
                </div>
                
                <div className="entrega-summary-area">
                  <div className="progress-mini">
                    <div className="progress-bar-bg" style={{width: '100px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden'}}>
                      <div style={{width: `${pctEntregado}%`, height: '100%', background: '#10B981'}}></div>
                    </div>
                    <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{pctEntregado}%</span>
                  </div>
                  
                  <div className="entrega-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon-small" onClick={() => onEdit(entrega)} title="Editar"><Edit2 size={16}/></button>
                    <button className="btn-icon-small text-error" onClick={() => onDelete(entrega.id)} title="Eliminar"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="entrega-body">
                  <div className="stats-row">
                    <span className="stat-pill bg-success-light text-success">{counts.entregado} Entregados</span>
                    <span className="stat-pill bg-warning-light text-warning">{counts.pendiente} Pendientes</span>
                    <span className="stat-pill bg-error-light text-error">{counts.atrasado} Atrasados</span>
                  </div>

                  <table className="cumplimiento-table">
                    <thead>
                      <tr>
                        <th>Docente Requerido</th>
                        <th>Estado de Entrega</th>
                        <th>Documento Vinculado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherStatuses.map((item, idx) => {
                        // Find matching doc to link it
                        const matchingDoc = documentos.find(doc => doc.docente === item.docente && doc.entregaId === entrega.id);
                        
                        return (
                          <tr key={idx}>
                            <td className="fw-bold">{item.docente}</td>
                            <td>
                              <span className={`badge badge-${item.status.color}`} style={{display:'inline-flex', alignItems:'center', gap:'4px'}}>
                                {item.status.icon} {item.status.label}
                              </span>
                            </td>
                            <td>
                              {matchingDoc ? (
                                <a href={matchingDoc.archivoUrl || '#'} target="_blank" rel="noopener noreferrer" className="doc-link" style={{fontSize:'0.85rem'}}>
                                  Ver documento
                                </a>
                              ) : (
                                <span className="text-muted" style={{fontSize:'0.85rem'}}>Sin archivo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ControlEntregas;
