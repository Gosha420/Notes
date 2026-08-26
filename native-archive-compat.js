(()=>{
'use strict';
if(!(window.AndroidVault&&typeof AndroidVault.load==='function'&&typeof AndroidVault.save==='function'))return;
const LOCAL_KEY='goshaBatchArchiveV2';
function readNative(){try{return JSON.parse(AndroidVault.load()||'{}')}catch(_){return {}}}
function seedLocal(){try{const p=readNative(),native=Array.isArray(p.archiveRecords)?p.archiveRecords:[];if(!native.length)return;let local=[];try{local=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]')}catch(_){}if(!Array.isArray(local))local=[];localStorage.setItem(LOCAL_KEY,JSON.stringify([...local,...native]))}catch(_){}}
let timer=null;
function syncNative(){clearTimeout(timer);timer=setTimeout(()=>{try{if(!(window.GoshaArchive&&typeof GoshaArchive.getRecords==='function'))return;const p=readNative(),records=GoshaArchive.getRecords();p.archiveRecords=records;p.archiveUpdatedAt=Date.now();AndroidVault.save(JSON.stringify(p))}catch(_){}},320)}
seedLocal();
function boot(){syncNative();window.addEventListener('goshaArchiveChanged',syncNative);document.querySelector('#note')?.addEventListener('input',syncNative,{passive:true});document.querySelector('#note')?.addEventListener('change',syncNative);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncNative()});window.addEventListener('pagehide',syncNative)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();