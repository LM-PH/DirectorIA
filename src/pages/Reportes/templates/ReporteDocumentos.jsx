import React from 'react';

const ReporteDocumentos = ({ data, filtroMes, filtroAnio }) => {
  const filteredData = data.filter(d => {
    const date = new Date(`${d.fechaRecepcion}T12:00:00`);
    return date.getMonth() + 1 === filtroMes && date.getFullYear() === filtroAnio;
  });

  const getMesString = (mes) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
  };

  if (filteredData.length === 0) {
    return <p>No se recibieron documentos en {getMesString(filtroMes)} del {filtroAnio}.</p>;
  }

  return (
    <div>
      <p style={{marginBottom: '20px', fontWeight: 'bold'}}>
        Periodo: {getMesString(filtroMes)} {filtroAnio}
      </p>

      <table className="report-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Nombre del Documento</th>
            <th>Tipo</th>
            <th>Docente / Origen</th>
            <th>Grupo / Ciclo</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(d => (
            <tr key={d.id}>
              <td>{d.fechaRecepcion}</td>
              <td>{d.nombre}</td>
              <td>{d.tipo}</td>
              <td>{d.docente || 'N/A'}</td>
              <td>
                {(d.gradoGrupo || d.cicloEscolar) ? (
                  <>
                    {d.gradoGrupo && <span>Grupo: {d.gradoGrupo}<br/></span>}
                    {d.cicloEscolar && <span>Ciclo: {d.cicloEscolar}</span>}
                  </>
                ) : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReporteDocumentos;
