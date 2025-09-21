import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function ensurePushSubscription(userId: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    // Request permission if needed
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false
    }

    // Ensure service worker is registered
    const registration = (await navigator.serviceWorker.getRegistration())
      || (await navigator.serviceWorker.register('/sw.js'))

    const existing = await registration.pushManager.getSubscription()
    const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!applicationServerKey) {
      console.warn('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY for Web Push')
      return false
    }

    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
    })

    // Extract keys
    const rawP256 = subscription.getKey('p256dh')
    const rawAuth = subscription.getKey('auth')
    const p256dh = rawP256 ? btoa(String.fromCharCode(...new Uint8Array(rawP256))) : ''
    const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : ''

    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh,
      auth
    })

    return true
  } catch (error) {
    console.error('ensurePushSubscription error:', error)
    return false
  }
}


