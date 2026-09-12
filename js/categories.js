import { db } from "./firebase.js";
import { collection,getDocs,query,where,orderBy,limit } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
export const DEFAULT_CATEGORIES=[
["vehicles","","Vehicles"],["phones","","Phones & Tablets"],["property","","Property"],["jobs","","Jobs"],["fashion","","Fashion"],["electronics","","Electronics"],["services","","Services"],["home","","Home & Garden"],["health","","Health & Beauty"],["kids","","Kids"],["sports","","Sports"],["agriculture","","Agriculture"]
];
export async function loadCategories(){
  try{const s=await getDocs(query(collection(db,"categories"),where("active","==",true),orderBy("sortOrder"),limit(50)));if(!s.empty)return s.docs.map(d=>({id:d.id,...d.data()}));}catch(e){}
  return DEFAULT_CATEGORIES.map(([id,icon,name],i)=>({id,icon,name,sortOrder:i}));
}
const el=document.getElementById("all-categories")||document.getElementById("category-grid");
if(el){loadCategories().then(c=>el.innerHTML=c.map(x=>`<a class="category-card" href="search.html?category=${encodeURIComponent(x.id)}"><strong>${x.name}</strong><span>Browse listings</span></a>`).join(""))}