# MarketHub Firebase setup

This project uses Firebase directly from the browser and Firebase Cloud Functions for secure phone-number reveal.

## Required Firebase Console settings

1. Authentication → Sign-in method:
   - Email/Password: Enabled
   - Google: Enabled
   - Phone: Enabled if phone OTP is required
2. Authentication → Settings → Authorized domains:
   - `smarkett.vercel.app`
   - `smarket-45de7.firebaseapp.com`
   - `smarket-45de7.web.app` (if you use Firebase Hosting)
3. Google OAuth redirect URI should remain the Firebase handler:
   - `https://smarket-45de7.firebaseapp.com/__/auth/handler`
4. Firestore Database must be created in the `smarket-45de7` project.
5. Deploy `firebase/firestore.rules` and `firebase/firestore.indexes.json`.
6. Deploy `firebase/storage.rules`.
7. If App Check enforcement is enabled, configure the reCAPTCHA v3 site key in `js/config.js` first.
8. Deploy the Cloud Functions from the `functions/` directory for phone reveal.

## Vercel

The Vercel site is `https://smarkett.vercel.app`. Vercel hosts the static frontend; Firebase remains responsible for Authentication, Firestore, Storage and Functions.

## Important

Never put a Firebase service-account private key in this frontend repository. The Firebase web configuration is intended for browser use; Firestore/Storage rules and server-side Functions enforce access control.
