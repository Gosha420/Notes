(()=>{
'use strict';
const NOTE='goshaNoteV21',LEGACY='goshaNote',VAULT='goshaVaultLocalV1';
const MIRROR_A='goshaImmediateMirrorV1',MIRROR_B='goshaImmediateMirrorV2',PREV='goshaImmediatePreviousV1',PREV_PAYLOAD='goshaImmediatePreviousPayloadV1',HISTORY='goshaImmediateHistoryV2';
const DB='GoshaNotebookVault',STORE='vault',RECORDS=['notebook','notebook_mirror','notebook_latest'];
const CACHE='gosha-notebook-vault-v1',CACHE_URLS=[new URL('./__gosha_notebook_backup__',location.href).href,new URL('./__gosha_notebook_backup_mirror__',location.href).href];
const OPFS_FILES=['gosha-notebook-current.json','gosha-notebook-mirror.json'];
const HISTORY_LIMIT=12;
let latest=null,writing=false,lastText=null;
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function payload(text){text=String(text??'');return{version:1,text,updatedAt:Date.now(),checksum:checksum(text)}}
function historyPush(p){try{let a=JSON.parse(localStorage.getItem(HISTORY)||'[]');if(!Array.isArray(a))a=[];const last=a[a.length-1];if(!last||last.checksum!==p.checksum)a.push(p);while(a.length>HISTORY_LIMIT)a.shift();localStorage.setItem(HISTORY,JSON.stringify(a))}catch(_){} }
function critical(text){
 text=String(text??'');const p=payload(text);
 try{
  const old=localStorage.getItem(NOTE),oldPayload=localStorage.getItem(VAULT);
  if(old!==null&&old!==text)localStorage.setItem(PREV,old);
  if(oldPayload&&old!==text)localStorage.setItem(PREV_PAYLOAD,oldPayload);
  localStorage.setItem(NOTE,text);
  localStorage.setItem(LEGACY,text);
  localStorage.setItem(VAULT,JSON.stringify(p));
  localStorage.setItem(MIRROR_A,JSON.stringify(p));
  localStorage.setItem(MIRROR_B,JSON.stringify(p));
  historyPush(p);
 }catch(_){}
 try{
  sessionStorage.setItem(NOTE,text);
  sessionStorage.setItem(LEGACY,text);
  sessionStorage.setItem(VAULT,JSON.stringify(p));
  sessionStorage.setItem(MIRROR_A,JSON.stringify(p));
 }catch(_){}
 try{if(window.AndroidVault&&typeof AndroidVault.save==='function')AndroidVault.save(JSON.stringify(p))}catch(_){}
 lastText=text;latest=p;replicate();
 const s=document.querySelector('#saveStatus');if(s)s.dataset.lastSaved=String(p.updatedAt);
 return p;
}
function openDb(){return new Promise((resolve,reject)=>{try{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}catch(e){reject(e)}})}
async function idbWrite(p){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),st=tx.objectStore(STORE);for(const k of RECORDS)st.put(p,k);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});db.close();return true}catch(_){return false}}
async function cacheWrite(p){try{if(!('caches'in window))return false;const c=await caches.open(CACHE),body=JSON.stringify(p);await Promise.all(CACHE_URLS.map(u=>c.put(u,new Response(body,{headers:{'content-type':'application/json'}}))));return true}catch(_){return false}}
async function opfsWrite(p){try{if(!navigator.storage?.getDirectory)return false;const root=await navigator.storage.getDirectory(),body=JSON.stringify(p);await Promise.all(OPFS_FILES.map(async name=>{const h=await root.getFileHandle(name,{create:true}),w=await h.createWritable();await w.write(body);await w.close()}));return true}catch(_){return false}}
async function requestPersistentStorage(){try{if(navigator.storage?.persist)await navigator.storage.persist()}catch(_){} }
async function replicate(){if(writing||!latest)return;writing=true;while(latest){const p=latest;latest=null;await Promise.allSettled([idbWrite(p),cacheWrite(p),opfsWrite(p)]);if(latest&&latest.checksum===p.checksum)latest=null}writing=false}
function force(){const n=document.querySelector('#note');if(n)critical(n.value)}
function loadSecureSaves(){if(document.querySelector('script[data-gosha-secure-saves]'))return;const s=document.createElement('script');s.src='./secure-saves.js?v=1';s.defer=true;s.dataset.goshaSecureSaves='1';document.head.appendChild(s)}
function boot(){const n=document.querySelector('#note');if(!n)return;requestPersistentStorage();critical(n.value);n.addEventListener('input',()=>critical(n.value),{passive:true});n.addEventListener('change',()=>critical(n.value));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')force()});window.addEventListener('pagehide',force);window.addEventListener('beforeunload',force);document.addEventListener('freeze',force);window.GoshaImmediateSave=force;window.GoshaImmediateSaveText=critical;loadSecureSaves()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();