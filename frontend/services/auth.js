// services/auth.js
import { app } from './firebaseApp';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import { getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

let _auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
  console.log('[Auth] initialized with RN persistence');
} catch (e) {
  _auth = getAuth(app);
  console.log('[Auth] reused existing instance');
}

export const auth = _auth;
