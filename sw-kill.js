// Retire legacy caches without navigating or reloading any open page.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await self.clients.claim();
 const keys=await caches.keys();
 await Promise.all(keys.map(key=>caches.delete(key)));
 await self.registration.unregister();
 const clients=await self.clients.matchAll({type:'window'});
 clients.forEach(client=>client.postMessage({type:'SERVICE_WORKER_REMOVED'}));
})()));
// No fetch handler: all requests use the browser's normal network path.
