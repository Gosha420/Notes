const CACHE_PREFIX='gosha-notes-';
const CACHE=CACHE_PREFIX+'v41';
const SHELL='./index.html';
const APP='./app.js';
const CRITICAL=[APP,'./manifest.webmanifest'];
const OPTIONAL=['./gosha-hero.png','./gate-finger.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

async function patchHtml(response){
  const text=await response.text();
  let out=text
    .replace(/url\(data:image\/png;base64,[^)]+\)/,"url('./gosha-hero.png')")
    .replace(/<script[^>]+src=["'][^"']*(?:v24-patch|v31-fix|v34-cleanup|app)\.js[^"']*["'][^>]*><\/script>/gi,'');
  out=out.includes('</body>')
    ? out.replace('</body>','<script src="./app.js?v=41"></script></body>')
    : out+'<script src="./app.js?v=41"></script>';
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('cache-control','no-cache');
  return new Response(out,{status:response.status,statusText:response.statusText,headers});
}

async function fetchShell(request=SHELL){
  const response=await fetch(request,{cache:'no-store'});
  if(!response.ok) throw new Error('shell '+response.status);
  return patchHtml(response);
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(CRITICAL.map(url=>cache.add(url)));
    try{
      const shell=await fetchShell(SHELL);
      await cache.put(SHELL,shell.clone());
    }catch(_){ }
    Promise.allSettled(OPTIONAL.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(SHELL);
      if(cached){
        event.waitUntil((async()=>{
          try{
            const fresh=await fetchShell(req);
            await cache.put(SHELL,fresh.clone());
          }catch(_){ }
        })());
        return cached;
      }
      try{
        const fresh=await fetchShell(req);
        event.waitUntil(cache.put(SHELL,fresh.clone()));
        return fresh;
      }catch(_){
        const older=await caches.match(SHELL);
        if(older) return older;
        return new Response('<!doctype html><html><head><meta name="theme-color" content="#000"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#000"></body></html>',{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store'}});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(url.pathname.endsWith('/app.js')||url.pathname.endsWith('/manifest.webmanifest')){
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh.ok) event.waitUntil(cache.put(req,fresh.clone()));
        return fresh;
      }catch(_){
        const cached=await cache.match(req);
        return cached||new Response('',{status:504,statusText:'Offline'});
      }
    }
    const cached=await cache.match(req);
    if(cached) return cached;
    try{
      const fresh=await fetch(req);
      if(fresh.ok) event.waitUntil(cache.put(req,fresh.clone()));
      return fresh;
    }catch(_){
      return new Response('',{status:504,statusText:'Offline'});
    }
  })());
});