import React from 'react';

const ReporteAgenda = ({ data, filtroMes, filtroAnio }) => {
  const filteredData = data.filter(a => {
    const d = new Date(`${a.fecha}T12:00:00`);
    return d.getMonth() + 1 === filtroMes && d.getFullYear() === filtroAnio;
  });

  const getMesString = (mes) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
  };

  if (filteredData.length === 0) {
    return <p>No hay eventos registrados en la agenda para {getMesString(filtroMes)} del {filtroAnio}.</p>;
  }

  return (
    <div>
      <p style={{marginBottom: '20px', fontWeight: 'bold'}}>
        Mes: {getMesString(filtroMes)} {filtroAnio}
      </p>

      <table className="report-table">
        <thead>
          <tr>
            <th style={{width: '15%'}}>Fecha y Hora</th>
            <th style={{width: '15%'}}>Tipo de Evento</th>
            <th style={{width: '30%'}}>Título / Descripción</th>
            <th style={{width: '20%'}}>Responsable</th>
            <th style={{width: '10%'}}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(e => (
            <tr key={e.id}>
              <td>
                {e.fecha}<br/>
                <strong>{e.hora}</strong>
              </td>
              <td>{e.tipo}</td>
              <td>
                <strong>{e.titulo}</strong><br/>
                <span style={{fontSize:'0.85em', color:'#444'}}>{e.descripcion}</span>
              </td>
              <td>{e.responsable}</td>
              <td>
                <span className={`report-badge bg-${e.estado === 'atendido' ? 'verde' : 'amarillo'}`}>
                  {e.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReporteAgenda;
