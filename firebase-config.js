npm install firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAb-36QLk_dOgnRKNTYai3W22O1Avf6Bn0",
  authDomain: "javedanshop.firebaseapp.com",
  projectId: "javedanshop",
  storageBucket: "javedanshop.firebasestorage.app",
  messagingSenderId: "811886915801",
  appId: "1:811886915801:web:9ee1ca9cba6b66d5bb0ec8",
  measurementId: "G-BBHL134YTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
