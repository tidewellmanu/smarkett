import {db,auth} from "./firebase.js";
import {doc,getDoc,collection,query,where,orderBy,limit,getDocs,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {formatPrice} from "./countries.js"; import {escapeHtml,imageOrPlaceholder,getParam} from "./utils.js";
const detail=document.getElementById("listing-detail");
async function showListing(){
 if(!detail)return; const id=getParam("id"); if(!id){detail.innerHTML="<div class=empty>Missing listing.</div>";return}
 try{const s=await getDoc(doc(db,"listings",id));if(!s.exists()){detail.innerHTML="<div class=empty>Listing not found.</div>";return}
 const x=s.data();document.title=`${x.title} — MarketHub Ghana`;
 detail.innerHTML=`<div class="article"><img src="${imageOrPlaceholder(x.coverImage,x.title)}" alt="${escapeHtml(x.title)}" style="width:min(720px,100%);aspect-ratio:4/3;object-fit:cover;border-radius:14px"><span class="pill">${escapeHtml(x.condition||"Used")}</span><h1>${escapeHtml(x.title)}</h1><div class="price">${formatPrice(x.price,x.countryCode)}</div><p class="meta">${escapeHtml(x.location||"")}</p><p>${escapeHtml(x.description||"")}</p><div class="form-grid"><button id="reveal-phone" class="btn btn-primary">Show phone securely</button><button id="contact-seller" class="btn btn-secondary">Message seller</button></div><p id="phone-result" class="form-status"></p></div>`;
 document.getElementById("reveal-phone")?.addEventListener("click",()=>revealPhone(id));
 document.getElementById("contact-seller")?.addEventListener("click",()=>startConversation(id,x.sellerId,x.title));
 }catch(e){detail.innerHTML=`<div class="empty">${escapeHtml(e.message)}</div>`}
}
async function revealPhone(id){
 const out=document.getElementById("phone-result");if(!auth.currentUser){out.textContent="Please sign in first.";return}
 try{const {httpsCallable}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js");const fn=httpsCallable((await import("./firebase.js")).functions,"revealPhone");const r=await fn({listingId:id});out.textContent=r.data.phone||"Phone unavailable";}catch(e){out.textContent="Phone reveal is protected and requires the deployed backend function."}
}
async function startConversation(listingId,sellerId,title){
 if(!auth.currentUser){location.href="login.html";return} if(auth.currentUser.uid===sellerId){location.href="messages.html";return}
 const {addDoc}=await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");
 const participants=[auth.currentUser.uid,sellerId].sort();const c=await addDoc(collection(db,"conversations"),{participantIds:participants,listingId,title,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),lastMessage:""});
 location.href=`conversation.html?id=${c.id}`;
}
async function myListings(){
 const el=document.getElementById("my-listings");if(!el||!auth.currentUser)return;
 const s=await getDocs(query(collection(db,"listings"),where("sellerId","==",auth.currentUser.uid),orderBy("createdAt","desc"),limit(50)));
 el.innerHTML=s.docs.map(d=>{const x=d.data();return `<a class="listing-card" href="listing.html?id=${d.id}"><img class="thumb" src="${imageOrPlaceholder(x.coverImage,x.title)}" alt=""><div class="body"><h3>${escapeHtml(x.title)}</h3><div class="price">${formatPrice(x.price,x.countryCode)}</div><div class="meta">${escapeHtml(x.status||"")}</div></div></a>`}).join("")||"<div class=empty>No listings yet.</div>";
}
showListing();
onAuthStateChanged(auth, user => { if (user) myListings().catch(e => console.warn(e)); });
