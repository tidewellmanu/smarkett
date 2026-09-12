const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

const db = getFirestore();

exports.revealPhone = onCall({ enforceAppCheck: false }, async request => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");

  const viewerId = request.auth.uid;
  const listingId = request.data?.listingId;
  if (typeof listingId !== "string" || !listingId)
    throw new HttpsError("invalid-argument", "Listing ID required.");

  const listingSnap = await db.doc(`listings/${listingId}`).get();
  if (!listingSnap.exists)
    throw new HttpsError("not-found", "Listing not found.");

  const listing = listingSnap.data();
  if (listing.status !== "active")
    throw new HttpsError("failed-precondition", "Listing is not active.");
  if (listing.sellerId === viewerId)
    throw new HttpsError("failed-precondition", "This is your listing.");

  // Sliding-window rate limit: 20 reveals per viewer per hour.
  const since = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
  const recent = await db.collection("phoneReveals")
    .where("viewerId", "==", viewerId)
    .where("createdAt", ">", since)
    .limit(21)
    .get();

  if (recent.size >= 20)
    throw new HttpsError("resource-exhausted", "Phone reveal limit reached. Try again later.");

  const userSnap = await db.doc(`users/${listing.sellerId}`).get();
  const phone = userSnap.exists ? userSnap.data().phone : "";
  if (!phone)
    throw new HttpsError("not-found", "Seller phone is unavailable.");

  await db.collection("phoneReveals").add({
    viewerId,
    listingId,
    sellerId: listing.sellerId,
    createdAt: FieldValue.serverTimestamp()
  });

  return { phone };
});
