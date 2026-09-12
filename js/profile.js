import {auth,db} from "./firebase.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {doc,getDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {escapeHtml} from "./utils.js";

const view=document.getElementById("profile-view");
const form=document.getElementById("profile-form");

async function load(){
 if(view){
  if(!auth.currentUser)return view.innerHTML="<div class=empty>Sign in first.</div>";
  const s=await getDoc(doc(db,"users",auth.currentUser.uid));const x=s.data()||{};
  view.innerHTML=`<h1>${escapeHtml(x.displayName||"Member")}</h1><p>${escapeHtml(x.bio||"")}</p><p class=meta>${escapeHtml(x.phone||"Phone not public")}</p><a class="btn btn-primary" href="edit-profile.html">Edit profile</a>`;
 }
 if(form){
  if(!auth.currentUser)return location.href="login.html";
  const s=await getDoc(doc(db,"users",auth.currentUser.uid));const x=s.data()||{};
  document.getElementById("name").value=x.displayName||"";
  document.getElementById("phone").value=x.phone||"";
  document.getElementById("bio").value=x.bio||"";
 }
}
onAuthStateChanged(auth,()=>load().catch(e=>console.warn(e)));
form?.addEventListener("submit",async e=>{
 e.preventDefault();const status=document.getElementById("profile-status");
 if(!auth.currentUser)return location.href="login.html";
 try{
  await setDoc(doc(db,"users",auth.currentUser.uid),{
   displayName:document.getElementById("name").value.trim(),
   phone:document.getElementById("phone").value.trim(),
   bio:document.getElementById("bio").value.trim(),updatedAt:serverTimestamp()
  },{merge:true});
  status.textContent="Profile saved.";
 }catch(x){status.textContent=x.message}
});
