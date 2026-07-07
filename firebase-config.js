/* =========================================================
   FIREBASE CONFIG — REPLACE WITH YOUR OWN PROJECT'S KEYS
   =========================================================
   Where to get these values:
   1. Go to https://console.firebase.google.com and create a project
      (name it e.g. "javedan-online-shop").
   2. In the project, click the "</>" (Web) icon to register a web app.
   3. Firebase will show you an object exactly like the one below —
      copy your real values into firebaseConfig here.
   4. See README.md for the full step-by-step setup guide.
   ========================================================= */

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Initialize Firebase (compat SDKs, loaded via <script> tags in index.html / admin.html)
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Note: it is normal and safe for this config (including the "apiKey") to be
// public / visible in your website's source code. Firebase apps are secured
// by the Firestore & Storage Security Rules (see firestore.rules and
// storage.rules), not by hiding this config. Real security comes from those
// rules plus real user login (Firebase Authentication) — not from secrecy
// of this file.
