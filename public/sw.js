// Service Worker for Push Notifications
const CACHE_NAME = 'cleanerconnect-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received', event);

  let notificationData = {
    title: 'CleanerConnect',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {}
  };

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Click', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const data = event.notification.data;
      
      // Determine the URL to open based on notification type
      let urlToOpen = '/';
      
      if (data.type === 'message') {
        urlToOpen = '/customer/messages';
      } else if (data.type === 'booking') {
        urlToOpen = '/customer/bookings';
      } else if (data.type === 'payment') {
        urlToOpen = '/customer/payment';
      }

      // Check if app is already open
      for (let client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: data,
            url: urlToOpen
          });
          return client.focus();
        }
      }

      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background Sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background synchronization
  return fetch('/api/sync')
    .then(response => {
      console.log('Background sync completed');
    })
    .catch(error => {
      console.error('Background sync failed:', error);
    });
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message Received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});