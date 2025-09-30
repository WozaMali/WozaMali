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

    // Ensure service worker is registered (skip for native)
    let registration = await navigator.serviceWorker.getRegistration()
    try {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        // Do not register a SW in native app
        registration = registration || undefined
      } else {
        registration = registration || (await navigator.serviceWorker.register('/sw.js'))
      }
    } catch {
      registration = registration || (await navigator.serviceWorker.register('/sw.js'))
    }

    if (!registration) return false
    const existing = await registration.pushManager.getSubscription()
    const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!applicationServerKey) {
      console.warn('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY for Web Push')
      return false
    }

    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: Uint8Array.from(urlBase64ToUint8Array(applicationServerKey)) as unknown as BufferSource
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



export async function disablePushSubscription(userId?: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return true

    const existing = await registration.pushManager.getSubscription()
    if (!existing) return true

    // Keep endpoint before unsubscribe so we can remove it server-side
    const endpoint = existing.endpoint

    // Unsubscribe from browser
    const unsubscribed = await existing.unsubscribe()

    // Best-effort cleanup in Supabase
    try {
      if (endpoint) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
      } else if (userId) {
        await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      }
    } catch (innerError) {
      console.warn('disablePushSubscription cleanup warning:', innerError)
    }

    return unsubscribed
  } catch (error) {
    console.error('disablePushSubscription error:', error)
    return false
  }
}

export function getPushPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}