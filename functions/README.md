# Backend function

`phone-reveal.js` is a server-side Firebase Cloud Function. It keeps seller phone numbers out of public listing documents and records reveal attempts for abuse controls.

The frontend remains static HTML/CSS/ES modules with no npm/build pipeline.

Important constraint: Firebase Cloud Functions require a supported server runtime and Firebase deployment tooling. If the “no Node.js” requirement is intended to ban Node.js on the backend as well, a secure callable Cloud Function cannot be implemented under that requirement; use an approved server-side runtime/service instead. Never move seller phone numbers into public Firestore documents just to avoid the backend function.