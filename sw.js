const CACHE_NAME = ‘scala-v3’;
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
const req = e.request;
const url = req.url;

// HTML: ネットワーク優先（常に最新を取りに行く）
const isHtml = req.mode === ‘navigate’ || url.endsWith(’/’) || url.endsWith(’.html’);

if (isHtml) {
e.respondWith(
fetch(req).then(res => {
if (res && res.status === 200) {
const copy = res.clone();
caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
}
return res;
}).catch(() =>
// オフライン時のみキャッシュから
caches.match(req).then(cached => cached || caches.match(’./index.html’))
)
);
return;
}

// Google Fonts / Material Symbols: キャッシュ優先
if (url.includes(‘fonts.googleapis.com’) || url.includes(‘fonts.gstatic.com’)) {
e.respondWith(
caches.open(CACHE_NAME).then(cache =>
cache.match(req).then(cached => {
if (cached) return cached;
return fetch(req).then(res => {
if (res && res.status === 200) cache.put(req, res.clone());
return res;
}).catch(() => cached);
})
)
);
return;
}

// その他（画像など）: キャッシュ優先
e.respondWith(
caches.match(req).then(cached => cached || fetch(req))
);
});