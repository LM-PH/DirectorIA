import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useLicense } from '../../contexts/LicenseContext';
import { useAuth } from '../../contexts/AuthContext';

const LicenseGuard = ({ children }) => {
  const { isTrialExpired, loading } = useLicense();
  const { isPaid, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-state">Verificando licencia...</div>;
  }

  // Bypass if user is paid or admin
  if (isPaid || isAdmin) {
    return children;
  }

  // If trial is expired, block all routes except /licencia and /configuracion
  if (isTrialExpired) {
    const allowedPaths = ['/licencia', '/configuracion'];
    if (!allowedPaths.includes(location.pathname)) {
      return <Navigate to="/licencia" replace />;
    }
  }

  return children;
};

export default LicenseGuard;
