// Service worker لنظام صرف الأدوية
// ملاحظة: هذا الملف إضافي فقط ولا يغيّر أي منطق داخل التطبيق نفسه.
const CACHE_NAME = 'pharma-cache-v8';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // مكتبات خارجية ضرورية عشان التصدير والطباعة يشتغلوا حتى لو الجهاز أوفلاين
  // (المزامنة السحابية اتلغت، فمكتبات Firebase مبقتش لازمة هنا)
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => { /* لو فشل أي ملف، التطبيق يفضل شغال عادي بدون كاش */ })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// استراتيجية: جرّب الشبكة الأول، ولو مفيش نت استخدم النسخة المحفوظة
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(event.request, copy); } catch (e) {}
        });
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
