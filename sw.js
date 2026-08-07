const CACHE='proyecto85-v7.1.0';
const ASSETS=['./','./index.html','./styles.css?v=7.1.0','./app.js?v=7.1.0','./manifest.json','./version.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{
 if(event.data==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin)return;
 event.respondWith(
  fetch(event.request,{cache:'no-store'}).then(response=>{
   const copy=response.clone();
   caches.open(CACHE).then(cache=>cache.put(event.request,copy));
   return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html')))
 );
});
