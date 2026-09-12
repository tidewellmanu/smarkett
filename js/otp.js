import { auth, db } from "./firebase.js";
import {
  RecaptchaVerifier, linkWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

let confirmationResult = null;
let verifier = null;
const status = document.getElementById("otp-status");
const msg = x => { if (status) status.textContent = x?.message || x || ""; };

async function setupRecaptcha() {
  const container = document.getElementById("recaptcha-container");
  if (!container) throw new Error("reCAPTCHA container is missing.");
  if (verifier) return verifier;
  verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "normal" });
  await verifier.render();
  return verifier;
}

function resetRecaptcha() {
  try { verifier?.clear(); } catch {}
  verifier = null;
}

document.getElementById("send-otp")?.addEventListener("click", async () => {
  if (!auth.currentUser) return msg("Please sign in before verifying your phone number.");
  const phone = document.getElementById("phone").value.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(phone))
    return msg("Enter a valid international number, e.g. +233241234567.");
  try {
    msg("Sending OTP…");
    await setupRecaptcha();
    confirmationResult = await linkWithPhoneNumber(auth.currentUser, { phoneNumber: phone }, verifier);
    msg("OTP sent. Enter the 6-digit code you received.");
  } catch (e) {
    resetRecaptcha();
    const text = e?.code === "auth/too-many-requests" ? "Too many attempts. Please wait before requesting another OTP."
      : e?.code === "auth/invalid-phone-number" ? "Enter a valid international phone number."
      : e?.code === "auth/phone-number-already-exists" || e?.code === "auth/credential-already-in-use" ? "That phone number is already attached to another account."
      : e?.message || "Could not send OTP.";
    msg(text);
  }
});

document.getElementById("confirm-otp")?.addEventListener("click", async () => {
  if (!auth.currentUser || !confirmationResult) return msg("Request an OTP first.");
  const code = document.getElementById("otp").value.trim();
  if (!/^\d{6}$/.test(code)) return msg("Enter the 6-digit OTP.");
  try {
    msg("Verifying…");
    await confirmationResult.confirm(code);
  } catch (e) {
    // The confirmation succeeds in Firebase even if a Firestore write is unavailable.
    if (e?.code === "auth/invalid-verification-code") return msg("The OTP is incorrect. Please try again.");
    if (e?.code === "auth/code-expired") return msg("The OTP has expired. Request a new one.");
    msg(e?.message || "Could not verify the phone number.");
    return;
  }
  try {
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      phone: auth.currentUser.phoneNumber || document.getElementById("phone").value.trim(),
      phoneVerified: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
    confirmationResult = null;
    msg("Phone number verified successfully.");
  } catch (e) {
    msg("Phone verified, but the profile could not be updated. Please refresh and try again.");
  }
});
