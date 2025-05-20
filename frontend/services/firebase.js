import { initializeApp } from 'firebase/app';

//  CURRENT for Expo Go (no persistence)
import { getAuth } from 'firebase/auth';

//  WHEN READY FOR PRODUCTION (persistent login):
// Replace above line with:
// import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC67NDLPWjqDjuQgCm0wI86CaV7en138DA",
  authDomain: "virtual-closet-outfit-planner.firebaseapp.com",
  projectId: "virtual-closet-outfit-planner",
  storageBucket: "virtual-closet-outfit-planner.firebasestorage.app",
  messagingSenderId: "970548662630",
  appId: "1:970548662630:web:63a0d2a47ebcd7830478a7"
};

const app = initializeApp(firebaseConfig);

//   CURRENT for Expo Go.
const auth = getAuth(app);

//   WHEN READY FOR PRODUCTION:
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });

const db = getFirestore(app);

export { auth, db };