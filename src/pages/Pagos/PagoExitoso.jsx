import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import '../Licencia/Licencia.css';

const PagoExitoso = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/licencia');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="module-container licencia-module" style={{ marginTop: '10vh' }}>
      <div className="licencia-card active-card">
        <ShieldCheck size={64} className="icon-success" style={{ marginBottom: '1rem' }} />
        <h1 style={{ color: 'var(--color-success)' }}>Pago Recibido</h1>
        <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
          Tu licencia se activará automáticamente en unos momentos.
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Serás redirigido a tu panel en unos segundos...
        </p>
        <button 
          className="btn-primary" 
          style={{ marginTop: '2rem', padding: '0.8rem 2rem' }}
          onClick={() => navigate('/licencia')}
        >
          Ir a Mi Licencia
        </button>
      </div>
    </div>
  );
};

export default PagoExitoso;
