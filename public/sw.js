/**
 * Service Worker cho EXAM ONLINE
 * Chiến lược: Network-First (ưu tiên mạng) để luôn lấy nội dung mới nhất từ server.
 * Chỉ cache phục vụ khi mất kết nối mạng.
 * Tự động cập nhật giao diện mới khi server deploy bản mới.
 */

const CACHE_NAME = 'exam-online-v1';

// Danh sách tài nguyên tĩnh cốt lõi cần pre-cache khi cài đặt
const PRECACHE_ASSETS = [
  '/',
  '/logo-exam.png',
  '/logo-exam.ico'
];

// Cài đặt: pre-cache tài nguyên tĩnh
self.addEventListener('install', (event) => {
  // Bắt buộc service worker mới kích hoạt ngay lập tức, không chờ SW cũ
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Kích hoạt: xóa toàn bộ cache cũ khi phiên bản mới lên sóng
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Chiếm quyền điều khiển tất cả các tab đang mở ngay lập tức
      return self.clients.claim();
    })
  );
});

// Chiến lược Fetch: Network-First
// Luôn ưu tiên tải từ mạng. Nếu mạng lỗi mới dùng cache dự phòng.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Bỏ qua các request không phải GET (POST API calls, etc.)
  if (request.method !== 'GET') return;

  // Bỏ qua các request tới API bên ngoài (Google Apps Script)
  if (request.url.includes('script.google.com') || request.url.includes('googleapis.com')) return;

  // Bỏ qua chrome-extension và các scheme không hỗ trợ
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Lấy thành công từ mạng → lưu vào cache để phòng khi offline
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Mạng lỗi → trả về bản cache dự phòng (nếu có)
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Nếu cả mạng lẫn cache đều không có, trả fallback cho navigation
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Lắng nghe message từ trang web để kiểm tra cập nhật
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
