
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";  
  import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
  import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js"; 

  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCDuRfDqLScG1ss5NUJ71DL9ZoNW6Llptk",
    authDomain: "moviechatbot-c736f.firebaseapp.com",
    projectId: "moviechatbot-c736f",
    storageBucket: "moviechatbot-c736f.firebasestorage.app",
    messagingSenderId: "622390261285",
    appId: "1:622390261285:web:374b2b5f50b231e837b1cc",
    measurementId: "G-W36KBMTK2Q",
    databaseURL: "https://moviechatbot-c736f-default-rtdb.firebaseio.com"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  const auth = getAuth(app)
  const db = getFirestore(app); 
  const database = getDatabase(app);

  export { auth, db, database, ref, push, set };