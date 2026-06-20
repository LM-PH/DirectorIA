import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import '../Licencia/Licencia.css';

const PagoError = () => {
  const navigate = useNavigate();

  return (
    <div className="module-container licencia-module" style={{ marginTop: '10vh' }}>
      <div className="licencia-card active-card" style={{ borderColor: 'var(--color-error)' }}>
        <ShieldAlert size={64} className="icon-error" style={{ marginBottom: '1rem' }} />
        <h1 style={{ color: 'var(--color-error)' }}>Pago Rechazado</h1>
        <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
          Hubo un problema procesando tu pago. Es posible que tu tarjeta haya sido declinada o haya un error de conexión.
        </p>
        <p style={{ fontSize: '1rem', marginTop: '1rem', color: 'var(--color-text-primary)' }}>
          Por favor, intenta nuevamente con otro método de pago.
        </p>
        <button 
          className="btn-primary" 
          style={{ marginTop: '2rem', padding: '0.8rem 2rem' }}
          onClick={() => navigate('/licencia')}
        >
          Volver e intentar de nuevo
        </button>
      </div>
    </div>
  );
};

export default PagoError;
