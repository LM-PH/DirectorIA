import React from 'react';

const ReporteEntregas = ({ data, extraData }) => {
  // data = entregas_esperadas
  // extraData = documentos

  if (data.length === 0) {
    return <p>No hay entregas esperadas configuradas en el sistema.</p>;
  }

  return (
    <div>
      <p style={{marginBottom: '20px'}}>
        El siguiente reporte cruza las entregas solicitadas contra los archivos recibidos en el repositorio documental.
      </p>

      {data.map(entrega => {
        
        const docentes = entrega.docentesRequeridos || [];
        
        return (
          <div key={entrega.id} style={{marginBottom:'40px'}}>
            <h3 style={{fontSize:'16px', margin:'0 0 5px 0', borderBottom:'1px solid #ddd', paddingBottom:'5px'}}>
              Entrega: {entrega.nombre}
            </h3>
            <p style={{margin:'0 0 10px 0', fontSize:'12px', color:'#555'}}>
              <strong>Tipo de Documento:</strong> {entrega.tipoDocumento} &nbsp;|&nbsp; 
              <strong>Fecha Límite:</strong> {entrega.fechaLimite}
            </p>

            <table className="report-table">
              <thead>
                <tr>
                  <th style={{width:'40%'}}>Docente Requerido</th>
                  <th style={{width:'20%'}}>Estado</th>
                  <th style={{width:'40%'}}>Documento Recibido</th>
                </tr>
              </thead>
              <tbody>
                {docentes.map(docente => {
                  // Check if there is a document linked to this entrega by this teacher
                  const docRecibido = extraData.find(d => d.docente === docente && d.entregaId === entrega.id);
                  
                  // Compute status
                  let status = '';
                  let badgeColor = '';
                  
                  if (docRecibido) {
                    status = 'Entregado';
                    badgeColor = 'bg-verde';
                  } else {
                    const limitDate = new Date(`${entrega.fechaLimite}T12:00:00`);
                    const today = new Date();
                    today.setHours(12,0,0,0);
                    
                    if (today > limitDate) {
                      status = 'Atrasado';
                      badgeColor = 'bg-rojo';
                    } else {
                      status = 'Pendiente';
                      badgeColor = 'bg-amarillo';
                    }
                  }

                  return (
                    <tr key={`${entrega.id}-${docente}`}>
                      <td>{docente}</td>
                      <td>
                        <span className={`report-badge ${badgeColor}`}>{status}</span>
                      </td>
                      <td>
                        {docRecibido ? (
                          <span>{docRecibido.nombre}<br/><small>{docRecibido.fechaRecepcion}</small></span>
                        ) : (
                          <span style={{color:'#999'}}>---</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {docentes.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{textAlign:'center'}}>No hay docentes requeridos para esta entrega.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default ReporteEntregas;
