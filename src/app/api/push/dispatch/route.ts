import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

const supabase = createClient(supabaseUrl, serviceRoleKey)

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

// Only configure VAPID if both keys are available and valid
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && 
    VAPID_PUBLIC_KEY.length > 0 && VAPID_PRIVATE_KEY.length > 0) {
  try {
    webpush.setVapidDetails('mailto:notifications@wozamali.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  } catch (error) {
    console.warn('Failed to set VAPID details:', error)
  }
}

export async function POST(_req: NextRequest) {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not configured, skipping push notifications')
      return NextResponse.json({ processed: 0, message: 'VAPID keys not configured' })
    }

    // Fetch a batch of unprocessed notifications
    const { data: queue, error } = await supabase
      .from('notifications_queue')
      .select('id, user_id, title, body, data')
      .is('processed_at', null)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!queue || queue.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    let processed = 0
    for (const item of queue) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', item.user_id)

      if (subs && subs.length > 0) {
        const payload = JSON.stringify({ title: item.title, body: item.body, data: item.data || {} })
        await Promise.all(subs.map(async (s) => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
          } catch (err: any) {
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
            }
          }
        }))
      }

      // Mark as processed regardless of subs to avoid reprocessing forever
      await supabase
        .from('notifications_queue')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', item.id)
      processed++
    }

    return NextResponse.json({ processed })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}


