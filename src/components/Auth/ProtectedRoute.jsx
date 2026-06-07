import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isAccessBlocked } = useAuth();

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (isAccessBlocked) {
    // Redirect to subscription lock if account is suspended or trial expired
    return <Navigate to="/locked" replace />;
  }

  return children;
};

export default ProtectedRoute;
