import { db } from "./firebase.js";
import { COUNTRIES, currentCountry, setCountry, formatPrice } from "./countries.js";
import { collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { escapeHtml, imageOrPlaceholder } from "./utils.js";

const code=(new URLSearchParams(location.search).get("country")||currentCountry()).toUpperCase();
if(COUNTRIES[code]) setCountry(code);
const country=COUNTRIES[code]||COUNTRIES.GH;

document.title=`${country.name} Marketplace — MarketHub`;
const page=document.getElementById("country-page");
if(page) page.innerHTML=`<div class="page-title">
  <span class="eyebrow">${country.name}</span><h1>Buy and sell in ${country.name}</h1>
  <p class="meta">Prices shown in ${country.currency} (${country.symbol}).</p>
  <form id="country-search" class="search-panel">
    <input id="country-q" type="search" placeholder="Search ${country.name}" autocomplete="off">
    <button class="btn btn-primary" type="submit">Search</button>
  </form></div>`;

document.getElementById("country-search")?.addEventListener("submit",e=>{
  e.preventDefault();
  location.href=`search.html?country=${code}&q=${encodeURIComponent(document.getElementById("country-q").value.trim())}`;
});

async function load(){
  const el=document.getElementById("country-listings");
  try{
    const s=await getDocs(query(collection(db,"listings"),where("status","==","active"),where("countryCode","==",code),orderBy("createdAt","desc"),limit(24)));
    el.innerHTML=s.docs.map(d=>{const x=d.data();return `<a class="listing-card" href="listing.html?id=${d.id}">
      <img class="thumb" loading="lazy" src="${imageOrPlaceholder(x.coverImage,x.title)}" alt="${escapeHtml(x.title)}">
      <div class="body"><h3>${escapeHtml(x.title)}</h3><div class="price">${formatPrice(x.price,code)}</div>
      <div class="meta">${escapeHtml(x.location||country.name)}</div></div></a>`}).join("") ||
      `<div class="empty">No listings in ${escapeHtml(country.name)} yet.</div>`;
  }catch(e){el.innerHTML='<div class="empty">Connect Firebase and deploy the included Firestore indexes to load live listings.</div>';}
}
load();
