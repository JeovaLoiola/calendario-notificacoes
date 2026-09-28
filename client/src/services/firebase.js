import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

const STORAGE_KEY = 'firebase_client_config';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBsn642yhUIosnFJWjj4Wx36aLij8s6ls4",
  authDomain: "calendario-notificacoes.firebaseapp.com",
  projectId: "calendario-notificacoes",
  storageBucket: "calendario-notificacoes.firebasestorage.app",
  messagingSenderId: "111012896537",
  appId: "1:111012896537:web:0a4d15f3553060d208af88",
  measurementId: "G-ZR849GHT5G"
};

/**
 * Recupera as credenciais do Firebase (via variáveis de ambiente Vite, localStorage ou padrão)
 */
export function getFirebaseConfig() {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
  };

  // Se houver API key configurada no .env ou padrão
  if (envConfig.apiKey && envConfig.apiKey !== 'SUA_API_KEY_AQUI') {
    return { ...envConfig, source: 'env' };
  }

  // Caso contrário, tenta recuperar do localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey) {
        return { ...parsed, source: 'local' };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler configuração do Firebase do localStorage:', e);
  }

  return { ...DEFAULT_FIREBASE_CONFIG, source: 'default' };
}

/**
 * Salva as credenciais do Firebase no localStorage
 */
export function saveCustomFirebaseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Reiniciar a instância
    window.location.reload();
  } catch (e) {
    console.error('Erro ao salvar configuração do Firebase:', e);
  }
}

// Inicializar app do Firebase se houver configuração válida
let app = null;
let auth = null;
let analytics = null;

const currentConfig = getFirebaseConfig();

if (currentConfig.apiKey && currentConfig.apiKey.length > 5) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(currentConfig);
    auth = getAuth(app);
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch((err) => {
        console.warn('Firebase Analytics não inicializado:', err);
      });
    }
  } catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
  }
}

export { app, auth, analytics };

/**
 * Login com E-mail e Senha
 */
export async function loginWithEmail(email, password) {
  if (!auth) throw new Error('Firebase não está configurado com as chaves do projeto.');
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Criar Conta com Nome, E-mail e Senha
 */
export async function registerWithEmail(name, email, password) {
  if (!auth) throw new Error('Firebase não está configurado com as chaves do projeto.');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name && credential.user) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential.user;
}

/**
 * Login com Google
 */
export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase não está configurado com as chaves do projeto.');
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

/**
 * Logout
 */
export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Recuperação de Senha
 */
export async function resetUserPassword(email) {
  if (!auth) throw new Error('Firebase não está configurado com as chaves do projeto.');
  await sendPasswordResetEmail(auth, email);
}

/**
 * Observador do estado de autenticação
 */
export function subscribeToAuthChanges(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
