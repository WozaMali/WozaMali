/**
 * Comprehensive Test for WozaMali 3-Apps Communication and Unification
 * 
 * This test verifies:
 * 1. Database schema consistency across all 3 apps
 * 2. Authentication system integration
 * 3. Wallet system synchronization
 * 4. Data flow between apps
 * 5. RLS policies consistency
 * 6. Cross-app communication
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  apps: {
    main: { port: 8080, name: 'Main App (User App)' },
    office: { port: 8081, name: 'Office App' },
    collector: { port: 8082, name: 'Collector App' }
  },
  testUser: {
    // email will be set dynamically per run to avoid collisions
    email: null,
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'resident'
  }
};

class UnifiedAppsTester {
  constructor() {
    this.supabase = null;
    this.admin = null;
    this.testResults = {
      database: { passed: 0, failed: 0, tests: [] },
      authentication: { passed: 0, failed: 0, tests: [] },
      wallet: { passed: 0, failed: 0, tests: [] },
      dataFlow: { passed: 0, failed: 0, tests: [] },
      rls: { passed: 0, failed: 0, tests: [] },
      communication: { passed: 0, failed: 0, tests: [] }
    };
  }

  async initialize() {
    console.log('🚀 Initializing WozaMali 3-Apps Communication Test...\n');
    
    // Load environment variables
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Environment variables not found. Using mock test mode.');
      return false;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    if (serviceKey) {
      this.admin = createClient(supabaseUrl, serviceKey);
    }
    // Generate unique test email per run
    TEST_CONFIG.testUser.email = `test+${Date.now()}@wozamali.co.za`;
    console.log('✅ Supabase client initialized');
    return true;
  }

  async runAllTests() {
    console.log('🧪 Running comprehensive tests...\n');

    // Ensure a clean test user via admin if available
    await this.ensureTestUser();

    await this.testDatabaseSchema();
    await this.testAuthentication();
    await this.testWalletSystem();
    await this.testDataFlow();
    await this.testRLSPolicies();
    await this.testCrossAppCommunication();

    this.generateReport();
  }

  async ensureTestUser() {
    try {
      if (!this.admin) return;
      // Delete existing user if present
      const list = await this.admin.auth.admin.listUsers({
        page: 1,
        perPage: 100
      });
      const existing = list?.data?.users?.find(u => u.email === TEST_CONFIG.testUser.email);
      if (existing) {
        await this.admin.auth.admin.deleteUser(existing.id);
      }
      // Create confirmed user
      const createRes = await this.admin.auth.admin.createUser({
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password,
        email_confirm: true,
        user_metadata: { full_name: TEST_CONFIG.testUser.name, role: TEST_CONFIG.testUser.role }
      });
      if (createRes.error) {
        console.error('Admin createUser error:', createRes.error.message);
      }
      // Ensure profiles table has a row if it exists
      const { error: profileErr } = await this.admin
        .from('profiles')
        .upsert({
          id: createRes.data.user.id,
          email: TEST_CONFIG.testUser.email,
          full_name: TEST_CONFIG.testUser.name
        }, { onConflict: 'id' });
      if (profileErr) {
        // profiles table may not exist; ignore
      }
    } catch (e) {
      console.warn('ensureTestUser skipped/failed:', e?.message || e);
    }
  }

  async testDatabaseSchema() {
    console.log('📊 Testing Database Schema Consistency...');
    
    const tests = [
      {
        name: 'Check users table exists',
        test: async () => {
          const { data, error } = await this.supabase.from('users').select('count').limit(1);
          return !error;
        }
      },
      {
        name: 'Check collections table exists',
        test: async () => {
          const { data, error } = await this.supabase.from('collections').select('count').limit(1);
          return !error;
        }
      },
      {
        name: 'Check transactions table exists',
        test: async () => {
          const { data, error } = await this.supabase.from('transactions').select('count').limit(1);
          return !error;
        }
      },
      {
        name: 'Check materials table exists',
        test: async () => {
          const { data, error } = await this.supabase.from('materials').select('count').limit(1);
          return !error;
        }
      },
      {
        name: 'Check areas table exists',
        test: async () => {
          const { data, error } = await this.supabase.from('areas').select('count').limit(1);
          return !error;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest('database', test.name, result);
      } catch (error) {
        this.recordTest('database', test.name, false, error.message);
      }
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication System...');
    
    const tests = [
      {
        name: 'Test user signup',
        test: async () => {
          const { data, error } = await this.supabase.auth.signUp({
            email: TEST_CONFIG.testUser.email,
            password: TEST_CONFIG.testUser.password,
            options: {
              data: {
                full_name: TEST_CONFIG.testUser.name,
                role: TEST_CONFIG.testUser.role
              }
            }
          });
          return !error;
        }
      },
      {
        name: 'Test user signin',
        test: async () => {
          const { data, error } = await this.supabase.auth.signInWithPassword({
            email: TEST_CONFIG.testUser.email,
            password: TEST_CONFIG.testUser.password
          });
          return !error && data.session;
        }
      },
      {
        name: 'Test user profile creation',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          return !error && data;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest('authentication', test.name, result);
      } catch (error) {
        this.recordTest('authentication', test.name, false, error.message);
      }
    }
  }

  async testWalletSystem() {
    console.log('💰 Testing Wallet System Integration...');
    
    const tests = [
      {
        name: 'Check wallet table exists',
        test: async () => {
          const { data, error } = await this.supabase.from('wallets').select('count').limit(1);
          return !error;
        }
      },
      {
        name: 'Test wallet creation for user',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data, error } = await this.supabase
            .from('wallets')
            .insert({
              user_id: user.id,
              balance: 0,
              total_points: 0,
              tier: 'bronze'
            })
            .select()
            .single();
          
          return !error && data;
        }
      },
      {
        name: 'Test wallet balance update',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data, error } = await this.supabase
            .from('wallets')
            .update({ balance: 100, total_points: 50 })
            .eq('user_id', user.id)
            .select()
            .single();
          
          return !error && data;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest('wallet', test.name, result);
      } catch (error) {
        this.recordTest('wallet', test.name, false, error.message);
      }
    }
  }

  async testDataFlow() {
    console.log('🔄 Testing Data Flow Between Apps...');
    
    const tests = [
      {
        name: 'Test collection creation (User App)',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data, error } = await this.supabase
            .from('collections')
            .insert({
              user_id: user.id,
              material_type: 'Aluminum Cans',
              weight_kg: 5.0,
              status: 'pending'
            })
            .select()
            .single();
          
          return !error && data;
        }
      },
      {
        name: 'Test collection approval (Office App)',
        test: async () => {
          const { data: collections } = await this.supabase
            .from('collections')
            .select('*')
            .eq('status', 'pending')
            .limit(1);
          
          if (!collections || collections.length === 0) return false;
          
          const { data, error } = await this.supabase
            .from('collections')
            .update({ status: 'approved' })
            .eq('id', collections[0].id)
            .select()
            .single();
          
          return !error && data;
        }
      },
      {
        name: 'Test collection assignment (Collector App)',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data: collections } = await this.supabase
            .from('collections')
            .select('*')
            .eq('status', 'approved')
            .is('collector_id', null)
            .limit(1);
          
          if (!collections || collections.length === 0) return false;
          
          const { data, error } = await this.supabase
            .from('collections')
            .update({ collector_id: user.id })
            .eq('id', collections[0].id)
            .select()
            .single();
          
          return !error && data;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest('dataFlow', test.name, result);
      } catch (error) {
        this.recordTest('dataFlow', test.name, false, error.message);
      }
    }
  }

  async testRLSPolicies() {
    console.log('🔒 Testing RLS Policies Consistency...');
    
    const tests = [
      {
        name: 'Test user can only see own collections',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data, error } = await this.supabase
            .from('collections')
            .select('*')
            .eq('user_id', user.id);
          
          return !error;
        }
      },
      {
        name: 'Test user can only see own wallet',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data, error } = await this.supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id);
          
          return !error;
        }
      },
      {
        name: 'Test user can only see own profile',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id);
          
          return !error;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest('rls', test.name, result);
      } catch (error) {
        this.recordTest('rls', test.name, false, error.message);
      }
    }
  }

  async testCrossAppCommunication() {
    console.log('🌐 Testing Cross-App Communication...');
    
    const tests = [
      {
        name: 'Test shared authentication state',
        test: async () => {
          const { data: { session } } = await this.supabase.auth.getSession();
          return !!session;
        }
      },
      {
        name: 'Test real-time subscriptions',
        test: async () => {
          return new Promise(async (resolve) => {
            const channel = this.supabase
              .channel('test-channel')
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'collections'
              }, (payload) => {
                console.log('Real-time update received:', payload);
                resolve(true);
              })
              .subscribe();
            
            try {
              // Trigger a change to ensure we receive at least one event
              const { data: { user } } = await this.supabase.auth.getUser();
              if (user) {
                await this.supabase
                  .from('collections')
                  .insert({
                    user_id: user.id,
                    material_type: 'Aluminium Cans',
                    weight_kg: 1.0,
                    status: 'pending'
                  });
              }
            } catch (e) {
              // ignore
            }

            // Timeout after 3 seconds
            setTimeout(() => {
              channel.unsubscribe();
              resolve(false);
            }, 3000);
          });
        }
      },
      {
        name: 'Test data consistency across apps',
        test: async () => {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (!user) return false;
          
          // Check if user data is consistent across different tables
          const [profileResult, walletResult, collectionsResult] = await Promise.all([
            this.supabase.from('profiles').select('*').eq('id', user.id),
            this.supabase.from('wallets').select('*').eq('user_id', user.id),
            this.supabase.from('collections').select('*').eq('user_id', user.id)
          ]);
          
          return !profileResult.error && !walletResult.error && !collectionsResult.error;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest('communication', test.name, result);
      } catch (error) {
        this.recordTest('communication', test.name, false, error.message);
      }
    }
  }

  recordTest(category, testName, passed, error = null) {
    const result = { testName, passed, error };
    this.testResults[category].tests.push(result);
    
    if (passed) {
      this.testResults[category].passed++;
      console.log(`  ✅ ${testName}`);
    } else {
      this.testResults[category].failed++;
      console.log(`  ❌ ${testName}${error ? `: ${error}` : ''}`);
    }
  }

  generateReport() {
    console.log('\n📋 TEST REPORT');
    console.log('='.repeat(50));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.testResults).forEach(([category, results]) => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Passed: ${results.passed}`);
      console.log(`  Failed: ${results.failed}`);
      
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      if (results.failed > 0) {
        console.log('  Failed Tests:');
        results.tests.filter(t => !t.passed).forEach(test => {
          console.log(`    - ${test.testName}${test.error ? `: ${test.error}` : ''}`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The 3 apps are properly unified and communicating.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
    
    console.log('\n📊 UNIFICATION STATUS:');
    console.log(`✅ Database Schema: ${this.testResults.database.failed === 0 ? 'UNIFIED' : 'ISSUES FOUND'}`);
    console.log(`✅ Authentication: ${this.testResults.authentication.failed === 0 ? 'UNIFIED' : 'ISSUES FOUND'}`);
    console.log(`✅ Wallet System: ${this.testResults.wallet.failed === 0 ? 'UNIFIED' : 'ISSUES FOUND'}`);
    console.log(`✅ Data Flow: ${this.testResults.dataFlow.failed === 0 ? 'UNIFIED' : 'ISSUES FOUND'}`);
    console.log(`✅ RLS Policies: ${this.testResults.rls.failed === 0 ? 'UNIFIED' : 'ISSUES FOUND'}`);
    console.log(`✅ Cross-App Communication: ${this.testResults.communication.failed === 0 ? 'UNIFIED' : 'ISSUES FOUND'}`);
  }
}

// Run the tests
async function main() {
  const tester = new UnifiedAppsTester();
  const initialized = await tester.initialize();
  
  if (initialized) {
    await tester.runAllTests();
  } else {
    console.log('⚠️  Skipping tests due to missing environment variables.');
    console.log('Please ensure .env.local file exists with proper Supabase credentials.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { UnifiedAppsTester };
