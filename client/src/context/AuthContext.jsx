import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  resetUserPassword,
  subscribeToAuthChanges,
  getFirebaseConfig,
  saveCustomFirebaseConfig
} from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseConfig, setFirebaseConfig] = useState(getFirebaseConfig());

  const isConfigured = Boolean(auth && firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const handleLogin = async (email, password) => {
    const user = await loginWithEmail(email, password);
    setCurrentUser(user);
    return user;
  };

  const handleRegister = async (name, email, password) => {
    const user = await registerWithEmail(name, email, password);
    setCurrentUser(user);
    return user;
  };

  const handleGoogleLogin = async () => {
    const user = await loginWithGoogle();
    setCurrentUser(user);
    return user;
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const handleResetPassword = async (email) => {
    await resetUserPassword(email);
  };

  const handleSaveConfig = (newConfig) => {
    saveCustomFirebaseConfig(newConfig);
    setFirebaseConfig(newConfig);
  };

  const value = {
    currentUser,
    loading,
    isConfigured,
    firebaseConfig,
    login: handleLogin,
    register: handleRegister,
    loginWithGoogle: handleGoogleLogin,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    saveConfig: handleSaveConfig
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
