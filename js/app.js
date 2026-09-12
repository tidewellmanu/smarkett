import { renderShell } from "./ui.js";
import { db } from "./firebase.js";
import { collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { formatPrice, currentCountry } from "./countries.js";
import { escapeHtml, imageOrPlaceholder } from "./utils.js";

const urlCountry = new URLSearchParams(location.search).get("country");
if (urlCountry) localStorage.setItem("mh_country", urlCountry.toUpperCase());
renderShell();

async function homeListings() {
  const grid = document.getElementById("listing-grid");
  if (!grid) return;
  try {
    // Keep the homepage usable even when the optional composite Firestore index
    // has not yet been deployed. We only require the simple status filter here,
    // then sort/filter the small result set client-side.
    const s = await getDocs(query(
      collection(db, "listings"),
      where("status", "==", "active"),
      limit(100)
    ));
    const country = currentCountry();
    const docs = s.docs
      .map(d => ({ id: d.id, data: d.data() }))
      .filter(({ data: x }) => !country || String(x.countryCode || "GH").toUpperCase() === country.toUpperCase())
      .sort((a, b) => {
        const av = a.data.createdAt?.toMillis?.() || (a.data.createdAt?.seconds || 0) * 1000 || 0;
        const bv = b.data.createdAt?.toMillis?.() || (b.data.createdAt?.seconds || 0) * 1000 || 0;
        return bv - av;
      })
      .slice(0, 24);
    if (!docs.length) {
      grid.innerHTML = "";
      document.getElementById("home-empty")?.classList.remove("hidden");
      return;
    }
    grid.innerHTML = docs.map(({ id, data: x }) => {
      return `<a class="listing-card" href="listing.html?id=${encodeURIComponent(d.id)}">
        <img class="thumb" loading="lazy" src="${imageOrPlaceholder(x.coverImage,x.title)}" alt="${escapeHtml(x.title)}">
        <div class="body"><h3>${escapeHtml(x.title)}</h3>
        <div class="price">${formatPrice(x.price,x.countryCode)}</div>
        <div class="meta">${escapeHtml(x.location||"Ghana")}</div></div></a>`;
    }).join("");
  } catch (e) {
    console.error("Unable to load homepage listings", e);
    const code = e?.code || "unknown";
    let message = "We couldn't load listings right now.";
    if (code === "permission-denied") message = "Firestore denied access to listings. Deploy firebase/firestore.rules and make sure active listings are allowed for public reads.";
    else if (code === "failed-precondition") message = "Firestore needs a configuration/index update. Open Firebase Console and check Firestore Database and indexes.";
    else if (code === "unavailable") message = "Firestore is temporarily unavailable. Check your internet connection and Firebase project status.";
    else if (code === "not-found") message = "The Firebase Firestore database has not been created for this project.";
    console.error("Homepage Firestore error:", { code, message: e?.message, error: e });
    grid.innerHTML = `<div class="empty"><strong>${escapeHtml(message)}</strong><br><small>Error code: ${escapeHtml(code)}</small><br><button id="retry-listings" class="btn btn-secondary" type="button">Retry</button></div>`;
    document.getElementById("retry-listings")?.addEventListener("click", () => homeListings());
  }
}

const heroSearch = document.getElementById("heroSearch");
heroSearch?.addEventListener("submit", e => {
  e.preventDefault();
  const q = document.getElementById("heroQuery")?.value.trim() || "";
  const locationValue = document.getElementById("heroLocation")?.value || "";
  location.href = `search.html?q=${encodeURIComponent(q)}&location=${encodeURIComponent(locationValue)}`;
});

if (document.getElementById("listing-grid")) homeListings();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
}
