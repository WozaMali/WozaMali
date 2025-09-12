// Usage: node scripts/check-superadmin.js [email]
// Reads .env.local from project root to get Supabase URL/keys.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseDotEnv(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

async function main() {
  const email = process.argv[2] || 'superadmin@wozamali.co.za';
  const root = process.cwd();
  const envPath = path.join(root, '.env.local');
  const env = parseDotEnv(envPath);

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY; // optional

  if (!url || !anon) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }

  const client = createClient(url, anon);

  console.log(`Checking public.users for ${email} ...`);
  const { data: userRow, error: userErr } = await client
    .from('users')
    .select('id, email, role_id')
    .eq('email', email)
    .maybeSingle();

  if (userErr) {
    console.error('Error reading public.users:', userErr);
  } else if (!userRow) {
    console.log('public.users: NOT FOUND');
  } else {
    let roleName = null;
    if (userRow.role_id) {
      const { data: roleRow, error: roleErr } = await client
        .from('roles')
        .select('id, name')
        .eq('id', userRow.role_id)
        .maybeSingle();
      if (roleErr) {
        console.error('Error reading roles:', roleErr);
      } else {
        roleName = roleRow?.name || null;
      }
    }
    console.log('public.users: FOUND', { id: userRow.id, role_id: userRow.role_id, role_name: roleName });
  }

  if (service) {
    console.log('Service role key detected; checking auth.users ...');
    const adminClient = createClient(url, service);
    // list all users and find by email (simple dev approach)
    let page = 1;
    let found = null;
    while (!found) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        console.error('Admin listUsers error:', error);
        break;
      }
      found = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      if (found || data.users.length < 1000) break;
      page += 1;
    }
    if (found) {
      console.log('auth.users: FOUND', { id: found.id, email: found.email });
    } else {
      console.log('auth.users: NOT FOUND');
    }
  } else {
    console.log('No SUPABASE_SERVICE_ROLE_KEY in .env.local; skipping auth.users check.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


