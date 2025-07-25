// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3TtMyF_pKtPIA4tJPsJaDjwD5yNF2xoo",
  authDomain: "blueprint-adf22.firebaseapp.com",
  projectId: "blueprint-adf22",
  storageBucket: "blueprint-adf22.firebasestorage.app",
  messagingSenderId: "735482512776",
  appId: "1:735482512776:web:c8a316bebfc0073451263d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();