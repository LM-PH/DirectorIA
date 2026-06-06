import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Topbar.css';

const Topbar = () => {
  const { currentUser } = useAuth();

  // Get user initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Director(a)';

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* En móvil mostraremos un título minimalista */}
        <h2 className="mobile-title mobile-only">Director<span style={{color:'var(--color-accent)'}}>IA</span></h2>
      </div>

      <div className="topbar-right">
        <div className="user-greeting">
          Hola, <strong>{displayName}</strong>
        </div>
        <div className="avatar">
          {getInitials(displayName)}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
