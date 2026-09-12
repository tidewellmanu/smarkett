import {auth,db} from "./firebase.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {collection,query,where,orderBy,onSnapshot,addDoc,doc,getDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import {escapeHtml,getParam} from "./utils.js";

const list=document.getElementById("conversations");
const box=document.getElementById("conversation");

function loadConversations(user){
 if(!list)return;
 if(!user){list.innerHTML="<div class=empty>Sign in to view messages.</div>";return}
 onSnapshot(query(collection(db,"conversations"),where("participantIds","array-contains",user.uid),orderBy("updatedAt","desc")),
  s=>list.innerHTML=s.docs.map(d=>`<a class="stat-card" href="conversation.html?id=${encodeURIComponent(d.id)}"><strong>${escapeHtml(d.data().title||"Conversation")}</strong><p>${escapeHtml(d.data().lastMessage||"")}</p></a>`).join("")||"<div class=empty>No conversations.</div>",
  e=>list.innerHTML=`<div class=empty>${escapeHtml(e.message)}</div>`);
}

async function loadConversation(user){
 if(!box)return;
 const id=getParam("id");
 if(!id||!user){box.innerHTML="<div class=empty>Please sign in.</div>";return}
 try{
  const snap=await getDoc(doc(db,"conversations",id));
  if(!snap.exists()||!(snap.data().participantIds||[]).includes(user.uid)){box.innerHTML="<div class=empty>Conversation not found.</div>";return}
  onSnapshot(query(collection(db,"conversations",id,"messages"),orderBy("createdAt","asc")),
   s=>box.innerHTML=s.docs.map(d=>`<div class="message ${d.data().senderId===user.uid?"mine":""}">${escapeHtml(d.data().text||"")}</div>`).join(""),
   e=>box.innerHTML=`<div class=empty>${escapeHtml(e.message)}</div>`);
 }catch(e){box.innerHTML=`<div class=empty>${escapeHtml(e.message||"Could not load conversation.")}</div>`}
}

onAuthStateChanged(auth,user=>{loadConversations(user);loadConversation(user).catch(console.warn);});

document.getElementById("message-form")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const id=getParam("id"), text=document.getElementById("message").value.trim();
 if(!auth.currentUser||!id||!text)return;
 if(text.length>2000)return alert("Message is limited to 2,000 characters.");
 try{
  const conversation=await getDoc(doc(db,"conversations",id));
  if(!conversation.exists()||(conversation.data().participantIds||[]).indexOf(auth.currentUser.uid)<0)return;
  await addDoc(collection(db,"conversations",id,"messages"),{senderId:auth.currentUser.uid,text,createdAt:serverTimestamp()});
  await updateDoc(doc(db,"conversations",id),{lastMessage:text,updatedAt:serverTimestamp()});
  document.getElementById("message").value="";
 }catch(e){alert(e.message||"Could not send message.")}
});
