/**
 * Quick Test: Verify customer_phone field is working
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCustomerPhone() {
    console.log('🧪 Testing customer_phone field...\n');

    // Test 1: Check if column exists
    console.log('1️⃣ Checking if customer_phone column exists...');
    const { data: columns, error: colError } = await supabase
        .from('orders')
        .select('customer_phone')
        .limit(1);

    if (colError) {
        console.error('❌ Column does not exist!', colError.message);
        console.log('\n📝 Run this SQL in Supabase:');
        console.log('ALTER TABLE orders ADD COLUMN customer_phone TEXT;');
        return;
    }
    console.log('✅ Column exists!\n');

    // Test 2: Check recent orders
    console.log('2️⃣ Checking recent orders...');
    const { data: orders } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, table_number, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (orders && orders.length > 0) {
        console.log('Recent orders:');
        orders.forEach((order, i) => {
            console.log(`  ${i + 1}. Table ${order.table_number}`);
            console.log(`     Name: ${order.customer_name || 'N/A'}`);
            console.log(`     Phone: ${order.customer_phone || 'N/A'}`);
            console.log(`     Created: ${new Date(order.created_at).toLocaleString()}`);
            console.log('');
        });
    } else {
        console.log('  No orders found');
    }

    console.log('\n✅ Database is ready!');
    console.log('\n📋 Next Steps:');
    console.log('1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('2. Navigate to Tables page');
    console.log('3. Click on a table');
    console.log('4. You should see both Customer Name and Customer Phone fields');
    console.log('5. Create a test order with phone number');
    console.log('6. Check All Orders page to see the phone displayed');
}

testCustomerPhone();
