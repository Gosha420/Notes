const CACHE_PREFIX='gosha-notes-';
const CACHE=CACHE_PREFIX+'v42';
const SHELL='./index.html';
const CORE=[SHELL,'./app.js?v=42','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(SHELL);
      if(cached){
        event.waitUntil(
          fetch(request,{cache:'no-store'})
            .then(response=>response.ok?cache.put(SHELL,response.clone()):undefined)
            .catch(()=>{})
        );
        return cached;
      }
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok) event.waitUntil(cache.put(SHELL,response.clone()));
        return response;
      }catch(_){
        return new Response('<!doctype html><meta name="theme-color" content="#000"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#000;color:#ddd;font-family:system-ui"><p style="padding:24px">GO$HA is offline. Reopen once a connection is available.</p></body>',{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store'}});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request);
    if(cached) return cached;
    try{
      const response=await fetch(request);
      if(response.ok) event.waitUntil(cache.put(request,response.clone()));
      return response;
    }catch(_){
      return new Response('',{status:504,statusText:'Offline'});
    }
  })());
});