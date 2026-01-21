// Setup database check with environment variables
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking environment variables...');
console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Service Role Key:', serviceRoleKey ? '✅ Found' : '❌ Missing');
console.log('');

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkDatabase() {
    try {
        console.log('🔄 Checking database status...\n');

        const { data, error } = await supabase
            .from('table_bookings')
            .select('count')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST205') {
                console.log('❌ TABLE NOT FOUND - Schema cache issue detected');
                console.log('');
                console.log('📋 SOLUTION: Run this SQL in Supabase Dashboard:');
                console.log('─'.repeat(60));
                console.log(`
CREATE TABLE IF NOT EXISTS public.table_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  guest_count integer NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  special_request text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.table_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert" ON public.table_bookings
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_all" ON public.table_bookings
FOR ALL TO authenticated USING (true);
        `);
                console.log('─'.repeat(60));
                console.log('\n⚠️  THEN: Restart Supabase project (Pause → Resume)');
                console.log('⏱️  Wait 3-5 minutes after restart');
                console.log('🔄 Run this script again to verify\n');
            } else {
                console.error('❌ Error:', error.message);
            }
        } else {
            console.log('✅ TABLE EXISTS AND IS ACCESSIBLE!');

            const { count } = await supabase
                .from('table_bookings')
                .select('*', { count: 'exact', head: true });

            console.log(`📊 Current bookings: ${count || 0}`);
            console.log('');
            console.log('🎉 EVERYTHING IS READY!');
            console.log('✅ Test booking form: http://localhost:3001');
            console.log('✅ Admin panel: http://localhost:3001/admin/bookings\n');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

checkDatabase();
