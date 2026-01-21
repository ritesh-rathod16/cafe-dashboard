/**
 * Migration Script: Add customer_name to orders table
 * 
 * This script adds a customer_name column to the orders table
 * Run this in your Supabase SQL Editor or using the command below
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local file
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Starting migration: Add customer_name to orders table...\n');

    try {
        // Add customer_name column
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
        COMMENT ON COLUMN orders.customer_name IS 'Optional customer name for better order tracking and searchability';
      `
        });

        if (error) {
            // If exec_sql doesn't exist, try direct SQL execution
            console.log('⚠️  exec_sql RPC not available, trying direct execution...\n');

            const { error: directError } = await supabase
                .from('orders')
                .select('customer_name')
                .limit(1);

            if (directError && directError.message.includes('column "customer_name" does not exist')) {
                console.error('❌ Migration failed!');
                console.error('Please run this SQL manually in Supabase SQL Editor:\n');
                console.log('----------------------------------------');
                console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;');
                console.log('COMMENT ON COLUMN orders.customer_name IS \'Optional customer name for better order tracking and searchability\';');
                console.log('----------------------------------------\n');
                process.exit(1);
            } else if (!directError) {
                console.log('✅ Column customer_name already exists!');
            }
        } else {
            console.log('✅ Migration completed successfully!');
        }

        // Verify the column was added
        const { data: tableInfo, error: verifyError } = await supabase
            .from('orders')
            .select('customer_name')
            .limit(1);

        if (!verifyError) {
            console.log('✅ Verified: customer_name column is available');
        }

        console.log('\n🎉 Migration complete! You can now use customer names in orders.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.log('----------------------------------------');
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;');
        console.log('----------------------------------------\n');
        process.exit(1);
    }
}

runMigration();
