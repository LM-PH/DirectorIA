import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ConfigContext = createContext({});

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setConfig(null);
      setLoadingConfig(false);
      return;
    }

    setLoadingConfig(true);
    // Escuchar cambios en tiempo real en la configuración de la escuela
    const docRef = doc(db, 'schools', currentUser.uid, 'configuracion', 'general');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      } else {
        setConfig({}); // No hay configuración aún
      }
      setLoadingConfig(false);
    }, (error) => {
      console.error("Error obteniendo configuración:", error);
      setLoadingConfig(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const value = {
    config,
    loadingConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};
