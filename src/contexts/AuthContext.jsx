import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// ⚠️ Solo este correo puede acceder al panel de administrador
export const ADMIN_EMAIL = 'zlagustin10@gmail.com';

const saveUserProfile = async (user) => {
  if (!user) return;
  try {
    const ref = doc(db, '_admin_users', user.uid);
    await setDoc(ref, {
      uid: user.uid,
      nombre: user.displayName || '',
      email: user.email || '',
      fotoUrl: user.photoURL || '',
      ultimoAcceso: serverTimestamp(),
    }, { merge: true }); // merge: true preserva campos existentes (pagado, notas, etc.)

    // Primer registro: solo se escribe si no existe aún
    await setDoc(ref, {
      fechaRegistro: serverTimestamp(),
      pagado: false,
      suspendido: false,
      notas: '',
    }, { merge: true });
  } catch (e) {
    // Silencioso — no interrumpe el flujo de login
    console.warn('Could not save user profile to admin collection:', e.message);
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  // 1. Escuchar estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await saveUserProfile(user);
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 2. Escuchar en tiempo real el perfil del usuario de _admin_users
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const docRef = doc(db, '_admin_users', currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile({});
      }
      setProfileLoading(false);
    }, (error) => {
      console.warn("Could not listen to user profile in _admin_users:", error.message);
      setProfileLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Lógica de Suscripción y Bloqueo Manual
  const isSuspended = userProfile?.suspendido === true;
  const isPaid = userProfile?.pagado === true;
  
  // El super-admin está exento de cualquier bloqueo de pago
  const isAccessBlocked = currentUser?.email !== ADMIN_EMAIL && isSuspended;

  const value = {
    currentUser,
    schoolId: currentUser?.uid || null,
    isAdmin: currentUser?.email === ADMIN_EMAIL,
    isPaid,
    isSuspended,
    isAccessBlocked,
    profileLoading,
    userProfile,
    login,
    loginWithGoogle,
    logout
  };

  const contextLoading = loading || (currentUser && profileLoading);

  return (
    <AuthContext.Provider value={value}>
      {!contextLoading && children}
    </AuthContext.Provider>
  );
};
