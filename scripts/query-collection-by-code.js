// Load env
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const code = process.argv[2];
  if (!code) {
    console.error('Usage: node scripts/query-collection-by-code.js <COLLECTION_CODE>');
    process.exit(1);
  }

  try {
    const { data: col, error: colErr } = await supabase
      .from('unified_collections')
      .select('id, collection_code, customer_name, collector_name, total_weight_kg, total_value, status, created_at')
      .eq('collection_code', code)
      .single();

    if (colErr) {
      console.error('ERR_FIND_COLLECTION:', colErr.message);
      process.exit(2);
    }

    const { data: items, error: itemsErr } = await supabase
      .from('collection_materials')
      .select('material_id, quantity, unit_price, total_price')
      .eq('collection_id', col.id);

    if (itemsErr) {
      console.error('ERR_FIND_ITEMS:', itemsErr.message);
      process.exit(3);
    }

    const materialIds = [...new Set((items || []).map(i => i.material_id).filter(Boolean))];
    let idToName = {};
    if (materialIds.length) {
      const { data: mats, error: matsErr } = await supabase
        .from('materials')
        .select('id, name')
        .in('id', materialIds);
      if (!matsErr && mats) {
        mats.forEach(m => { idToName[m.id] = m.name; });
      }
    }

    const enriched = (items || []).map(i => ({
      material_id: i.material_id,
      material_name: idToName[i.material_id] || i.material_id,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      total_price: Number(i.total_price)
    }));

    console.log(JSON.stringify({ collection: col, items: enriched }, null, 2));
  } catch (e) {
    console.error('ERR:', e.message);
    process.exit(10);
  }
}

main();
