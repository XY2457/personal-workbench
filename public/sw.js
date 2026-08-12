// Service Worker - 像素森系工作台 v2
const CACHE_NAME = 'workbench-v4'

// 安装 - 跳过预缓存，避免首次缓存陈旧文件
self.addEventListener('install', () => {
  self.skipWaiting()
})

// 激活 - 清理所有旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.map(name => caches.delete(name))
    ))
  )
  self.clients.claim()
})

// 网络优先策略：HTML/API 始终从网络获取
// 仅静态资源（JS/CSS/图片/字体）使用缓存回退
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ico|json)$/i.test(url.pathname)
  const isSameOrigin = url.origin === self.location.origin

  if (!isSameOrigin) {
    // 非同源请求：走网络
    return
  }

  if (isStaticAsset) {
    // 静态资源：缓存优先（带网络更新）
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        return cached || fetchPromise
      })
    )
  } else {
    // HTML / 导航请求：网络优先，网络失败时才用缓存
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => caches.match(event.request))
    )
  }
})

// 推送通知
self.addEventListener('push', (event) => {
  let data = { title: '森系工作台', body: '您有新的提醒' }
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'workbench-notification',
    requireInteraction: false,
    data: data.data || {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 点击通知
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/personal-workbench/')
    })
  )
})
