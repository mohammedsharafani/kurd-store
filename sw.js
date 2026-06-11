// Kurd Store Service Worker v2
// Force update by incrementing version
const CACHE = 'kurd-store-v3';

const ASSETS = [
  'index.html','shared.css','app.js','firebase-config.js',
  'playstation.html','xbox.html','pc.html','nintendo.html',
  'subscriptions.html','discounts.html','product.html',
  'card.html','vip.html'
];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS.map(a=>new Request(a,{cache:'reload'})))).catch(()=>{})
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  // Network first for HTML and JS - always fresh
  if(e.request.url.match(/\.(html|js)$/)){
    e.respondWith(
      fetch(e.request).catch(()=>caches.match(e.request))
    );
    return;
  }
  // Cache first for CSS and other assets
  e.respondWith(
    caches.match(e.request).then(cached=>cached||fetch(e.request))
  );
});
