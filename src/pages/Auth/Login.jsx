import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, LayoutDashboard, LogOut } from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('No se pudo iniciar sesión con Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGoogle();
      const user = result.user;
      
      if (user && user.email === 'zlagustin10@gmail.com') {
        navigate('/admin');
      } else {
        setError('Acceso Administrativo: Esta cuenta no tiene permisos de administrador. Redirigiendo a tu Dashboard escolar...');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err) {
      setError('No se pudo iniciar sesión con Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setError('');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logoUrl} alt="DirectorIA Logo" className="app-logo-large" />
          <h2>Director<span>IA</span></h2>
          <p className="subtitle">Gestión Escolar Inteligente</p>
          <p className="description">Acceso exclusivo para directivos escolares mediante cuenta Google Institucional o personal.</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}

        {currentUser ? (
          <div className="logged-in-box">
            <p className="logged-in-info">
              Sesión activa: <strong>{currentUser.email}</strong>
            </p>
            <div className="login-actions-group">
              {isAdmin && (
                <button 
                  onClick={() => navigate('/admin')} 
                  className="btn-admin-access"
                >
                  <Shield size={18} />
                  Panel de Administrador
                </button>
              )}
              
              <button 
                onClick={() => navigate('/')} 
                className="btn-google"
                style={{ marginTop: isAdmin ? '0.5rem' : '1rem' }}
              >
                <LayoutDashboard size={18} style={{ marginRight: '10px' }} />
                Ir al Dashboard Escolar
              </button>

              <button 
                onClick={handleLogout} 
                className="btn-logout-secondary"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="login-actions-group">
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading} 
              className="btn-google"
            >
              {loading ? (
                <span className="loading-text">Conectando...</span>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="google-icon" />
                  Ingresar con Google
                </>
              )}
            </button>

            <button 
              onClick={handleAdminLogin} 
              disabled={loading} 
              className="btn-admin-access"
            >
              <Shield size={18} />
              Acceso Administrador
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
