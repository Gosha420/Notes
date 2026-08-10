const CACHE_PREFIX='gosha-notes-';
const CACHE=CACHE_PREFIX+'v43';
const SHELL='./index.html';
const CORE=[SHELL,'./app.js?v=43','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE)
        .map(key=>caches.delete(key))
    );
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;
  if(url.pathname.endsWith('/sw.js')) return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(SHELL);

      if(cached){
        event.waitUntil(
          fetch(request,{cache:'no-store'})
            .then(async response=>{
              if(response.ok) await cache.put(SHELL,response.clone());
            })
            .catch(()=>{})
        );
        return cached;
      }

      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok) event.waitUntil(cache.put(SHELL,response.clone()));
        return response;
      }catch(_){
        return new Response(
          '<!doctype html><meta name="theme-color" content="#000"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#000;color:#ddd;font-family:system-ui"><p style="padding:24px">GO$HA is offline. Reopen once a connection is available.</p></body>',
          {headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store'}}
        );
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