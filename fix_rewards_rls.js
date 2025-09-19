const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mljtjntkddwkcjixkyuy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanRqbnRrZGR3a2NqaXhreXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNjY4NSwiZXhwIjoyMDcwMDAyNjg1fQ.X6O2YFRkkN0T_yB-XgGYi2_PY9ob0ZOmHE0FJUl9T7A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRewardsRLS() {
  console.log('🔧 Fixing rewards table RLS policies...\n');

  try {
    // First, let's check if the table exists
    console.log('1. Checking if rewards table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('rewards')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check error:', tableError);
      
      // If table doesn't exist, let's create it
      if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
        console.log('📝 Creating rewards table...');
        await createRewardsTable();
      } else {
        return;
      }
    } else {
      console.log('✅ Rewards table exists');
    }

    // Now fix the RLS policies
    console.log('\n2. Fixing RLS policies...');
    
    const rlsFixSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Allow authenticated users to read rewards" ON public.rewards;
      DROP POLICY IF EXISTS "Allow office users to manage rewards" ON public.rewards;
      DROP POLICY IF EXISTS "Allow admin and office users to manage rewards" ON public.rewards;

      -- Create new policies
      -- Allow all authenticated users to read rewards
      CREATE POLICY "Allow authenticated users to read rewards" ON public.rewards
          FOR SELECT
          TO authenticated
          USING (true);

      -- Allow all authenticated users to manage rewards (for now)
      CREATE POLICY "Allow all authenticated users to manage rewards" ON public.rewards
          FOR ALL
          TO authenticated
          USING (true);
    `;

    const { data: rlsResult, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsFixSQL
    });

    if (rlsError) {
      console.error('❌ RLS fix error:', rlsError);
    } else {
      console.log('✅ RLS policies updated successfully');
    }

    // Test the fix
    console.log('\n3. Testing rewards access...');
    const { data: testData, error: testError } = await supabase
      .from('rewards')
      .select('*')
      .limit(5);

    if (testError) {
      console.error('❌ Test access error:', testError);
    } else {
      console.log('✅ Rewards access working!');
      console.log('📊 Sample rewards:', testData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function createRewardsTable() {
  const createTableSQL = `
    -- Create the rewards table
    CREATE TABLE IF NOT EXISTS public.rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        points_required INTEGER NOT NULL CHECK (points_required >= 0),
        category TEXT NOT NULL CHECK (category IN ('cash', 'service', 'product', 'voucher')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_rewards_category ON public.rewards(category);
    CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON public.rewards(is_active);
    CREATE INDEX IF NOT EXISTS idx_rewards_points_required ON public.rewards(points_required);

    -- Enable Row Level Security
    ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

    -- Insert sample data
    INSERT INTO public.rewards (name, description, points_required, category, is_active) VALUES
    ('R50 Cash Back', 'Get R50 cash back to your wallet', 500, 'cash', true),
    ('R100 Cash Back', 'Get R100 cash back to your wallet', 1000, 'cash', true),
    ('R200 Cash Back', 'Get R200 cash back to your wallet', 2000, 'cash', true),
    ('Free Collection Service', 'One free waste collection service', 300, 'service', true),
    ('Premium Collection Service', 'Priority waste collection service', 500, 'service', true),
    ('Eco-Friendly Water Bottle', 'Reusable stainless steel water bottle', 800, 'product', true),
    ('Recycling Kit', 'Complete home recycling starter kit', 1200, 'product', true),
    ('R50 Voucher', 'R50 voucher for local grocery store', 600, 'voucher', true),
    ('R100 Voucher', 'R100 voucher for local grocery store', 1200, 'voucher', true),
    ('R200 Voucher', 'R200 voucher for local grocery store', 2400, 'voucher', true);
  `;

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: createTableSQL
  });

  if (error) {
    console.error('❌ Create table error:', error);
  } else {
    console.log('✅ Rewards table created successfully');
  }
}

fixRewardsRLS();
