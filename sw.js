const CACHE_NAME = 'bayti-sakan-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: تثبيت...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 تخزين الملفات الأساسية...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('✅ تم التثبيت بنجاح');
      return self.skipWaiting();
    })
  );
});

// تفعيل Service Worker وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: تفعيل...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ تم التفعيل بنجاح');
      return self.clients.claim();
    })
  );
});

// استراتيجية: Network First مع Fallback إلى Cache
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات chrome-extension والطلبات غير GET
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://') ||
      event.request.url.includes('extension')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // نسخ الرد لتخزينه في الكاش
        const responseClone = networkResponse.clone();
        
        // تخزين في الكاش فقط إذا كان الرد ناجحاً
        if (networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return networkResponse;
      })
      .catch(() => {
        // إذا فشل الاتصال، استخدم الكاش
        console.log('⚠️ لا يوجد إنترنت، استخدام الكاش...');
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // إذا كان الطلب لصفحة HTML، أرجع الصفحة الرئيسية
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
          
          return new Response('غير متصل بالإنترنت', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// مزامنة البيانات في الخلفية (Background Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('🔄 بدء مزامنة البيانات في الخلفية...');
    event.waitUntil(
      // هنا يمكن إضافة منطق المزامنة مع السيرفر
      Promise.resolve()
    );
  }
});

// استقبال رسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_NOW') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.add(event.data.url);
      })
    );
  }
});

console.log('✅ Service Worker جاهز للعمل');