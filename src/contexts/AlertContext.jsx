import React, { createContext, useState, useContext, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import './AlertContext.css';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  // type: 'success', 'error', 'info', 'warning'
  const showAlert = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="alert-container">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-toast alert-${alert.type}`}>
            <div className="alert-icon">
              {alert.type === 'error' && <AlertCircle size={20} />}
              {alert.type === 'success' && <CheckCircle size={20} />}
              {(alert.type === 'info' || alert.type === 'warning') && <Info size={20} />}
            </div>
            <div className="alert-message">{alert.message}</div>
            <button className="alert-close" onClick={() => removeAlert(alert.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
};
