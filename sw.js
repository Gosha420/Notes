const CACHE='gosha-v23-2026-08-09';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./gosha-hero.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 event.respondWith(fetch(event.request).then(response=>{
   const clone=response.clone();
   caches.open(CACHE).then(c=>c.put(event.request,clone));
   return response;
 }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
