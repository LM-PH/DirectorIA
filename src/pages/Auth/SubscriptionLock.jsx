import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, LogOut, MessageCircle, Mail } from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import './SubscriptionLock.css';

const SubscriptionLock = () => {
  const { userProfile, isSuspended, trialExpired, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (e) {
      console.error("Error logging out from subscription lock page:", e);
    }
  };

  const contactSubject = encodeURIComponent(`Activar Cuenta DirectorIA - ${userProfile?.email || ''}`);
  const contactBody = encodeURIComponent(`Hola, me gustaría activar mi cuenta de DirectorIA.\nUsuario: ${userProfile?.email || ''}\nEscuela: ${userProfile?.nombre || ''}`);
  const mailToUrl = `mailto:zlagustin10@gmail.com?subject=${contactSubject}&body=${contactBody}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Hola Agustín, me gustaría activar mi cuenta de DirectorIA para el correo: ' + (userProfile?.email || ''))}`;

  return (
    <div className="lock-container">
      <div className="lock-card animate-fade-in">
        <div className="lock-header">
          <img src={logoUrl} alt="DirectorIA Logo" className="app-logo-large lock-logo" />
          <h2>Director<span>IA</span></h2>
          <span className="lock-badge"><ShieldAlert size={16} /> Acceso Restringido</span>
        </div>

        <div className="lock-content">
          {isSuspended ? (
            <>
              <h3>Cuenta Suspendida</h3>
              <p className="lock-desc">
                Lo sentimos, tu acceso a la plataforma ha sido suspendido temporalmente por el administrador. 
                Si consideras que esto es un error o deseas aclarar el estado de tu cuenta, por favor ponte en contacto con nosotros.
              </p>
            </>
          ) : trialExpired ? (
            <>
              <h3>Periodo de Prueba Finalizado</h3>
              <p className="lock-desc">
                Tu acceso gratuito de **7 días de prueba** ha concluido. 
                Para continuar utilizando todos los módulos inteligentes de gestión escolar (Agenda, PEMC, Repositorio, CTE y más), 
                por favor adquiere tu **licencia de compra única**.
              </p>
              <div className="trial-info-box">
                <span className="info-highlight">¡Un solo pago para siempre! Sin mensualidades ocultas.</span>
              </div>
            </>
          ) : (
            <>
              <h3>Suscripción Pendiente</h3>
              <p className="lock-desc">
                Tu acceso no ha sido activado aún. Si acabas de realizar tu pago, por favor notifícalo al administrador 
                para dar de alta tu escuela de inmediato.
              </p>
            </>
          )}

          <div className="lock-user-details">
            <span className="user-email-label">Usuario registrado:</span>
            <span className="user-email-value">{userProfile?.email}</span>
          </div>

          <div className="lock-actions">
            <a 
              href={mailToUrl} 
              className="btn-lock-action btn-mail"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={18} />
              Contactar por Correo
            </a>

            <a 
              href={whatsappUrl} 
              className="btn-lock-action btn-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={18} />
              Enviar WhatsApp
            </a>

            <button 
              onClick={handleLogout} 
              className="btn-lock-logout"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLock;
