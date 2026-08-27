importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// These are public client config values and must match lib/firebaseClient.js.
firebase.initializeApp({
  apiKey: "AIzaSyAcB2LsmKsM5Q4OjvnYDOXEksgQuUop9AU",
  authDomain: "weathergpt-alert.firebaseapp.com",
  projectId: "weathergpt-alert",
  storageBucket: "weathergpt-alert.firebasestorage.app",
  messagingSenderId: "861650616167",
  appId: "1:861650616167:web:ae57d56cfa7136bd7e79c2",
});

const messaging = firebase.messaging();
