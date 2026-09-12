import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getMessaging, isSupported as messagingSupported } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-check.js";
import { firebaseConfig, appCheckSiteKey } from "./config.js";

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp, "gs://smarket-45de7.firebasestorage.app");
export const functions = getFunctions(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Keep users signed in across browser restarts.
setPersistence(auth, browserLocalPersistence).catch(console.warn);

// Analytics is optional and must never prevent the marketplace from loading.
analyticsSupported().then(ok => { if (ok) getAnalytics(firebaseApp); }).catch(() => {});

// App Check is optional until a real reCAPTCHA v3 site key is configured.
if (appCheckSiteKey && !appCheckSiteKey.startsWith("REPLACE_")) {
  try {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (e) { console.warn("App Check could not initialize:", e); }
}

export async function getFcmMessaging() {
  try { return await messagingSupported() ? getMessaging(firebaseApp) : null; }
  catch { return null; }
}
