import { auth, googleProvider, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup,
  sendPasswordResetEmail, sendEmailVerification, onAuthStateChanged, signOut,
  updatePassword, confirmPasswordReset, reload
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const status = $("auth-status");
const msg = e => { if (status) status.textContent = e?.message || e || ""; };

function friendlyError(e) {
  const map = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Use a stronger password (at least 6 characters).",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase Authentication.",
    "auth/unauthorized-domain": "This website is not authorized in Firebase Authentication. Add smarkett.vercel.app under Authorized domains.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in popup. Allow popups for this site and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/web-storage-unsupported": "Browser storage is unavailable. Disable strict/private storage blocking and try again.",
    "auth/requires-recent-login": "Please sign in again before changing this security setting."
  };
  return map[e?.code] || e?.message || "Something went wrong.";
}

async function ensureUserProfile(user, extra = {}) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const common = {
    displayName: extra.displayName ?? user.displayName ?? "",
    email: user.email || "",
    phone: extra.phone ?? user.phoneNumber ?? "",
    verificationStatus: user.emailVerified ? "verified" : "email_pending",
    updatedAt: serverTimestamp()
  };
  if (!snap.exists()) {
    await setDoc(ref, {
      ...common,
      role: "user",
      accountStatus: "active",
      createdAt: serverTimestamp()
    });
  } else {
    // Never attempt to rewrite role/accountStatus on an existing profile.
    // This prevents a normal sign-in from conflicting with admin/moderator rules.
    await setDoc(ref, common, { merge: true });
  }
}

async function requireProfile(user) {
  if (user) {
    try { await ensureUserProfile(user); } catch (e) { console.warn("Profile sync failed", e); }
  }
}
onAuthStateChanged(auth, requireProfile);

$("login-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
    location.href = new URLSearchParams(location.search).get("next") || "dashboard.html";
  } catch (x) { msg(friendlyError(x)); }
});

$("google-login")?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    location.href = new URLSearchParams(location.search).get("next") || "dashboard.html";
  } catch (x) { msg(friendlyError(x)); }
});

$("register-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  const displayName = $("name").value.trim();
  const phone = $("phone")?.value.trim() || "";
  if (password.length < 6) return msg("Use a password with at least 6 characters.");
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(result.user, { displayName, phone });
    try { await sendEmailVerification(result.user); } catch (mailError) { console.warn("Verification email could not be sent:", mailError); }
    location.href = "dashboard.html?welcome=1";
  } catch (x) { msg(friendlyError(x)); }
});

$("forgot-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await sendPasswordResetEmail(auth, $("email").value.trim());
    msg("If an account exists for that email, a password-reset email has been sent.");
  } catch (x) { msg(friendlyError(x)); }
});

$("refresh-verification")?.addEventListener("click", async () => {
  try {
    if (!auth.currentUser) return msg("Please sign in first.");
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        verificationStatus: "verified", updatedAt: serverTimestamp()
      }, { merge: true });
      msg("Email verified. You can now continue.");
    } else msg("Your email is not verified yet. Open the verification email and try again.");
  } catch (x) { msg(friendlyError(x)); }
});

$("resend-verification")?.addEventListener("click", async () => {
  try {
    if (!auth.currentUser) return msg("Please sign in first.");
    if (auth.currentUser.emailVerified) return msg("Your email is already verified.");
    await sendEmailVerification(auth.currentUser);
    msg("Verification email sent again.");
  } catch (x) { msg(friendlyError(x)); }
});

$("logout")?.addEventListener("click", async () => {
  try { await signOut(auth); location.href = "index.html"; } catch (x) { msg(friendlyError(x)); }
});

$("reset-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const code = new URLSearchParams(location.search).get("oobCode");
  if (!code) return msg("This password-reset link is invalid or incomplete.");
  try {
    const password = $("password").value;
    if (password.length < 6) return msg("Use a password with at least 6 characters.");
    await confirmPasswordReset(auth, code, password);
    msg("Password updated. Redirecting to sign in…");
    setTimeout(() => location.href = "login.html", 900);
  } catch (x) { msg(friendlyError(x)); }
});

// Exported for phone-linking and other modules.
export { ensureUserProfile, friendlyError };
