import React from 'react';

const ReportePermisos = ({ data, filtroMes, filtroAnio }) => {
  // Filtrar por mes y año
  const filteredData = data.filter(p => {
    const d = new Date(`${p.fecha}T12:00:00`);
    return d.getMonth() + 1 === filtroMes && d.getFullYear() === filtroAnio;
  });

  const getMesString = (mes) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
  };

  const totals = {
    autorizado: filteredData.filter(d => d.estado === 'autorizado').length,
    pendiente: filteredData.filter(d => d.estado === 'pendiente').length,
    rechazado: filteredData.filter(d => d.estado === 'rechazado').length,
  };

  if (filteredData.length === 0) {
    return <p>No hay permisos registrados para {getMesString(filtroMes)} del {filtroAnio}.</p>;
  }

  return (
    <div>
      <p style={{marginBottom: '20px', fontWeight: 'bold'}}>
        Periodo: {getMesString(filtroMes)} {filtroAnio}
      </p>

      <div style={{display:'flex', gap:'20px', marginBottom:'20px'}}>
        <div style={{padding:'10px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'4px', flex:1}}>
          <strong>Total Autorizados:</strong> {totals.autorizado}
        </div>
        <div style={{padding:'10px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'4px', flex:1}}>
          <strong>Total Pendientes:</strong> {totals.pendiente}
        </div>
        <div style={{padding:'10px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'4px', flex:1}}>
          <strong>Total Rechazados:</strong> {totals.rechazado}
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Trabajador</th>
            <th>Función</th>
            <th>Horario</th>
            <th>Motivo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(p => (
            <tr key={p.id}>
              <td>{p.fecha}</td>
              <td>{p.trabajador}</td>
              <td style={{textTransform:'capitalize'}}>{p.funcion}</td>
              <td>{p.horaInicio} - {p.horaTermino}</td>
              <td>{p.motivo}</td>
              <td>
                <span className={`report-badge bg-${p.estado === 'autorizado' ? 'verde' : p.estado === 'rechazado' ? 'rojo' : 'amarillo'}`}>
                  {p.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportePermisos;
