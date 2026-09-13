(()=>{
'use strict';
const NOTE='goshaNoteV21',LEGACY='goshaNote',VAULT='goshaVaultLocalV1',MIRROR='goshaImmediateMirrorV1',PREV='goshaImmediatePreviousV1';
const DB='GoshaNotebookVault',STORE='vault',RECORD='notebook',CACHE='gosha-notebook-vault-v1',CACHE_URL=new URL('./__gosha_notebook_backup__',location.href).href;
let latest=null,writing=false,lastText=null;
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function payload(text){text=String(text??'');return{version:1,text,updatedAt:Date.now(),checksum:checksum(text)}}
function critical(text){text=String(text??'');const p=payload(text);try{const old=localStorage.getItem(NOTE);if(old!==null&&old!==text)localStorage.setItem(PREV,old);localStorage.setItem(NOTE,text);localStorage.setItem(LEGACY,text);localStorage.setItem(VAULT,JSON.stringify(p));localStorage.setItem(MIRROR,JSON.stringify(p))}catch(_){}try{sessionStorage.setItem(NOTE,text);sessionStorage.setItem(VAULT,JSON.stringify(p))}catch(_){}try{if(window.AndroidVault&&typeof AndroidVault.save==='function')AndroidVault.save(JSON.stringify(p))}catch(_){}lastText=text;latest=p;replicate();const s=document.querySelector('#saveStatus');if(s)s.textContent='SAVED · REDUNDANT';return p}
function openDb(){return new Promise((resolve,reject)=>{try{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}catch(e){reject(e)}})}
async function idbWrite(p){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(p,RECORD);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}catch(_){}}
async function cacheWrite(p){try{if(!('caches'in window))return;const c=await caches.open(CACHE);await c.put(CACHE_URL,new Response(JSON.stringify(p),{headers:{'content-type':'application/json'}}))}catch(_){}}
async function replicate(){if(writing||!latest)return;writing=true;while(latest){const p=latest;latest=null;await Promise.allSettled([idbWrite(p),cacheWrite(p)]);if(latest&&latest.checksum===p.checksum)latest=null}writing=false}
function force(){const n=document.querySelector('#note');if(n)critical(n.value)}
function boot(){const n=document.querySelector('#note');if(!n)return;critical(n.value);n.addEventListener('input',()=>critical(n.value),{passive:true});n.addEventListener('change',()=>critical(n.value));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')force()});window.addEventListener('pagehide',force);window.addEventListener('beforeunload',force);document.addEventListener('freeze',force);window.GoshaImmediateSave=force}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();