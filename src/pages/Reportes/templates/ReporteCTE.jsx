import React from 'react';

const ReporteCTE = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No hay acuerdos de CTE registrados.</p>;
  }

  // Check how many unique sessions are in the data
  const sessions = [...new Set(data.map(a => `${a.tipoSesion} - ${a.fechaSesion}`))];

  const parseParticipantes = (participantesStr) => {
    if (!participantesStr) return [];
    // Split by commas, semicolons or newlines
    return participantesStr
      .split(/[\n,;]+/)
      .map(p => p.trim())
      .filter(Boolean);
  };

  if (sessions.length > 1) {
    // Grouped layout for "Todas las Sesiones"
    return (
      <div>
        <p style={{ marginBottom: '20px', fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>
          Mostrando acuerdos agrupados por sesión.
        </p>

        {sessions.map(sessionKey => {
          const sessionAgreements = data.filter(a => `${a.tipoSesion} - ${a.fechaSesion}` === sessionKey);
          const [tipo, fecha] = sessionKey.split(' - ');
          
          // Get participants of this session (from first agreement that has them)
          const firstWithPart = sessionAgreements.find(a => a.participantes);
          const listParticipantes = parseParticipantes(firstWithPart?.participantes);

          return (
            <div key={sessionKey} style={{ marginBottom: '50px', pageBreakInside: 'avoid' }} className="cte-session-group">
              <h3 style={{ 
                fontSize: '15px', 
                borderBottom: '2px solid #0f172a', 
                paddingBottom: '6px', 
                marginBottom: '15px', 
                fontWeight: 'bold',
                color: '#0f172a',
                textTransform: 'uppercase'
              }}>
                Sesión: {tipo} ({fecha})
              </h3>
              
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Acuerdo / Compromiso</th>
                    <th style={{ width: '25%' }}>Responsable</th>
                    <th style={{ width: '15%' }}>Límite</th>
                    <th style={{ width: '15%' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionAgreements.map(c => (
                    <tr key={c.id}>
                      <td>{c.acuerdo}</td>
                      <td>{c.responsable}</td>
                      <td>{c.fechaCompromiso}</td>
                      <td>
                        <span className={`report-badge bg-${c.estado === 'cumplido' ? 'verde' : c.estado === 'atrasado' ? 'rojo' : c.estado === 'proximo' ? 'amarillo' : 'gris'}`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {listParticipantes.length > 0 && (
                <div style={{ marginTop: '20px', pageBreakInside: 'avoid' }}>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '15px', color: '#475569', fontWeight: 'bold' }}>
                    Firmas de la Sesión
                  </h4>
                  <div className="cte-signatures-grid">
                    {listParticipantes.map((part, idx) => (
                      <div key={idx} className="cte-signature-box">
                        <div className="cte-signature-line"></div>
                        <p className="cte-signature-name">{part}</p>
                        <p className="cte-signature-label">Firma</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Single Session layout (individual print of minutes)
  const sessionKey = sessions[0];
  const [tipo, fecha] = sessionKey.split(' - ');
  const firstWithPart = data.find(a => a.participantes);
  const listParticipantes = parseParticipantes(firstWithPart?.participantes);

  const agrupados = {
    cumplido: data.filter(d => d.estado === 'cumplido'),
    pendiente: data.filter(d => d.estado === 'pendiente' || d.estado === 'en proceso'),
    proximo: data.filter(d => d.estado === 'proximo'),
    atrasado: data.filter(d => d.estado === 'atrasado'),
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <span className="report-badge bg-verde">Cumplidos: {agrupados.cumplido.length}</span>
        <span className="report-badge bg-gris">Pendientes: {agrupados.pendiente.length}</span>
        {agrupados.proximo.length > 0 && <span className="report-badge bg-amarillo">Próximos: {agrupados.proximo.length}</span>}
        {agrupados.atrasado.length > 0 && <span className="report-badge bg-rojo">Atrasados: {agrupados.atrasado.length}</span>}
      </div>

      <div style={{ marginBottom: '15px', fontSize: '13px', color: '#475569' }}>
        <strong>Tipo de Sesión:</strong> {tipo} &nbsp;|&nbsp; <strong>Fecha de Sesión:</strong> {fecha}
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th style={{ width: '45%' }}>Acuerdo / Compromiso</th>
            <th style={{ width: '25%' }}>Responsable</th>
            <th style={{ width: '15%' }}>Fecha Límite</th>
            <th style={{ width: '15%' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.map(c => (
            <tr key={c.id}>
              <td>{c.acuerdo}</td>
              <td>{c.responsable}</td>
              <td>{c.fechaCompromiso}</td>
              <td>
                <span className={`report-badge bg-${c.estado === 'cumplido' ? 'verde' : c.estado === 'atrasado' ? 'rojo' : c.estado === 'proximo' ? 'amarillo' : 'gris'}`}>
                  {c.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {listParticipantes.length > 0 && (
        <div style={{ marginTop: '40px', pageBreakInside: 'avoid' }}>
          <h4 style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            marginBottom: '20px', 
            color: '#1e293b', 
            fontWeight: 'bold',
            borderBottom: '1px dashed #cbd5e1',
            paddingBottom: '6px'
          }}>
            Firmas de los Participantes del CTE
          </h4>
          <div className="cte-signatures-grid">
            {listParticipantes.map((part, idx) => (
              <div key={idx} className="cte-signature-box">
                <div className="cte-signature-line"></div>
                <p className="cte-signature-name">{part}</p>
                <p className="cte-signature-label">Firma del Participante</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReporteCTE;
