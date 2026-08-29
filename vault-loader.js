(()=>{
'use strict';
async function load(){
 try{if(window.GoshaEarlyRescuePromise)await window.GoshaEarlyRescuePromise}catch(_){}
 await new Promise(resolve=>{const s=document.createElement('script');s.src='./vault.js?v=69';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
}
load();
})();