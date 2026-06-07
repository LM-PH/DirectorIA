import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Registrar/actualizar perfil en la colección de admin
        await saveUserProfile(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    schoolId: currentUser?.uid || null,
    isAdmin: currentUser?.email === ADMIN_EMAIL,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
