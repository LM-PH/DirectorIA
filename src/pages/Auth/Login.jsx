import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoUrl from '../../assets/logo.png';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
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
      </div>
    </div>
  );
};

export default Login;
