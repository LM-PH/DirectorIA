import React from 'react';

const ReportePEMC = ({ data }) => {
  if (data.length === 0) {
    return <p>No hay metas del PEMC registradas.</p>;
  }

  // Agrupar por ámbito
  const porAmbito = data.reduce((acc, curr) => {
    if (!acc[curr.ambito]) acc[curr.ambito] = [];
    acc[curr.ambito].push(curr);
    return acc;
  }, {});

  const renderProgress = (val) => {
    return (
      <div style={{width:'100%', background:'#eee', height:'10px', borderRadius:'5px'}}>
        <div style={{width:`${val}%`, background:'#10b981', height:'100%', borderRadius:'5px'}}></div>
      </div>
    );
  };

  return (
    <div>
      {Object.entries(porAmbito).map(([ambito, metas]) => (
        <div key={ambito} style={{marginBottom:'30px'}}>
          <h3 style={{fontSize:'16px', borderBottom:'1px solid #000', paddingBottom:'5px', marginBottom:'10px'}}>
            Ámbito: {ambito}
          </h3>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{width:'25%'}}>Objetivo / Meta</th>
                <th style={{width:'25%'}}>Acción</th>
                <th style={{width:'15%'}}>Responsable</th>
                <th style={{width:'15%'}}>Fechas</th>
                <th style={{width:'10%'}}>Avance</th>
                <th style={{width:'10%'}}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {metas.map(m => (
                <tr key={m.id}>
                  <td>
                    <strong>Obj:</strong> {m.objetivo}<br/>
                    <strong>Meta:</strong> {m.meta}
                  </td>
                  <td>{m.accion}</td>
                  <td>{m.responsable}</td>
                  <td>
                    Del {m.fechaInicio}<br/>al {m.fechaCierre}
                  </td>
                  <td>
                    {m.avance}%
                    {renderProgress(m.avance)}
                  </td>
                  <td>
                    <span className={`report-badge bg-${m.estado === 'cumplido' ? 'verde' : m.estado === 'atrasado' ? 'rojo' : 'amarillo'}`}>
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ReportePEMC;
