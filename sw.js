const CACHE='gosha-v39-2026-08-10';
const SHELL='./index.html';
const CORE=['./v24-patch.js','./v34-cleanup.js','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

async function patchHtml(response){
  const text=await response.text();
  let out=text;
  if(!out.includes('v24-patch.js')) out=out.replace('</body>','<script src="./v24-patch.js?v=39"></script></body>');
  if(!out.includes('v34-cleanup.js')) out=out.replace('</body>','<script src="./v34-cleanup.js?v=39"></script></body>');
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('cache-control','no-cache');
  return new Response(out,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const fresh=await caches.open(CACHE);
    if(!(await fresh.match(SHELL))){
      const keys=await caches.keys();
      for(const key of keys){
        if(key===CACHE) continue;
        const old=await caches.open(key);
        const previous=await old.match(SHELL) || await old.match('./');
        if(previous){
          try{await fresh.put(SHELL,(await patchHtml(previous)).clone());}catch(_){ }
          break;
        }
      }
    }
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

async function refreshShell(request){
  const response=await fetch(request,{cache:'no-store'});
  if(!response.ok) throw new Error('navigation '+response.status);
  const patched=await patchHtml(response);
  const cache=await caches.open(CACHE);
  await cache.put(SHELL,patched.clone());
  return patched;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const req=event.request;

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(SHELL);
      if(cached){
        event.waitUntil(refreshShell(req).catch(()=>{}));
        return cached;
      }
      try{
        return await refreshShell(req);
      }catch(_){
        const anyOld=await caches.match(SHELL);
        if(anyOld) return anyOld;
        return new Response('<!doctype html><meta name="theme-color" content="#000"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#000}</style>',{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store'}});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached) return cached;
    try{
      const response=await fetch(req);
      if(response.ok){
        const cache=await caches.open(CACHE);
        event.waitUntil(cache.put(req,response.clone()));
      }
      return response;
    }catch(_){
      return new Response('',{status:504,statusText:'Offline'});
    }
  })());
});