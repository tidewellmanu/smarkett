import { auth, db, storage } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";
import { loadCategories } from "./categories.js";
import { populateLocationSelect } from "./locations.js";
import { currentCountry } from "./countries.js";
import { escapeHtml, getParam } from "./utils.js";

const createForm = document.getElementById("listing-form");
const editRoot = document.getElementById("edit-listing");
const status = document.getElementById("form-status");

async function fillCategoryAndLocation() {
  const cats = await loadCategories();
  const select = document.getElementById("category");
  if (select) select.innerHTML = cats.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join("");
  populateLocationSelect(document.getElementById("location"), false);
}

function previewFiles(input, target) {
  if (!input || !target) return;
  target.innerHTML = [...input.files].slice(0, 8)
    .map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join("");
}

document.getElementById("images")?.addEventListener("change", e =>
  previewFiles(e.target, document.getElementById("image-preview")));

createForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const submitButton = createForm.querySelector('button[type="submit"]');
  const imageInput = document.getElementById("images");
  const originalButtonText = submitButton?.textContent || "Publish listing";
  if (submitButton?.disabled) return;

  if (!auth.currentUser) {
    location.href = "login.html?next=sell.html";
    return;
  }

  const setStatus = (text, kind = "") => {
    if (status) {
      status.textContent = text;
      status.dataset.state = kind;
    }
  };

  try {
    submitButton?.setAttribute("disabled", "disabled");
    if (submitButton) submitButton.textContent = "Publishing…";
    setStatus("Creating your listing…");

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const price = Number(document.getElementById("price").value);
    const files = [...(imageInput?.files || [])].slice(0, 8);

    if (title.length < 3 || title.length > 100) throw new Error("Title must be 3–100 characters.");
    if (description.length < 3) throw new Error("Please add a short description.");
    if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");
    if (files.some(file => file.size > 5 * 1024 * 1024)) throw new Error("Each image must be smaller than 5 MB.");
    if (files.some(file => !/^image\/(jpeg|png|webp)$/.test(file.type))) throw new Error("Only JPG, PNG and WebP images are supported.");

    const user = auth.currentUser;
    const data = {
      title,
      description,
      categoryId: document.getElementById("category").value,
      location: document.getElementById("location").value,
      price,
      condition: document.getElementById("condition").value,
      negotiable: document.getElementById("negotiable").checked,
      countryCode: currentCountry(),
      sellerId: user.uid,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      searchTokens: [...new Set((title + " " + description).toLowerCase()
        .split(/[^a-z0-9]+/).filter(x => x.length > 1).slice(0, 80))]
    };

    // Create the Firestore listing first. Image storage must never prevent a
    // valid listing from being created.
    let listingRef;
    try {
      listingRef = await addDoc(collection(db, "listings"), data);
    } catch (err) {
      const code = err?.code || "";
      if (code === "permission-denied") throw new Error("Firebase denied listing creation. Deploy the included Firestore rules and make sure you are signed in.");
      if (code === "failed-precondition") throw new Error("Firestore needs its database/indexes configured. Deploy the included Firebase configuration and try again.");
      if (code === "unavailable" || code === "network-request-failed") throw new Error("Firebase is temporarily unavailable. Check your connection and try again.");
      throw new Error(err?.message || "Could not create the listing in Firebase.");
    }

    let coverImage = "";
    const uploadErrors = [];

    for (const file of files) {
      try {
        setStatus(files.length ? `Uploading image ${Math.min(files.indexOf(file) + 1, files.length)} of ${files.length}…` : "Saving listing…");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const unique = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const r = ref(storage, `listingImages/${user.uid}/${listingRef.id}/${unique}-${safeName}`);
        await uploadBytes(r, file, { contentType: file.type, customMetadata: { ownerId: user.uid, listingId: listingRef.id } });
        const url = await getDownloadURL(r);
        if (!coverImage) coverImage = url;
      } catch (err) {
        console.warn("Listing image upload failed:", err);
        uploadErrors.push(err);
      }
    }

    if (coverImage) {
      try {
        await updateDoc(doc(db, "listings", listingRef.id), { coverImage, updatedAt: serverTimestamp() });
      } catch (err) {
        console.warn("Could not save cover image URL:", err);
      }
    }

    createForm.reset();
    const preview = document.getElementById("image-preview");
    if (preview) preview.innerHTML = "";

    if (uploadErrors.length && files.length) {
      setStatus("Listing submitted for moderation. Your listing was saved, but the image upload failed. You can add images later from My Listings.", "warning");
    } else {
      setStatus("Listing submitted for moderation. You can manage it from My Listings.", "success");
    }
  } catch (err) {
    console.error("Publish listing failed:", err);
    setStatus(err?.message || "Could not publish listing. Please try again.", "error");
  } finally {
    if (submitButton) {
      submitButton.removeAttribute("disabled");
      submitButton.textContent = originalButtonText;
    }
  }
});

