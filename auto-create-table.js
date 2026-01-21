// Attempt to create table using Supabase Management API
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTableViaAPI() {
    console.log('🔄 Attempting to create table via Supabase Management API...\n');

    // Extract project ref from URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    console.log('📋 Project ref:', projectRef);

    const sql = `
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

    CREATE POLICY "public_insert" ON public.table_bookings
    FOR INSERT TO anon WITH CHECK (true);

    CREATE POLICY "auth_all" ON public.table_bookings
    FOR ALL TO authenticated USING (true);

    GRANT ALL ON public.table_bookings TO postgres;
    GRANT INSERT, SELECT ON public.table_bookings TO anon;
    GRANT ALL ON public.table_bookings TO authenticated;
  `;

    try {
        // Try using the SQL endpoint directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
            console.log('✅ Table created successfully!');
            console.log('🎉 You can now test the booking form!\n');
            return true;
        } else {
            console.log('❌ API approach failed:', response.status, response.statusText);
            console.log('\n📋 You must run the SQL manually in Supabase Dashboard');
            console.log('📄 SQL is in: FINAL-VERIFICATION.sql\n');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('\n📋 MANUAL STEP REQUIRED:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Click SQL Editor');
        console.log('4. Paste SQL from FINAL-VERIFICATION.sql');
        console.log('5. Click Run\n');
        return false;
    }
}

createTableViaAPI();
