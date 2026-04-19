const CACHE_NAME = ‘scala-v2’;
const ASSETS = [
‘./’,
‘./index.html’,
‘./manifest.json’,
‘./icon512.png’,
];

self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
);
self.skipWaiting();
});

self.addEventListener(‘activate’, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
)
);
self.clients.claim();
});

self.addEventListener(‘fetch’, e => {
const url = e.request.url;

// Google Fonts / Material Symbols: キャッシュ優先、なければネット取得してキャッシュ
if (url.includes(‘fonts.googleapis.com’) || url.includes(‘fonts.gstatic.com’)) {
e.respondWith(
caches.open(CACHE_NAME).then(cache =>
cache.match(e.request).then(cached => {
if (cached) return cached;
return fetch(e.request).then(res => {
if (res && res.status === 200) cache.put(e.request, res.clone());
return res;
}).catch(() => cached);
})
)
);
return;
}

// その他: キャッシュ優先
e.respondWith(
caches.match(e.request).then(cached => cached || fetch(e.request))
);
});