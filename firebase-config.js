/* =========================================================
   FIREBASE CONFIG 
   ======================================================== */
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

// Initialize Firebase (compat SDKs, loaded via <script> tags in index.html / admin.html)
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Note: it is normal and safe for this config (including the "apiKey") to be
// public / visible in your website's source code. Firebase apps are secured
// by the Firestore & Storage Security Rules (see firestore.rules and
// storage.rules), not by hiding this config. Real security comes from those
// rules plus real user login (Firebase Authentication) — not from secrecy
// of this file.
