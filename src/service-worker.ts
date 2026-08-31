/// <reference lib="webworker" />

import { base, build, files, prerendered, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const cacheName = `diet-planner-${version}`;
const appShell = `${base}/`;
const assets = [...new Set([...build, ...files, ...prerendered])];

worker.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('diet-planner-') && key !== cacheName)
          .map(key => caches.delete(key)),
      ))
      .then(() => worker.clients.claim()),
  );
});

worker.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== worker.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => (
      await caches.match(appShell) ?? Response.error()
    )));
    return;
  }

  if (assets.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached ?? fetch(event.request)));
  }
});
