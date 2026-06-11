const CACHE = 'kurd-store-v1';
const ASSETS = [
  '/kurd-store/',
  '/kurd-store/index.html',
  '/kurd-store/shared.css',
  '/kurd-store/app.js',
  '/kurd-store/firebase-config.js',
  '/kurd-store/playstation.html',
  '/kurd-store/xbox.html',
  '/kurd-store/pc.html',
  '/kurd-store/nintendo.html',
  '/kurd-store/subscriptions.html',
  '/kurd-store/discounts.html',
  '/kurd-store/product.html'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fresh = fetch(e.request).then(res=>{
        if(res.ok) caches.open(CACHE).then(c=>c.put(e.request,res.clone()));
        return res;
      }).catch(()=>cached);
      return cached || fresh;
    })
  );
});
