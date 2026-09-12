import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc, getDoc, collection, query, where, orderBy, limit, getDocs,
  updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { escapeHtml, imageOrPlaceholder } from "./utils.js";
import { formatPrice } from "./countries.js";

const panel = document.getElementById("admin-panel") || document.getElementById("dashboard");

onAuthStateChanged(auth, async user => {
  if (!panel) return;
  if (!user) return panel.innerHTML = '<div class="empty">Please sign in.</div>';
  try {
    const u = await getDoc(doc(db, "users", user.uid));
    const isAdmin = u.exists() && u.data().role === "admin";
    const isAdminPage = location.pathname.includes("admin");
    if (isAdminPage && !isAdmin) return panel.innerHTML = '<div class="empty">Admin access required.</div>';

    if (!isAdminPage) {
      panel.innerHTML = `<div class="dashboard-grid">
        <a class="stat-card" href="my-listings.html"><b>My listings</b><span>Manage your posts</span></a>
        <a class="stat-card" href="favorites.html"><b>Favorites</b><span>Saved items</span></a>
        <a class="stat-card" href="saved-searches.html"><b>Saved searches</b><span>Alerts and searches</span></a>
        <a class="stat-card" href="profile.html"><b>Profile</b><span>Account details</span></a>
        <a class="stat-card" href="notifications.html"><b>Notifications</b><span>Updates</span></a>
        ${isAdmin ? '<a class="stat-card" href="admin.html"><b>Admin</b><span>Moderation console</span></a>' : ''}
      </div>`;
      return;
    }

    const pending = await getDocs(query(
      collection(db, "listings"), where("status", "==", "pending"),
      orderBy("createdAt", "desc"), limit(50)
    ));
    const cards = pending.docs.map(d => {
      const x = d.data();
      return `<article class="stat-card">
        <img class="thumb" loading="lazy" src="${imageOrPlaceholder(x.coverImage,x.title)}" alt="">
        <strong>${escapeHtml(x.title || "Untitled")}</strong>
        <p>${formatPrice(x.price,x.countryCode)} · ${escapeHtml(x.location||"")}</p>
        <div class="form-grid">
          <button class="btn btn-primary moderate" data-id="${d.id}" data-status="active">Approve</button>
          <button class="btn btn-secondary moderate" data-id="${d.id}" data-status="rejected">Reject</button>
        </div>
      </article>`;
    }).join("");

    panel.innerHTML = `<div class="page-title"><span class="eyebrow">Moderation</span>
      <h1>Admin console</h1><p class="meta">${pending.size} pending listing(s)</p></div>
      <div class="dashboard-grid">
        <a class="stat-card" href="admin-listings.html">Listings</a>
        <a class="stat-card" href="admin-users.html">Users</a>
        <a class="stat-card" href="admin-reports.html">Reports</a>
        <a class="stat-card" href="admin-categories.html">Categories</a>
        <a class="stat-card" href="admin-reviews.html">Reviews</a>
        <a class="stat-card" href="admin-audit-logs.html">Audit logs</a>
      </div>
      <section class="section"><h2>Pending listings</h2>
      <div class="dashboard-grid">${cards || '<div class="empty">No listings waiting for moderation.</div>'}</div></section>`;

    panel.querySelectorAll(".moderate").forEach(btn => btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await updateDoc(doc(db,"listings",btn.dataset.id), {
          status: btn.dataset.status, updatedAt: serverTimestamp(),
          moderatedBy: user.uid, moderatedAt: serverTimestamp()
        });
        btn.closest(".stat-card").remove();
      } catch (e) {
        btn.disabled = false;
        alert(e?.message || "Could not update listing.");
      }
    }));
  } catch (e) {
    panel.innerHTML = `<div class="empty">${escapeHtml(e?.message || "Unable to load this page.")}</div>`;
  }
});
