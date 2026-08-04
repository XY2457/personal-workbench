/**
 * 系统级推送通知
 * 使用 Notification API + PushManager + Service Worker
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('此浏览器不支持通知')
    return false
  }
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function subscribePush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('此浏览器不支持推送')
    return null
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn('未配置 VAPID 公钥，推送功能不可用')
    return null
  }

  const reg = await navigator.serviceWorker.ready
  let subscription = await reg.pushManager.getSubscription()

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })
  }

  // 将订阅发送到后端 (实际部署时对接 API)
  // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(subscription) })

  return subscription
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i)
  }
  return arr
}

// 本地通知 (无需服务器)
export async function showLocalNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready
    reg.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'workbench-notification',
      requireInteraction: false
    })
  } else {
    new Notification(title, { body, icon: icon || '/icons/icon-192.png' })
  }
}

// 检查并触发到期提醒
export async function checkReminders() {
  const { dbGet } = await import('./db')
  const reminders = await dbGet<any[]>('reminders')
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  for (const r of reminders) {
    if (r.status === 'done' || r.status === 'overdue') continue
    const remindDate = new Date(r.date)
    const advanceDate = new Date(remindDate)
    advanceDate.setDate(advanceDate.getDate() - (r.advanceDays || 0))

    if (advanceDate <= now && r.status === 'pending') {
      await showLocalNotification(
        '提醒: ' + r.title,
        r.notes || `将在${r.date}到期`,
      )
    }
  }
}
