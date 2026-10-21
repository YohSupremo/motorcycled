import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const hasCredentials = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    privateKey,
);

const firebaseAdminApp = hasCredentials
  ? getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
  : null;

export const verifyFirebaseIdToken = async (idToken) => {
  if (!firebaseAdminApp) {
    const error = new Error("Firebase server authentication is not configured");
    error.code = "FIREBASE_ADMIN_NOT_CONFIGURED";
    throw error;
  }

  return getAuth(firebaseAdminApp).verifyIdToken(idToken);
};
