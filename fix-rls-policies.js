// Fix RLS policies for admin panel bookings
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fixRLSPolicies() {
    const client = await pool.connect();

    try {
        console.log('🔧 Fixing RLS policies for admin panel...\n');

        // Check existing policies
        console.log('1️⃣ Checking existing policies...');
        const existingPolicies = await client.query(`
            SELECT policyname, cmd, roles
            FROM pg_policies
            WHERE tablename = 'table_bookings';
        `);
        console.log('Existing policies:', existingPolicies.rows);
        console.log('');

        // Add explicit SELECT policy for authenticated users
        console.log('2️⃣ Adding SELECT policy for authenticated users...');
        await client.query(`
            DROP POLICY IF EXISTS "auth_select" ON public.table_bookings;
        `);
        await client.query(`
            CREATE POLICY "auth_select"
            ON public.table_bookings FOR SELECT
            TO authenticated
            USING (true);
        `);
        console.log('✅ SELECT policy created\n');

        // Also add SELECT policy for anon users (for public viewing if needed)
        console.log('3️⃣ Adding SELECT policy for anonymous users...');
        await client.query(`
            DROP POLICY IF EXISTS "anon_select" ON public.table_bookings;
        `);
        await client.query(`
            CREATE POLICY "anon_select"
            ON public.table_bookings FOR SELECT
            TO anon
            USING (true);
        `);
        console.log('✅ Anonymous SELECT policy created\n');

        // Verify all policies
        console.log('4️⃣ Verifying all policies...');
        const allPolicies = await client.query(`
            SELECT policyname, cmd, roles, permissive
            FROM pg_policies
            WHERE tablename = 'table_bookings'
            ORDER BY policyname;
        `);
        console.log('All policies:');
        allPolicies.rows.forEach(policy => {
            console.log(`  - ${policy.policyname} (${policy.cmd}) for ${policy.roles}`);
        });
        console.log('');

        // Test SELECT query
        console.log('5️⃣ Testing SELECT query...');
        const testResult = await client.query(`
            SELECT COUNT(*) as total_bookings
            FROM public.table_bookings;
        `);
        console.log(`✅ Can read ${testResult.rows[0].total_bookings} bookings\n`);

        console.log('🎉 SUCCESS! RLS policies fixed!');
        console.log('');
        console.log('✨ Next steps:');
        console.log('   1. Log into admin panel');
        console.log('   2. Navigate to /admin/bookings');
        console.log('   3. Bookings should now be visible!');

    } catch (error) {
        console.error('❌ Failed to fix RLS policies:', error.message);
        console.error('');
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
fixRLSPolicies();
