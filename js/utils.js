export const qs=(s,r=document)=>r.querySelector(s);
export const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
export function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
export function getParam(k){return new URLSearchParams(location.search).get(k);}
export function requireAuth(auth){return new Promise(resolve=>{import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js").then(({onAuthStateChanged})=>onAuthStateChanged(auth,u=>resolve(u)))})}
export function imageOrPlaceholder(url,title="Listing"){return url?escapeHtml(url):`https://placehold.co/600x600?text=${encodeURIComponent(title)}`;}