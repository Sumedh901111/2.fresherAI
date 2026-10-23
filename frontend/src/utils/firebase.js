
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: "AIzaSyAQB9TQDJ-9aJCNWaemjeHAgmY5D7JZWWM",
  authDomain: "ai-interview-2b112.firebaseapp.com",
  projectId: "ai-interview-2b112",
  storageBucket: "ai-interview-2b112.firebasestorage.app",
  messagingSenderId: "617411393026",
  appId: "1:617411393026:web:12bff49d9a065c50ee591b"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}