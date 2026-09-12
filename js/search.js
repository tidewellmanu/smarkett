/* Efficient marketplace search: keyword + filters + relevance ranking */
import { db } from "./firebase.js";
import { escapeHtml, imageOrPlaceholder } from "./utils.js";
import { formatPrice } from "./countries.js";
import {
  collection, query, where, orderBy, limit, getDocs,
  startAfter, documentId
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const PAGE_SIZE = 24;
const MAX_FALLBACK_SCAN = 400;

function normalize(value="") {
  return value.toString().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ").trim();
}

function terms(q) {
  return [...new Set(normalize(q).split(" ").filter(x => x.length >= 2))];
}

function haystack(item) {
  return normalize([
    item.title, item.description, item.category, item.subcategory,
    item.region, item.city, item.location, item.brand, item.model,
    ...(Array.isArray(item.searchKeywords) ? item.searchKeywords : [])
  ].join(" "));
}

function relevance(item, queryText) {
  const q = normalize(queryText);
  if (!q) return 0;
  const h = haystack(item);
  const ts = terms(q);
  let score = 0;

  if (normalize(item.title) === q) score += 1000;
  if (normalize(item.title).startsWith(q)) score += 450;
  if (normalize(item.title).includes(q)) score += 300;
  if (h.includes(q)) score += 150;

  for (const t of ts) {
    if (normalize(item.title).includes(t)) score += 80;
    else if (h.includes(t)) score += 25;
  }

  // Useful marketplace signals.
  if (item.featured) score += 18;
  if (item.verifiedSeller) score += 12;
  if (item.condition === "new") score += 5;
  if (item.updatedAt) score += 1;
  return score;
}

function matches(item, queryText) {
  const ts = terms(queryText);
  if (!ts.length) return true;
  const h = haystack(item);
  // Every keyword must be represented somewhere so a multi-word query stays useful.
  return ts.every(t => h.includes(t));
}

async function fetchActiveListings(filters={}) {
  const ref = collection(db, "listings");
  const constraints = [
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(MAX_FALLBACK_SCAN)
  ];

  if (filters.countryCode) {
    constraints.splice(1, 0, where("countryCode", "==", filters.countryCode));
  }
  if (filters.category) {
    constraints.splice(1, 0, where("categoryId", "==", filters.category));
  }

  try {
    const snap = await getDocs(query(ref, ...constraints));
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  } catch (err) {
    // If an optional compound index is not ready, fall back to the simplest active query.
    const snap = await getDocs(query(
      ref, where("status","==","active"), limit(MAX_FALLBACK_SCAN)
    ));
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  }
}

export async function searchListings({q="", countryCode="", category=""}={}) {
  const all = await fetchActiveListings({countryCode, category});
  const filtered = all.filter(x => matches(x, q));
  filtered.sort((a,b) => relevance(b,q) - relevance(a,q));
  return filtered;
}

export async function getRecommendations(currentListing, options={}) {
  const all = await fetchActiveListings({countryCode: currentListing.countryCode});
  const currentTerms = terms([
    currentListing.title,
    currentListing.category,
    currentListing.subcategory,
    currentListing.brand,
    currentListing.model,
    ...(currentListing.searchKeywords || [])
  ].join(" "));

  const score = (item) => {
    if (item.id === currentListing.id) return -Infinity;
    const h = haystack(item);
    let s = 0;

    if (item.category && item.category === currentListing.category) s += 70;
    if (item.subcategory && item.subcategory === currentListing.subcategory) s += 35;
    if (item.region && item.region === currentListing.region) s += 20;
    if (item.city && item.city === currentListing.city) s += 15;
    if (item.condition && item.condition === currentListing.condition) s += 8;

    for (const t of currentTerms) {
      if (h.includes(t)) s += 8;
      if (normalize(item.title).includes(t)) s += 18;
    }

    // Gentle price proximity preference when both prices are numeric.
    const a = Number(currentListing.price), b = Number(item.price);
    if (Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0) {
      const ratio = Math.abs(b-a) / a;
      if (ratio <= .10) s += 20;
      else if (ratio <= .25) s += 10;
    }

    if (item.featured) s += 8;
    if (item.verifiedSeller) s += 5;
    return s;
  };

  return all
    .map(item => ({item, score:score(item)}))
    .filter(x => Number.isFinite(x.score) && x.score > 0)
    .sort((a,b) => b.score-a.score)
    .slice(0, options.limit || 12)
    .map(x => x.item);
}

export { normalize, relevance, matches };

async function initSearchPage() {
  const results = document.getElementById("results");
  const form = document.getElementById("filters");
  if (!results || !form) return;

  const { currentCountry } = await import("./countries.js");
  const { loadCategories } = await import("./categories.js");
  const { populateLocationSelect } = await import("./locations.js");
  const params = new URLSearchParams(location.search);
  const qEl = document.getElementById("q");
  const catEl = document.getElementById("category");
  const locEl = document.getElementById("location");
  const sortEl = document.getElementById("sort");

  qEl.value = params.get("q") || "";
  const cats = await loadCategories();
  catEl.innerHTML = '<option value="">All categories</option>' +
    cats.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");
  catEl.value = params.get("category") || "";
  populateLocationSelect(locEl, false);
  locEl.value = params.get("location") || "";

  let all = [];
  let shown = 0;

  const render = () => {
    const sort = sortEl.value;
    const copy = [...all];
    if (sort === "price-low") copy.sort((a,b) => Number(a.price)-Number(b.price));
    else if (sort === "price-high") copy.sort((a,b) => Number(b.price)-Number(a.price));
    else if (!qEl.value.trim()) copy.sort((a,b) => {
      const at = a.createdAt?.seconds || 0, bt = b.createdAt?.seconds || 0;
      return bt-at;
    });

    const page = copy.slice(0, shown);
    results.innerHTML = page.map(x => `<a class="listing-card" href="listing.html?id=${encodeURIComponent(x.id)}">
      <img class="thumb" loading="lazy" src="${imageOrPlaceholder(x.coverImage,x.title)}" alt="${escapeHtml(x.title||"Listing")}">
      <div class="body"><h3>${escapeHtml(x.title||"Untitled")}</h3>
      <div class="price">${formatPrice(x.price,x.countryCode)}</div>
      <div class="meta">${escapeHtml(x.location||"Ghana")}</div></div></a>`).join("") ||
      '<div class="empty">No matching listings found.</div>';
    document.getElementById("load-more").classList.toggle("hidden", shown >= copy.length);
  };

  const run = async () => {
    results.innerHTML = '<div class="empty">Loading listings…</div>';
    try {
      all = await searchListings({
        q: qEl.value.trim(),
        countryCode: currentCountry(),
        category: catEl.value
      });
      const locationText = locEl.value.trim().toLowerCase();
      if (locationText) all = all.filter(x => String(x.location||"").toLowerCase() === locationText);
      shown = Math.min(PAGE_SIZE, all.length);
      render();
    } catch (e) {
      results.innerHTML = `<div class="empty">${escapeHtml(e?.message || "Search is temporarily unavailable.")}</div>`;
    }
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (qEl.value.trim()) p.set("q", qEl.value.trim());
    if (catEl.value) p.set("category", catEl.value);
    if (locEl.value) p.set("location", locEl.value);
    history.replaceState({}, "", `search.html?${p}`);
    run();
  });

  document.getElementById("load-more").addEventListener("click", () => {
    shown += PAGE_SIZE;
    render();
  });
  run();
}
initSearchPage();
