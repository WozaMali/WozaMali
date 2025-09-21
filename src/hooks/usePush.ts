'use client'

import { useCallback } from 'react'
import { ensurePushSubscription } from '@/lib/pushClient'
import { useAuth } from '@/contexts/AuthContext'

export function usePush() {
  const { user } = useAuth()

  const enablePush = useCallback(async () => {
    if (!user?.id) return false
    return ensurePushSubscription(user.id)
  }, [user?.id])

  return { enablePush }
}


