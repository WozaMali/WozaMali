import { supabase } from './supabase'

export async function getResidentRoleId(): Promise<string | null> {
  const envRoleId = process.env.NEXT_PUBLIC_RESIDENT_ROLE_ID
  if (envRoleId) return envRoleId

  const tryNames = ['resident', 'member']
  for (const name of tryNames) {
    const { data, error } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name)
      .limit(1)

    if (!error && data && data.length > 0 && data[0]?.id) {
      return data[0].id as string
    }
  }
  return null
}


