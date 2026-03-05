import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

// NutriRoot - Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBH8-lzi0tdTd6PO5KTKliErz-gLyh1_6I",
    authDomain: "nutriroot-9dcdc.firebaseapp.com",
    projectId: "nutriroot-9dcdc",
    storageBucket: "nutriroot-9dcdc.firebasestorage.app",
    messagingSenderId: "1020174292074",
    appId: "1:1020174292074:web:102ac5f8b16dcabe356613"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
