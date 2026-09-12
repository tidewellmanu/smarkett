import {auth,db} from "./firebase.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {collection,query,where,orderBy,limit,onSnapshot} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {escapeHtml} from "./utils.js";
const el=document.getElementById("notifications");
onAuthStateChanged(auth,user=>{
 if(!el)return;
 if(!user){el.innerHTML="<div class=empty>Sign in to view notifications.</div>";return}
 onSnapshot(query(collection(db,"notifications"),where("userId","==",user.uid),orderBy("createdAt","desc"),limit(50)),
  s=>el.innerHTML=s.docs.map(d=>`<div class="stat-card"><strong>${escapeHtml(d.data().title||"Notification")}</strong><p>${escapeHtml(d.data().body||"")}</p></div>`).join("")||"<div class=empty>No notifications.</div>",
  e=>el.innerHTML=`<div class=empty>${escapeHtml(e.message||"Could not load notifications.")}</div>`);
});
