// Run from an authenticated admin-only page or browser console after deploying rules.
import {db} from "../js/firebase.js";
import {writeBatch,doc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
export async function seedReferenceData(){
  const batch=writeBatch(db);
  const categories=[
    ["vehicles","","Vehicles"],["phones","","Phones & Tablets"],["property","","Property"],
    ["jobs","","Jobs"],["fashion","","Fashion"],["electronics","","Electronics"],
    ["services","","Services"],["home","","Home & Garden"],["health","","Health & Beauty"]
  ];
  categories.forEach(([id,icon,name],i)=>batch.set(doc(db,"categories",id),{icon,name,sortOrder:i,active:true,updatedAt:serverTimestamp()}));
  await batch.commit();
}