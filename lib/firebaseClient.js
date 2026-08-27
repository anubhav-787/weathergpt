import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// Client config values and the VAPID key are public by design. The fallbacks
// keep the static service-worker configuration and the client bundle aligned.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAcB2LsmKsM5Q4OjvnYDOXEksgQuUop9AU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "weathergpt-alert.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "weathergpt-alert",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "weathergpt-alert.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "861650616167",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:861650616167:web:ae57d56cfa7136bd7e79c2",
};
const firebaseVapidKey =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "BFAADWX5rTQshjVmm-LsQlViDZkZrtsdDKolHMIExzVEhNOOiXFq_BO0bOsYHT---t3e9IFuZv10muVpUokBLRk";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Asks the browser for notification permission, registers the service worker,
 * and returns an FCM token to store against the user's clerkId. Returns null
 * if unsupported (e.g. Safari <16.4, or permission denied).
 */
export async function requestNotificationPermission() {
  try {
    const supported = await isSupported();
    if (!supported || typeof window === "undefined") return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error("Notification permission / token error:", error);
    return null;
  }
}

/** Optional: shows a toast/alert for pushes that arrive while the tab is open and focused. */
export async function listenForForegroundMessages(onMessageReceived) {
  const supported = await isSupported();
  if (!supported) return;
  const messaging = getMessaging(app);
  onMessage(messaging, (payload) => onMessageReceived(payload));
}