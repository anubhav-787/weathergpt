import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Uses a Firebase service account (free — generate from Project Settings > Service Accounts).
// Store these three values as env vars, never commit the JSON file.
const adminApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Vercel/most hosts store multi-line keys with literal \n — convert back to real newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      })
    : getApps()[0];

export const messaging = getMessaging(adminApp);

/**
 * Sends a single push notification and returns { ok, error }.
 * Callers should clear the stored fcmToken when ok is false with a
 * "not-registered" style error, since that means the token is dead.
 */
export async function sendPushToToken(token, { title, body, data = {}, icon = "/icons/rain-192.png" }) {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      webpush: {
        notification: { title, body, icon },
        fcmOptions: { link: "/" },
      },
      data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
    });
    return { ok: true };
  } catch (error) {
    console.error("FCM send error:", error?.errorInfo?.code || error.message);
    return { ok: false, error: error?.errorInfo?.code || error.message };
  }
}
