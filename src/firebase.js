import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "process.env.AIzaSyDMW4ppRp18vZPvrAlgTJs1AABaMHvPfes",
  authDomain: "process.env.imageenhancer-d012d.firebaseapp.com",
  projectId: "process.env.imageenhancer-d012d",
  storageBucket: "process.env.imageenhancer-d012d.firebasestorage.app",
  messagingSenderId: "process.env.505328322598",
  appId: "process.env.1:505328322598:web:24a1cca81def091691bee7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
