// public/sw.js - Service Worker اختصاصی سایه‌بان (Next.js 15 PWA)

const CACHE_NAME = 'sayeban-cache-v1';
const OFFLINE_URL = '/offline';

// دارایی‌های اولیه جهت کش شدن در رویداد نصب
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// ۱. رویداد نصب (Install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ۲. رویداد فعال‌سازی (Activate) و پاکسازی نسخه‌های قدیمی کش
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ۳. رویداد رهگیری درخواست‌ها (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // الف) درخواست‌های غیر GET هرگز نباید کش شوند
  if (request.method !== 'GET') {
    return;
  }

  // ب) استثنای کامل Better Auth و مسیرهای احراز هویت (Strict Network-Only)
  if (url.pathname.startsWith('/api/auth/')) {
    return; // مستقیماً به سمت شبکه می‌رود
  }

  // ج) سایر APIها - به طور پیش‌فرض Network-Only برای جلوگیری از دیتای قدیمی
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // د) چانک‌های تغییرناپذیر Next.js و فونت‌ها (Cache-First با Regex)
  const isStaticChunk = /\/_next\/static\/.*/.test(url.pathname);
  const isFont = /\.(woff2?|ttf|eot|otf)$/.test(url.pathname) || url.hostname.includes('fonts.gstatic.com');

  if (isStaticChunk || isFont) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // هـ) تصاویر و دارایی‌های چندرسانه‌ای (Stale-While-Revalidate)
  const isImage = /\.(png|jpg|jpeg|svg|webp|ico|gif)$/.test(url.pathname);
  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // و) درخواست‌های ناوبری صفحات (HTML Navigation Requests)
  // استراتژی: Network-First با ذخیره شل صفحات (مانند /dashboard)
  // در صورت قطع شبکه: بازیابی صفحه از کش، و در صورت نبود صفحه در کش: نمایش /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }
});
