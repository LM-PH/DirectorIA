import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Login.css';

const Terminos = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container" style={{ padding: '2rem 0' }}>
      <div className="login-card" style={{ maxWidth: '800px', textAlign: 'left', padding: '3rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn-secondary"
          style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        
        <h1 style={{ color: 'var(--color-primary)', marginBottom: '2rem' }}>Términos y Condiciones de Uso</h1>
        
        <div className="terms-content" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
          <h3>1. Aceptación de los Términos</h3>
          <p>
            Al acceder y utilizar DirectorIA, usted acepta estar sujeto a estos Términos y Condiciones de Uso, todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de las leyes locales aplicables. Si no está de acuerdo con alguno de estos términos, tiene prohibido usar o acceder a este sitio.
          </p>
          <br/>

          <h3>2. Licencia de Uso</h3>
          <p>
            Se concede permiso para utilizar temporalmente las herramientas de software de DirectorIA para uso exclusivo de gestión escolar. Esto es el otorgamiento de una licencia, no una transferencia de título, y bajo esta licencia usted no puede:
          </p>
          <ul>
            <li>Modificar o copiar los materiales o el código fuente;</li>
            <li>Usar el software para cualquier propósito comercial externo a su institución;</li>
            <li>Intentar descompilar o realizar ingeniería inversa de cualquier software contenido en DirectorIA;</li>
            <li>Eliminar cualquier derecho de autor u otras anotaciones de propiedad de los materiales.</li>
          </ul>
          <br/>

          <h3>3. Cuentas de Usuario e Información</h3>
          <p>
            Al registrarse mediante una cuenta de Google, usted nos autoriza a obtener su correo electrónico y nombre de perfil para facilitar la creación de su cuenta y la gestión de su licencia. Usted es el único responsable de mantener la confidencialidad de sus credenciales de acceso.
          </p>
          <br/>

          <h3>4. Pagos, Suscripciones y Periodo de Prueba</h3>
          <p>
            DirectorIA ofrece un periodo de prueba inicial de 15 días gratuito. Una vez finalizado este periodo, el acceso a las funciones principales será bloqueado hasta que se adquiera una licencia anual completa mediante Mercado Pago. Los pagos son definitivos y aplican para el ciclo escolar correspondiente (365 días desde la fecha de compra).
          </p>
          <br/>

          <h3>5. Limitaciones de Responsabilidad</h3>
          <p>
            En ningún caso DirectorIA o sus proveedores serán responsables de ningún daño (incluyendo, sin limitación, daños por pérdida de datos o beneficios, o debido a la interrupción del negocio) que surjan del uso o la incapacidad de usar los materiales en el sitio web de DirectorIA, incluso si un representante autorizado ha sido notificado verbalmente o por escrito de la posibilidad de tal daño.
          </p>
          <br/>

          <h3>6. Modificaciones de los Términos</h3>
          <p>
            DirectorIA puede revisar estos términos de uso para su sitio web en cualquier momento sin previo aviso. Al utilizar este sitio web, usted acepta estar sujeto a la versión actual de estos Términos y Condiciones de Uso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terminos;
