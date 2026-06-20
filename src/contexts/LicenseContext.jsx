import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth, ADMIN_EMAIL } from './AuthContext';

const LicenseContext = createContext({});

export const useLicense = () => useContext(LicenseContext);

export const LicenseProvider = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLicenseData(null);
      setLoading(false);
      return;
    }

    // Superadmin bypass
    if (isAdmin) {
      setLicenseData({
        estado: 'activa',
        tipo: 'admin',
        diasRestantes: 9999,
        isAdmin: true
      });
      setLoading(false);
      return;
    }

    const checkOrCreateLicense = async () => {
      setLoading(true);
      const licenseRef = doc(db, 'licencias', currentUser.uid);
      
      try {
        const docSnap = await getDoc(licenseRef);

        if (!docSnap.exists()) {
          // Create 15-day trial license
          const now = new Date();
          const expireDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
          
          const newLicense = {
            escuelaId: currentUser.uid,
            nombreEscuela: currentUser.displayName || 'Mi Escuela',
            usuarioId: currentUser.uid,
            emailDirector: currentUser.email,
            tipo: 'prueba',
            estado: 'activa',
            fechaInicio: now.toISOString(),
            fechaVencimiento: expireDate.toISOString(),
            diasRestantes: 15,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await setDoc(licenseRef, newLicense);
        }
      } catch (err) {
        console.error("Error creating or fetching license:", err);
      }

      // Start listening to the license changes in real-time
      const unsubscribe = onSnapshot(licenseRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          
          // Calculate remaining days dynamically just in case
          const expire = new Date(data.fechaVencimiento);
          const today = new Date();
          const diffTime = expire - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let estadoReal = data.estado;
          if (estadoReal === 'activa' && diffDays <= 0) {
            estadoReal = 'vencida';
          }

          setLicenseData({
            ...data,
            diasRestantes: diffDays > 0 ? diffDays : 0,
            estadoCalculado: estadoReal
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to license data:", error);
        setLoading(false);
      });

      return unsubscribe;
    };

    let unsubFn = null;
    checkOrCreateLicense().then(unsub => {
      if(unsub) unsubFn = unsub;
    });

    return () => {
      if (unsubFn) unsubFn();
    };

  }, [currentUser, isAdmin]);

  const isTrialExpired = licenseData?.estadoCalculado === 'vencida';

  const value = {
    licenseData,
    isTrialExpired,
    loading
  };

  return (
    <LicenseContext.Provider value={value}>
      {!loading && children}
    </LicenseContext.Provider>
  );
};
