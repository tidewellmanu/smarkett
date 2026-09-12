import {auth,db} from "./firebase.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {collection,query,where,getDocs,doc,deleteDoc,getDoc} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {formatPrice} from "./countries.js";import {escapeHtml,imageOrPlaceholder} from "./utils.js";

async function loadFavorites(){
 const fav=document.getElementById("favorites"); if(!fav)return;
 if(!auth.currentUser){fav.innerHTML="<div class=empty>Sign in to see favorites.</div>";return}
 try{
  const s=await getDocs(query(collection(db,"favorites"),where("userId","==",auth.currentUser.uid)));
  const cards=[];
  for(const d of s.docs){
   const l=await getDoc(doc(db,"listings",d.data().listingId));
   if(l.exists()){const x=l.data();cards.push(`<a class="listing-card" href="listing.html?id=${encodeURIComponent(l.id)}"><img class="thumb" src="${imageOrPlaceholder(x.coverImage,x.title)}" alt=""><div class=body><h3>${escapeHtml(x.title)}</h3><div class=price>${formatPrice(x.price,x.countryCode)}</div></div></a>`)}
  }
  fav.innerHTML=cards.join("")||"<div class=empty>No favorites yet.</div>";
 }catch(e){fav.innerHTML=`<div class=empty>${escapeHtml(e.message||"Could not load favorites.")}</div>`}
}
async function loadSaved(){
 const saved=document.getElementById("saved-searches"); if(!saved)return;
 if(!auth.currentUser){saved.innerHTML="<div class=empty>Sign in to see saved searches.</div>";return}
 try{
  const s=await getDocs(query(collection(db,"savedSearches"),where("userId","==",auth.currentUser.uid)));
  saved.innerHTML=s.docs.map(d=>`<div class="stat-card"><strong>${escapeHtml(d.data().name||"Saved search")}</strong><p>${escapeHtml(d.data().queryText||"")}</p></div>`).join("")||"<div class=empty>No saved searches.</div>";
 }catch(e){saved.innerHTML=`<div class=empty>${escapeHtml(e.message||"Could not load saved searches.")}</div>`}
}
onAuthStateChanged(auth,()=>{loadFavorites();loadSaved();});
