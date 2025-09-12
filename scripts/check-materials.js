/* Quick materials checker: reads .env.local, queries materials */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const i = line.indexOf('=');
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      if (k && v) process.env[k] = v;
    }
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log('Missing Supabase env vars');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  try {
    const { data: mats, error: matsErr } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    if (matsErr) {
      console.log('materials error:', matsErr.message);
    } else {
      console.log('materials count:', mats?.length || 0);
      console.log('materials sample:', (mats || []).slice(0, 10));
    }

    const { data: rates, error: ratesErr } = await supabase
      .from('material_rates')
      .select('material_id, rate_per_kg, points_per_kg, green_scholar_percentage, is_active')
      .order('material_id');
    if (ratesErr) {
      console.log('material_rates error:', ratesErr.message);
    } else {
      const byId = new Map((mats||[]).map(m => [m.id, m]));
      const joined = (rates||[]).map(r => ({
        material_id: r.material_id,
        name: byId.get(r.material_id)?.name || null,
        rate_per_kg: r.rate_per_kg,
        green_scholar_percentage: r.green_scholar_percentage,
        is_active: r.is_active
      }));
      console.log('material_rates count:', rates?.length || 0);
      console.log('material_rates sample:', joined.slice(0, 10));
    }
  } catch (e) {
    console.error('exception:', e.message);
  }
}

main();


