// Meow Service Worker — 应用壳离线缓存
const CACHE = "effbox-v21";
const SHELL = [
  ".",
  "index.html",
  "manifest.json",
  "Icon-192.png",
  "Icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  // 导航请求：优先网络，失败回退缓存首页（离线打开）
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(function () { return caches.match("index.html"); })
    );
    return;
  }
  // 静态资源：缓存优先，回源并更新
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
