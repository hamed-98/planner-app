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

// قالب مستقل HTML آفلاین بدون نیاز به هیچ چانک جاوااسکریپت خارجی
const FALLBACK_OFFLINE_HTML = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>آفلاین هستید | سایه‌بان</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      background: #1e293b;
      padding: 2.5rem 2rem;
      border-radius: 1.5rem;
      max-width: 400px;
      margin: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      border: 1px solid #334155;
    }
    h1 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; }
    p { font-size: 0.875rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 0.75rem;
      background: #0d9488;
      color: white;
      text-decoration: none;
      font-weight: bold;
      border-radius: 0.75rem;
      border: none;
      cursor: pointer;
      box-sizing: border-box;
      margin-bottom: 0.5rem;
    }
    .btn-secondary {
      background: #334155;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
    <h1>ارتباط با اینترنت برقرار نیست</h1>
    <p> برای مشاهده آن به اینترنت متصل شوید.</p>
    <button class="btn" onclick="window.location.reload()">تلاش مجدد</button>
    <a href="/dashboard" class="btn btn-secondary">بازگشت به پیشخوان</a>
  </div>
</body>
</html>`;

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
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // الف) درخواست‌های غیر GET هرگز نباید کش شوند
  if (request.method !== "GET") {
    return;
  }

  // ب) استثنای کامل Better Auth و مسیرهای احراز هویت (Strict Network-Only)
  if (url.pathname.startsWith("/api/auth/")) {
    return; // مستقیماً به سمت شبکه می‌رود
  }

  // ج) سایر APIها - به طور پیش‌فرض Network-Only برای جلوگیری از دیتای قدیمی
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // د) چانک‌های تغییرناپذیر Next.js و فونت‌ها (Cache-First با Regex)
  const isStaticChunk = /\/_next\/static\/.*/.test(url.pathname);
  const isFont =
    /\.(woff2?|ttf|eot|otf)$/.test(url.pathname) ||
    url.hostname.includes("fonts.gstatic.com");

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
      }),
    );
    return;
  }

  // هـ) تصاویر و دارایی‌های چندرسانه‌ای (Stale-While-Revalidate)
  const isImage = /\.(png|jpg|jpeg|svg|webp|ico|gif)$/.test(url.pathname);
  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      }),
    );
    return;
  }

  // و) درخواست‌های ناوبری صفحات (HTML Navigation Requests)
  // استراتژی: Network-First با ذخیره شل صفحات (مانند /dashboard)
  // در صورت قطع شبکه: بازیابی صفحه از کش، و در صورت نبود صفحه در کش: نمایش /offline
  // و) مدیریت درخواست‌های ناوبری صفحات بدون کرش چانک‌ها
  if (request.mode === "navigate") {
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
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // بازگرداندن صفحه مستقیم بدون وابستگی به وب‌پک
          return new Response(FALLBACK_OFFLINE_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }),
    );
    return;
  }
});

// شنود پیام برای فعال‌سازی فوری در زمان انتشار نسخه جدید
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});