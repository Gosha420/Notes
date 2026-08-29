(()=>{
'use strict';
const EXACT=t=>{t=String(t||'').toUpperCase();return t.includes('LEMON OG 500/3100')&&t.includes('BLUE DREAM 200/1400')};
const answer=/^\s*(?:Total(?:\s+earned)?|Total\s+sold|Left|Smoked|Used)\s*:/i;
function score(text){
 const lines=String(text||'').split(/\r?\n/);let known=false,tx=0,meaning=0;
 for(const line of lines){const t=line.trim();if(!t)continue;const h=t.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);if(h){const n=h[1].trim().toUpperCase();known=n==='LEMON OG'||n==='BLUE DREAM';if(known)meaning++;continue}if(!known||answer.test(t))continue;const m=line.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g)||[];tx+=m.length;meaning++}
 return [tx,meaning,String(text||'').length];
}
function better(a,b){const A=score(a),B=score(b);for(let i=0;i<A.length;i++){if(A[i]!==B[i])return A[i]>B[i]}return false}
const found=[],seen=new Set();
function add(source,text){text=String(text??'');if(!text.trim()||!EXACT(text)||seen.has(text))return;seen.add(text);found.push({source,text,score:score(text)})}
function walk(source,v,depth=0,objects=new WeakSet()){
 if(depth>10||v==null)return;
 if(typeof v==='string'){
  add(source,v);
  const s=v.trim();if((s[0]==='{'&&s.endsWith('}'))||(s[0]==='['&&s.endsWith(']'))){try{walk(source,JSON.parse(s),depth+1,objects)}catch(_){}}
  return;
 }
 if(typeof v!=='object')return;
 if(objects.has(v))return;objects.add(v);
 if(Array.isArray(v)){for(let i=0;i<v.length;i++)walk(source+'['+i+']',v[i],depth+1,objects);return}
 for(const [k,x] of Object.entries(v))walk(source+'.'+k,x,depth+1,objects);
}
function scanStorage(store,name){try{for(let i=0;i<store.length;i++){const k=store.key(i);if(k)walk(name+':'+k,store.getItem(k))}}catch(_){}}
function nativeScan(){try{if(window.AndroidVault){if(typeof AndroidVault.load==='function')walk('NATIVE:notebook',AndroidVault.load());if(typeof AndroidVault.loadPrevious==='function')walk('NATIVE:notebook_previous',AndroidVault.loadPrevious());if(typeof AndroidVault.loadArchive==='function')walk('NATIVE:archive',AndroidVault.loadArchive())}}catch(_){}}
function openDb(name){return new Promise(resolve=>{try{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null);r.onblocked=()=>resolve(null)}catch(_){resolve(null)}})}
async function scanDb(name){const db=await openDb(name);if(!db)return;try{for(const store of [...db.objectStoreNames]){await new Promise(resolve=>{try{const tx=db.transaction(store,'readonly'),r=tx.objectStore(store).getAll();r.onsuccess=()=>{walk('IDB:'+name+'/'+store,r.result);resolve()};r.onerror=()=>resolve()}catch(_){resolve()}})}}finally{try{db.close()}catch(_){}}}
async function scanIdb(){const names=new Set(['GoshaNotebookVault','GoshaBatchArchive']);try{if(indexedDB.databases){for(const d of await indexedDB.databases())if(d&&d.name)names.add(d.name)}}catch(_){}for(const n of names)await scanDb(n)}
async function scanCaches(){try{if(!('caches'in window))return;for(const n of await caches.keys()){const c=await caches.open(n);for(const req of await c.keys()){try{const r=await c.match(req);if(r)walk('CACHE:'+n+':'+req.url,await r.clone().text())}catch(_){}}}}catch(_){} }
async function run(){
 const note=document.querySelector('#note');const current=note?.value||localStorage.getItem('goshaNoteV21')||localStorage.getItem('goshaNote')||'';add('CURRENT',current);
 scanStorage(localStorage,'LOCAL');scanStorage(sessionStorage,'SESSION');nativeScan();
 await Promise.allSettled([scanIdb(),scanCaches()]);
 let best=EXACT(current)?{source:'CURRENT',text:current,score:score(current)}:null;for(const c of found)if(!best||better(c.text,best.text))best=c;
 let restored=false;if(!String(current).trim()&&best&&String(best.text).trim()){
  try{localStorage.setItem('goshaRescueUndoBeforeEarlyRestore',current)}catch(_){}
  if(note)note.value=best.text;
  try{localStorage.setItem('goshaNoteV21',best.text);localStorage.setItem('goshaNote',best.text)}catch(_){}
  restored=true;
 }
 try{localStorage.setItem('goshaEarlyRescueReportV1',JSON.stringify({at:Date.now(),current:score(current),best:best?best.score:null,source:best?.source||null,candidates:found.length,restored,nonDestructive:true}))}catch(_){}
 window.GoshaEarlyRescue={restored,bestSource:best?.source||null,bestScore:best?.score||null,candidates:found.length,nonDestructive:true};
 return window.GoshaEarlyRescue;
}
window.GoshaEarlyRescuePromise=run().catch(e=>({restored:false,error:String(e)}));
})();