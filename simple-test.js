// Simple test to check environment variables
console.log('Environment variables check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

// Check if .env.local exists
const fs = require('fs');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('\n.env.local content:');
  console.log(envContent);
} catch (error) {
  console.log('\n.env.local not found or not readable');
}
