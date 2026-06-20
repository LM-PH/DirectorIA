import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import '../Licencia/Licencia.css';

const PagoPendiente = () => {
  const navigate = useNavigate();

  return (
    <div className="module-container licencia-module" style={{ marginTop: '10vh' }}>
      <div className="licencia-card active-card" style={{ borderColor: '#eab308' }}>
        <Clock size={64} style={{ color: '#eab308', marginBottom: '1rem' }} />
        <h1 style={{ color: '#eab308' }}>Pago Pendiente</h1>
        <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
          Tu pago está siendo procesado. Si pagaste en efectivo o transferencia, puede tardar hasta 48 horas en reflejarse.
        </p>
        <p style={{ fontSize: '1rem', marginTop: '1rem', color: 'var(--color-text-primary)' }}>
          Una vez que se acredite, tu licencia se activará automáticamente.
        </p>
        <button 
          className="btn-primary" 
          style={{ marginTop: '2rem', padding: '0.8rem 2rem' }}
          onClick={() => navigate('/licencia')}
        >
          Entendido, volver a Mi Licencia
        </button>
      </div>
    </div>
  );
};

export default PagoPendiente;
