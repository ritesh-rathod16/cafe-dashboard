/**
 * Migration Script: Add customer_phone to orders table
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Starting migration: Add customer_phone to orders table...\n');

    try {
        const { data, error } = await supabase
            .from('orders')
            .select('customer_phone')
            .limit(1);

        if (error && error.message.includes('column "customer_phone" does not exist')) {
            console.error('❌ Migration needed!');
            console.error('Please run this SQL manually in Supabase SQL Editor:\n');
            console.log('----------------------------------------');
            console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;');
            console.log('----------------------------------------\n');
            process.exit(1);
        } else if (!error) {
            console.log('✅ Column customer_phone already exists!');
        }

        console.log('\n🎉 Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.log('----------------------------------------');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;');
        console.log('----------------------------------------\n');
        process.exit(1);
    }
}

runMigration();
