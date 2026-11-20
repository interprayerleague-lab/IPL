/**
 * Automated Login Test
 * Tests authentication flow and reports issues
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zlsijkmythaxtqrjocza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsc2lqa215dGhheHRxcmpvY3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5MDAzNDksImV4cCI6MjEwOTQ3NjM0OX0.9qraXe1cfNbhM6MEHgzosOGlomRvOt78iREgOf1sVSE';

async function testLogin() {
  console.log('=== AUTOMATED LOGIN TEST ===\n');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test credentials
  const testUsers = [
    {
      email: 'inter.prayer.league@gmail.com',
      password: '12345678Ab',
      expectedRole: 'admin'
    },
    {
      email: 'abereakinola@gmail.com',
      password: '12345678Ab',
      expectedRole: 'admin'
    },
    {
      email: 'akinolaabere@gmail.com',
      password: '01101996Ab',
      expectedRole: 'student'
    }
  ];

  for (const user of testUsers) {
    console.log(`\n--- Testing: ${user.email} ---`);
    
    try {
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

      if (error) {
        console.error('❌ LOGIN FAILED:', error.message);
        console.error('   Error code:', error.status);
        continue;
      }

      if (!data.session) {
        console.error('❌ NO SESSION CREATED');
        continue;
      }

      console.log('✅ Login successful');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      
      // Check profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, first_name, last_name, is_active')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ PROFILE FETCH FAILED:', profileError.message);
        console.error('   This means RLS policy is blocking profile access');
      } else if (!profile) {
        console.error('❌ NO PROFILE FOUND');
      } else {
        console.log('✅ Profile found');
        console.log('   Name:', profile.first_name, profile.last_name);
        console.log('   Role:', profile.role);
        console.log('   Active:', profile.is_active);
        console.log('   Expected role:', user.expectedRole);
        
        if (profile.role === user.expectedRole) {
          console.log('✅ Role matches expected');
        } else {
          console.error('❌ ROLE MISMATCH');
        }
      }

      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Signed out');

    } catch (err) {
      console.error('❌ UNEXPECTED ERROR:', err.message);
    }
  }

  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}

testLogin();
