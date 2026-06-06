import React from 'react';

const ReporteCTE = ({ data }) => {
  if (data.length === 0) {
    return <p>No hay acuerdos de CTE registrados.</p>;
  }

  const agrupados = {
    cumplido: data.filter(d => d.estado === 'cumplido'),
    pendiente: data.filter(d => d.estado === 'pendiente'),
    proximo: data.filter(d => d.estado === 'proximo'),
    atrasado: data.filter(d => d.estado === 'atrasado'),
  };

  return (
    <div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <span className="report-badge bg-verde">Cumplidos: {agrupados.cumplido.length}</span>
        <span className="report-badge bg-gris">Pendientes: {agrupados.pendiente.length}</span>
        <span className="report-badge bg-amarillo">Próximos: {agrupados.proximo.length}</span>
        <span className="report-badge bg-rojo">Atrasados: {agrupados.atrasado.length}</span>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Sesión</th>
            <th>Acuerdo / Compromiso</th>
            <th>Responsable</th>
            <th>Fecha Límite</th>
            <th>Estado</th>
            <th>Evidencia</th>
          </tr>
        </thead>
        <tbody>
          {data.map(c => (
            <tr key={c.id}>
              <td>{c.fechaSesion}<br/><small>{c.tipoSesion}</small></td>
              <td>{c.acuerdo}</td>
              <td>{c.responsable}</td>
              <td>{c.fechaCompromiso}</td>
              <td>
                <span className={`report-badge bg-${c.estado === 'cumplido' ? 'verde' : c.estado === 'atrasado' ? 'rojo' : c.estado === 'proximo' ? 'amarillo' : 'gris'}`}>
                  {c.estado}
                </span>
              </td>
              <td>{c.evidenciaUrl ? 'Adjunta' : 'Sin evidencia'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReporteCTE;
