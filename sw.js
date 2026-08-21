const CACHE_NAME = 'hakuchizu-v1.1.6';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_SHELL).catch(() => {})
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  /*
   * HTMLはネットワーク優先。
   * 古いindex.htmlがPWA内に残り続けることを防ぐ。
   */
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html')
  ) {

    event.respondWith(
      fetch(
        event.request,
        {
          cache: 'no-store'
        }
      )
      .then(response => {

        const copy =
          response.clone();

        caches
          .open(CACHE_NAME)
          .then(cache => {

            cache.put(
              './index.html',
              copy
            );

          });

        return response;

      })
      .catch(() =>
        caches.match(
          './index.html'
        )
      )
    );

    return;
  }

  /*
   * HTML以外はキャッシュ優先。
   * キャッシュに存在しなければ
   * ネットワークから取得して保存。
   */

  event.respondWith(
    caches
      .match(
        event.request
      )
      .then(cached => {

        if (
          cached
        ) {

          return cached;

        }


        return fetch(
          event.request
        )
        .then(response => {

          const copy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                copy
              );

            });

          return response;

        });

      })
  );

});
