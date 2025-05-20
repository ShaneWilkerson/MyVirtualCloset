// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC67NDLPWjqDjuQgCm0wI86CaV7en138DA",
  authDomain: "virtual-closet-outfit-planner.firebaseapp.com",
  projectId: "virtual-closet-outfit-planner",
  storageBucket: "virtual-closet-outfit-planner.firebasestorage.app",
  messagingSenderId: "970548662630",
  appId: "1:970548662630:web:63a0d2a47ebcd7830478a7",
  //measurementId: "G-GNVCRWHYCS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export { db };