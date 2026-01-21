// Automated script to create the table_bookings table
// This script uses your existing DATABASE_URL from .env.local

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createTableBookings() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting database migration...\n');

        // Drop existing table if it exists
        console.log('1️⃣ Dropping existing table (if exists)...');
        await client.query('DROP TABLE IF EXISTS public.table_bookings CASCADE;');
        console.log('✅ Done\n');

        // Create the table
        console.log('2️⃣ Creating table_bookings table...');
        await client.query(`
            CREATE TABLE public.table_bookings (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_name text NOT NULL,
                phone_number text NOT NULL,
                guest_count integer NOT NULL CHECK (guest_count >= 1 AND guest_count <= 10),
                booking_date date NOT NULL,
                booking_time time NOT NULL,
                special_request text,
                status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
                created_at timestamptz DEFAULT now(),
                updated_at timestamptz DEFAULT now()
            );
        `);
        console.log('✅ Table created\n');

        // Create indexes
        console.log('3️⃣ Creating indexes...');
        await client.query('CREATE INDEX idx_table_bookings_date ON public.table_bookings(booking_date);');
        await client.query('CREATE INDEX idx_table_bookings_status ON public.table_bookings(status);');
        await client.query('CREATE INDEX idx_table_bookings_created_at ON public.table_bookings(created_at DESC);');
        console.log('✅ Indexes created\n');

        // Enable RLS
        console.log('4️⃣ Enabling Row Level Security...');
        await client.query('ALTER TABLE public.table_bookings ENABLE ROW LEVEL SECURITY;');
        console.log('✅ RLS enabled\n');

        // Drop existing policies
        console.log('5️⃣ Dropping existing policies (if any)...');
        await client.query('DROP POLICY IF EXISTS "public_insert" ON public.table_bookings;');
        await client.query('DROP POLICY IF EXISTS "auth_all" ON public.table_bookings;');
        console.log('✅ Done\n');

        // Create RLS policies
        console.log('6️⃣ Creating RLS policies...');
        await client.query(`
            CREATE POLICY "public_insert"
            ON public.table_bookings FOR INSERT
            TO anon
            WITH CHECK (true);
        `);
        await client.query(`
            CREATE POLICY "auth_all"
            ON public.table_bookings FOR ALL
            TO authenticated
            USING (true);
        `);
        console.log('✅ Policies created\n');

        // Grant permissions
        console.log('7️⃣ Granting permissions...');
        await client.query('GRANT ALL ON public.table_bookings TO postgres;');
        await client.query('GRANT INSERT, SELECT ON public.table_bookings TO anon;');
        await client.query('GRANT ALL ON public.table_bookings TO authenticated;');
        console.log('✅ Permissions granted\n');

        // Create update trigger function
        console.log('8️⃣ Creating update trigger...');
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        await client.query(`
            DROP TRIGGER IF EXISTS update_table_bookings_updated_at ON public.table_bookings;
        `);
        await client.query(`
            CREATE TRIGGER update_table_bookings_updated_at
                BEFORE UPDATE ON public.table_bookings
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('✅ Trigger created\n');

        // Insert test booking
        console.log('9️⃣ Inserting test booking...');
        const testResult = await client.query(`
            INSERT INTO public.table_bookings (
                customer_name,
                phone_number,
                guest_count,
                booking_date,
                booking_time,
                special_request,
                status
            ) VALUES (
                'Test User',
                '9999999999',
                2,
                CURRENT_DATE + 1,
                '18:00',
                'Test booking - please ignore',
                'pending'
            ) RETURNING *;
        `);
        console.log('✅ Test booking created:');
        console.log(testResult.rows[0]);
        console.log('');

        // Verify table creation
        console.log('🔍 Verifying table creation...');
        const verifyResult = await client.query(`
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'table_bookings') as column_count,
                (SELECT COUNT(*) FROM public.table_bookings) as row_count
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'table_bookings';
        `);

        if (verifyResult.rows.length > 0) {
            console.log('✅ Table verified:');
            console.log(`   - Table name: ${verifyResult.rows[0].table_name}`);
            console.log(`   - Columns: ${verifyResult.rows[0].column_count}`);
            console.log(`   - Rows: ${verifyResult.rows[0].row_count}`);
            console.log('');
            console.log('🎉 SUCCESS! The table_bookings table is ready to use!');
            console.log('');
            console.log('✨ Next steps:');
            console.log('   1. Start your dev server: npm run dev');
            console.log('   2. Navigate to http://localhost:3001');
            console.log('   3. Test the booking form');
        } else {
            console.error('❌ Table verification failed!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('');
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
createTableBookings();
