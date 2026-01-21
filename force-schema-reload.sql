-- ============================================
-- FORCE SCHEMA RELOAD - Run this AFTER the migration
-- ============================================

-- Method 1: Notify PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Method 2: Verify table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'table_bookings'
) as table_exists;

-- Method 3: Show all columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'table_bookings' 
AND table_schema = 'public';

-- If the above shows the table exists but you still get PGRST205 error,
-- you need to RESTART your Supabase project:
-- 1. Go to Supabase Dashboard
-- 2. Settings → General
-- 3. Pause Project → Wait 1 minute → Resume Project
-- 4. Wait 2-3 minutes for full startup