async function loadEdit() {
  if (!editRoot) return;
  if (!auth.currentUser) return location.href = "login.html?next=edit-listing.html";
  const id = getParam("id");
  if (!id) return editRoot.innerHTML = '<div class="empty">Missing listing ID.</div>';
  const snap = await getDoc(doc(db, "listings", id));
  if (!snap.exists()) return editRoot.innerHTML = '<div class="empty">Listing not found.</div>';
  const x = snap.data();
  if (x.sellerId !== auth.currentUser.uid) return editRoot.innerHTML = '<div class="empty">You cannot edit this listing.</div>';
  editRoot.innerHTML = `<div class="page-title"><span class="eyebrow">Manage</span><h1>Edit listing</h1></div>
    <form id="edit-form" class="form-card">
      <label>Title<input id="edit-title" maxlength="100" required value="${escapeHtml(x.title||"")}"></label>
      <label>Description<textarea id="edit-description" maxlength="5000" required>${escapeHtml(x.description||"")}</textarea></label>
      <div class="form-grid"><label>Category<select id="edit-category"></select></label>
      <label>Location<select id="edit-location"></select></label></div>
      <div class="form-grid"><label>Price<input id="edit-price" type="number" min="0" step="0.01" required value="${Number(x.price)||0}"></label>
      <label>Condition<select id="edit-condition"><option>New</option><option>Used</option><option>Refurbished</option></select></label></div>
      <label class="check"><input id="edit-negotiable" type="checkbox" ${x.negotiable?"checked":""}> Price is negotiable</label>
      <button class="btn btn-primary" type="submit">Save changes</button><p id="edit-status" class="form-status"></p>
    </form>`;
  const cats = await loadCategories();
  document.getElementById("edit-category").innerHTML = cats.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");
  document.getElementById("edit-category").value = x.categoryId || x.category || "";
  populateLocationSelect(document.getElementById("edit-location"), false);
  document.getElementById("edit-location").value = x.location || "";
  document.getElementById("edit-condition").value = x.condition || "Used";
  document.getElementById("edit-form").addEventListener("submit", async e => {
    e.preventDefault();
    const out = document.getElementById("edit-status");
    try {
      const price = Number(document.getElementById("edit-price").value);
      if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");
      await updateDoc(doc(db,"listings",id), {
        title: document.getElementById("edit-title").value.trim(),
        description: document.getElementById("edit-description").value.trim(),
        categoryId: document.getElementById("edit-category").value,
        location: document.getElementById("edit-location").value,
        price,
        condition: document.getElementById("edit-condition").value,
        negotiable: document.getElementById("edit-negotiable").checked,
        status: "pending",
        updatedAt: serverTimestamp()
      });
      out.textContent = "Changes saved and sent for moderation.";
    } catch (e) { out.textContent = e?.message || "Could not save changes."; }
  });
}

fillCategoryAndLocation().catch(console.warn);
onAuthStateChanged(auth, user => { if (user && editRoot) loadEdit(); });
if (createForm) onAuthStateChanged(auth, user => {
  const note = document.getElementById("auth-note");
  if (!user) { if (note) note.textContent = "You need an account to post a listing. Sign in or create an account above."; return; }
  if (note) note.textContent = user.emailVerified ? "Your account is ready. You can publish a listing." : "Your account is ready. Email verification is recommended for account security.";
});
