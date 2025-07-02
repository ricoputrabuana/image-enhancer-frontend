import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMW4ppRp18vZPvrAlgTJs1AABaMHvPfes",
  authDomain: "imageenhancer-d012d.firebaseapp.com",
  projectId: "imageenhancer-d012d",
  storageBucket: "imageenhancer-d012d.firebasestorage.app",
  messagingSenderId: "505328322598",
  appId: "1:505328322598:web:24a1cca81def091691bee7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
