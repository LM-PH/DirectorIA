import React from 'react';
import { useLicense } from '../../contexts/LicenseContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, ShieldCheck, Calendar, Clock, CreditCard } from 'lucide-react';
import './Licencia.css';

const Licencia = () => {
  const { licenseData, isTrialExpired, loading } = useLicense();
  const { isPaid } = useAuth();

  if (loading) {
    return <div className="module-container"><div className="loading-state">Cargando información de licencia...</div></div>;
  }

  const handleBuy = () => {
    // Para futura integración de Mercado Pago
    alert('Funcionalidad de pago próximamente disponible.');
  };

  if (isPaid || licenseData?.tipo === 'admin') {
    return (
      <div className="module-container licencia-module">
        <div className="licencia-header">
          <h1 className="module-title">Mi Licencia</h1>
          <p className="module-description">Administra el estado de tu suscripción a DirectorIA.</p>
        </div>
        <div className="licencia-card active-card">
          <ShieldCheck size={48} className="icon-success" />
          <h2>Licencia Completa Activa</h2>
          <p>Gracias por ser parte de DirectorIA. Tienes acceso total a todas las herramientas.</p>
        </div>
      </div>
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="module-container licencia-module">
      <div className="licencia-header">
        <h1 className="module-title">Mi Licencia</h1>
        <p className="module-description">Administra el estado de tu suscripción a DirectorIA.</p>
      </div>

      {isTrialExpired && (
        <div className="alert-banner error">
          <ShieldAlert size={24} />
          <span>Tu prueba gratuita de DirectorIA ha finalizado. Compra tu licencia para continuar usando la plataforma.</span>
        </div>
      )}

      <div className="licencia-content">
        <div className={`licencia-card ${isTrialExpired ? 'expired-card' : 'trial-card'}`}>
          <div className="licencia-card-header">
            {isTrialExpired ? (
              <ShieldAlert size={40} className="icon-error" />
            ) : (
              <ShieldCheck size={40} className="icon-primary" />
            )}
            <div>
              <h2>{isTrialExpired ? 'Licencia de prueba vencida' : 'Licencia de prueba activa'}</h2>
              <p className="text-muted">Plan: Periodo de Prueba (15 días)</p>
            </div>
          </div>

          <div className="licencia-details">
            <div className="detail-item">
              <Calendar size={20} className="text-muted" />
              <div>
                <strong>Fecha de Vencimiento</strong>
                <span>{formatDate(licenseData?.fechaVencimiento)}</span>
              </div>
            </div>
            <div className="detail-item">
              <Clock size={20} className="text-muted" />
              <div>
                <strong>Días Restantes</strong>
                <span className={isTrialExpired ? 'text-error fw-bold' : 'text-primary fw-bold'}>
                  {licenseData?.diasRestantes} días
                </span>
              </div>
            </div>
          </div>

          <div className="licencia-action">
            <div className="price-tag">
              <span className="price-amount">$1,999 MXN</span>
              <span className="price-period">por ciclo escolar</span>
            </div>
            <button className="btn-primary btn-large" onClick={handleBuy}>
              <CreditCard size={20} /> Comprar licencia completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Licencia;
