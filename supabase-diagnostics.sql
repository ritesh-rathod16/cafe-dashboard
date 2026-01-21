-- ============================================
-- DIAGNOSTIC QUERIES FOR SUPABASE ISSUES
-- Run these to identify the problem
-- ============================================

-- 1. CHECK IF TABLE EXISTS
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'table_bookings'
) as table_exists;
-- Expected: true

-- 2. CHECK ALL COLUMNS
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'table_bookings'
AND table_schema = 'public'
ORDER BY ordinal_position;
-- Expected: 10 rows

-- 3. CHECK RLS STATUS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'table_bookings';
-- Expected: rowsecurity = true

-- 4. CHECK RLS POLICIES
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'table_bookings';
-- Expected: 2 policies (public_insert, auth_all)

-- 5. TEST DIRECT INSERT (as authenticated user)
INSERT INTO table_bookings (
  customer_name,
  phone_number,
  guest_count,
  booking_date,
  booking_time,
  status
) VALUES (
  'Test Booking',
  '9876543210',
  2,
  CURRENT_DATE + 1,
  '19:00',
  'pending'
) RETURNING *;
-- Expected: Should return the inserted row

-- 6. CHECK IF DATA EXISTS
SELECT COUNT(*) as total_bookings FROM table_bookings;
-- Expected: Number of bookings

-- 7. FORCE SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
-- Expected: No error

-- 8. VERIFY TABLE IN PUBLIC SCHEMA
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_name = 'table_bookings';
-- Expected: table_schema = 'public'

-- ============================================
-- If all above pass but API still fails:
-- YOU MUST RESTART YOUR SUPABASE PROJECT
-- ============================================
