// Setup database using Supabase client (bypasses connection pooler issues)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables!');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupDatabase() {
    try {
        console.log('🔄 Setting up database...\n');

        // Try to select from table (will fail if doesn't exist)
        console.log('📊 Checking if table exists...');
        const { data: existingData, error: selectError } = await supabase
            .from('table_bookings')
            .select('count')
            .limit(1);

        if (selectError && selectError.code === 'PGRST205') {
            console.log('⚠️  Table not found in schema cache');
            console.log('📝 You need to create the table in Supabase SQL Editor');
            console.log('\n📋 Copy and run this SQL in Supabase Dashboard → SQL Editor:\n');
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

DROP POLICY IF EXISTS "public_insert" ON public.table_bookings;
DROP POLICY IF EXISTS "auth_all" ON public.table_bookings;

CREATE POLICY "public_insert"
ON public.table_bookings FOR INSERT
TO anon WITH CHECK (true);

CREATE POLICY "auth_all"
ON public.table_bookings FOR ALL
TO authenticated USING (true);

GRANT ALL ON public.table_bookings TO postgres;
GRANT INSERT, SELECT ON public.table_bookings TO anon;
GRANT ALL ON public.table_bookings TO authenticated;
      `);
            console.log('\n⚠️  After running the SQL:');
            console.log('1. Go to Supabase Dashboard → Settings → General');
            console.log('2. Pause Project → Wait 1 min → Resume Project');
            console.log('3. Wait 3-5 minutes for restart');
            console.log('4. Run this script again to verify\n');

        } else if (selectError) {
            console.error('❌ Error:', selectError.message);
        } else {
            console.log('✅ Table exists and is accessible!');

            // Count bookings
            const { count, error: countError } = await supabase
                .from('table_bookings')
                .select('*', { count: 'exact', head: true });

            if (!countError) {
                console.log(`📊 Current bookings: ${count || 0}`);
            }

            console.log('\n🎉 Database is ready!');
            console.log('✅ You can now test the booking form at http://localhost:3001\n');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

setupDatabase();
