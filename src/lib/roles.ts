import { supabase } from './supabase'

let cachedResidentRoleId: string | null | undefined
let lastResolvedAtMs: number | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getResidentRoleId(): Promise<string | null> {
  // Prefer env override
  const envRoleId = process.env.NEXT_PUBLIC_RESIDENT_ROLE_ID
  if (envRoleId) {
    cachedResidentRoleId = envRoleId
    lastResolvedAtMs = Date.now()
    return envRoleId
  }

  // Serve from cache if fresh
  if (
    typeof cachedResidentRoleId !== 'undefined' &&
    lastResolvedAtMs !== null &&
    Date.now() - lastResolvedAtMs < CACHE_TTL_MS
  ) {
    return cachedResidentRoleId
  }

  const tryNames = ['resident', 'member']
  for (const name of tryNames) {
    const { data, error } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .limit(1)

    if (!error && data && data.length > 0 && data[0]?.id) {
      cachedResidentRoleId = data[0].id as string
      lastResolvedAtMs = Date.now()
      return cachedResidentRoleId
    }
  }

  cachedResidentRoleId = null
  lastResolvedAtMs = Date.now()
  return null
}


