import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDdJm_ezwAwEC7J7hY3SHZ8tvdrN3PbIi0",
    authDomain: "theovs-46144.firebaseapp.com",
    projectId: "theovs-46144",
    storageBucket: "theovs-46144.firebasestorage.app",
    messagingSenderId: "432386619256",
    appId: "1:432386619256:web:3115063f1b04e896b87a8d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;