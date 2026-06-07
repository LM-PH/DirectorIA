import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, Check, ExternalLink, LogOut, Share2, ChevronDown } from 'lucide-react';
import './Topbar.css';

const Topbar = () => {
  const { currentUser, schoolId, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Director(a)';
  const portalUrl = schoolId ? `${window.location.origin}/p/${schoolId}` : '';

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="mobile-title mobile-only">Director<span style={{color:'var(--color-accent)'}}>IA</span></h2>
      </div>

      <div className="topbar-right">
        <div className="user-greeting">
          Hola, <strong>{displayName}</strong>
        </div>

        {/* Avatar + Dropdown */}
        <div className="profile-menu-wrapper" ref={menuRef}>
          <button
            className="avatar"
            onClick={() => setMenuOpen(prev => !prev)}
            title="Mi perfil"
          >
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="avatar" className="avatar-img" />
              : getInitials(displayName)
            }
            <ChevronDown size={13} className={`avatar-chevron ${menuOpen ? 'open' : ''}`} />
          </button>

          {menuOpen && (
            <div className="profile-dropdown">
              {/* User Info */}
              <div className="dropdown-user-info">
                <div className="dropdown-avatar">
                  {currentUser?.photoURL
                    ? <img src={currentUser.photoURL} alt="avatar" />
                    : getInitials(displayName)
                  }
                </div>
                <div>
                  <strong>{displayName}</strong>
                  <span>{currentUser?.email}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              {/* Portal Link Section */}
              <div className="dropdown-portal-section">
                <div className="dropdown-section-label">
                  <Share2 size={13} /> Enlace del Portal Docente
                </div>
                <p className="dropdown-portal-desc">
                  Comparte con tus maestros para recibir documentos y permisos automáticamente.
                </p>
                <div className="dropdown-portal-url">
                  <span>{portalUrl || 'Cargando...'}</span>
                </div>
                <div className="dropdown-portal-actions">
                  <button
                    className={`dropdown-action-btn ${copied ? 'success' : ''}`}
                    onClick={handleCopy}
                    disabled={!portalUrl}
                  >
                    {copied ? <><Check size={14}/> ¡Copiado!</> : <><Copy size={14}/> Copiar enlace</>}
                  </button>
                  {portalUrl && (
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="dropdown-action-btn outline"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ExternalLink size={14}/> Ver portal
                    </a>
                  )}
                </div>
              </div>

              <div className="dropdown-divider" />

              {/* Logout */}
              <button className="dropdown-logout" onClick={handleLogout}>
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
