import { getRecommendations } from "./search.js";

/**
 * Render recommendations into a supplied container.
 * Expects global renderListingCard if the app provides one; otherwise creates simple cards.
 */
export async function renderRecommendations(currentListing, container, limit=12) {
  if (!container || !currentListing) return [];
  container.setAttribute("aria-busy", "true");

  try {
    const items = await getRecommendations(currentListing, {limit});
    container.innerHTML = items.length
      ? items.map(item => `
          <article class="listing-card recommendation-card" data-listing-id="${item.id}">
            <a href="listing.html?id=${encodeURIComponent(item.id)}">
              <div class="listing-card-image">
                <img src="${item.imageUrl || item.images?.[0] || "assets/placeholder.svg"}"
                     alt="" loading="lazy">
              </div>
              <div class="listing-card-body">
                <h3>${escapeHtml(item.title || "Untitled listing")}</h3>
                <strong>${escapeHtml(formatRecommendationPrice(item))}</strong>
                <small>${escapeHtml([item.city,item.region].filter(Boolean).join(", "))}</small>
              </div>
            </a>
          </article>`).join("")
      : `<p class="empty-state">No close matches yet. Try another listing or broaden your search.</p>`;
    return items;
  } finally {
    container.setAttribute("aria-busy", "false");
  }
}

function escapeHtml(v="") {
  return v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function formatRecommendationPrice(item) {
  if (typeof item.price !== "number" && typeof item.price !== "string") return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style:"currency", currency:item.currency || "GHS",
      maximumFractionDigits:0
    }).format(Number(item.price));
  } catch {
    return `${item.currencySymbol || ""}${item.price}`;
  }
}
