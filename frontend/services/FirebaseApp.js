// services/firebaseApp.js
import Constants from 'expo-constants';
import { initializeApp, getApps, setLogLevel } from 'firebase/app';

const extra =
  (Constants.expoConfig && Constants.expoConfig.extra) ||
  (Constants.manifest && Constants.manifest.extra) ||
  {};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.FIREBASE_APP_ID,
};

if (__DEV__) { try { setLogLevel('debug'); } catch {} }

const mask = (s) => (s ? String(s).slice(0, 6) + '…' : '(unset)');
console.log('[FirebaseApp] config', {
  apiKey: mask(firebaseConfig.apiKey),
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  authDomain: firebaseConfig.authDomain,
});

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
