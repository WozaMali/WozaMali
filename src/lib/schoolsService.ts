import { supabase } from './supabase';

export interface School {
  id: string;
  emis_number: string | null;
  name: string; // mapped from school_name
  phase: string | null;
  sector: string | null;
  ward: string | null;
  township: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function searchSchoolsByName(query: string, limit = 10): Promise<{ data: School[]; error: any }> {
  try {
    const q = (query || '').trim();
    if (!q) return { data: [], error: null };
    const safe = q.replace(/[,]/g, ' ').slice(0, 100);
    // Attempt 1: prefer column "school_name"
    let attempt1 = await supabase
      .from('schools')
      .select('id, school_name, township, address_line1, city')
      .ilike('school_name', `%${safe}%`)
      .limit(limit);
    if (!attempt1.error) {
      // Map school_name -> name for UI
      const mapped = (attempt1.data || []).map((r: any) => ({
        id: r.id,
        emis_number: null,
        name: r.school_name,
        phase: null,
        sector: null,
        ward: null,
        township: r.township ?? null,
        address_line1: r.address_line1 ?? null,
        address_line2: null,
        city: r.city ?? null,
        postal_code: null,
        latitude: null,
        longitude: null,
      }));
      return { data: mapped as any, error: null };
    }

    // Attempt 2: fallback to column "name"
    let attempt2 = await supabase
      .from('schools')
      .select('id, name, township, address_line1, city')
      .ilike('name', `%${safe}%`)
      .limit(limit);
    if (!attempt2.error) {
      const mapped = (attempt2.data || []).map((r: any) => ({
        id: r.id,
        emis_number: null,
        name: r.name,
        phase: null,
        sector: null,
        ward: null,
        township: r.township ?? null,
        address_line1: r.address_line1 ?? null,
        address_line2: null,
        city: r.city ?? null,
        postal_code: null,
        latitude: null,
        longitude: null,
      }));
      return { data: mapped as any, error: null };
    }
    // No permissive fallback (avoid 403 due to RLS). Surface the last error.
    return { data: [], error: attempt2.error || attempt1.error };
  } catch (error) {
    return { data: [], error };
  }
}

export async function listAllSchools(limit = 200): Promise<{ data: Array<Pick<School, 'id' | 'name' | 'township' | 'address_line1' | 'city'>>; error: any }> {
  try {
    const res = await supabase
      .from('schools')
      .select('id, school_name, township, address_line1, city')
      .limit(limit);
    if (res.error) return { data: [], error: res.error };
    const data = (res.data || [])
      .map((r: any) => ({ id: r.id, name: r.school_name ?? '', township: r.township ?? null, address_line1: r.address_line1 ?? null, city: r.city ?? null }))
      .filter((r) => !!r.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    return { data, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function savePreferredSchool(_userId: string, schoolId: string): Promise<{ ok: boolean; error: any }> {
  try {
    // Require an active session; otherwise return a clear error
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) return { ok: false, error: sessionErr };
    if (!sessionData?.session) return { ok: false, error: new Error('NO_SESSION') };

    // Prefer RPC to avoid client supplying user_id
    const rpc = await supabase.rpc('upsert_user_school_preference', { p_school_id: schoolId });
    if (rpc.error) {
      // Fallback to direct upsert if RPC not deployed yet
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes?.user) {
        return { ok: false, error: userErr || new Error('Not authenticated') };
      }
      const authUserId = userRes.user.id;
      const { error } = await supabase
        .from('user_school_preferences')
        .upsert({ user_id: authUserId, school_id: schoolId }, { onConflict: 'user_id' })
        .select();
      if (error) return { ok: false, error };
    }
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function getPreferredSchool(): Promise<{ data: School | null; error: any }> {
  try {
    // Use RPC to avoid RLS 403 on direct selects
    const { data, error } = await supabase.rpc('get_user_school_preference');
    if (error) return { data: null, error };
    if (!data) return { data: null, error: null };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { data: null, error: null };
    const mapped: School = {
      id: (row as any).school_id,
      emis_number: null,
      name: (row as any).school_name,
      phase: null,
      sector: null,
      ward: null,
      township: (row as any).township ?? null,
      address_line1: (row as any).address_line1 ?? null,
      address_line2: null,
      city: (row as any).city ?? null,
      postal_code: null,
      latitude: null,
      longitude: null,
    };
    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function clearPreferredSchool(): Promise<{ ok: boolean; error: any }> {
  try {
    const { error } = await supabase.rpc('clear_user_school_preference');
    if (error) return { ok: false, error };
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}


