-- ============================================
-- COMPLETE DATABASE FIX - RUN THIS ENTIRE SCRIPT
-- This will fix all Supabase database issues
-- ============================================

-- STEP 1: Clean up any existing table
DROP TABLE IF EXISTS table_bookings CASCADE;

-- STEP 2: Create table with proper schema
CREATE TABLE public.table_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  guest_count integer NOT NULL CHECK (guest_count >= 1 AND guest_count <= 10),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  special_request text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 3: Create indexes for performance
CREATE INDEX idx_table_bookings_date ON public.table_bookings(booking_date);
CREATE INDEX idx_table_bookings_status ON public.table_bookings(status);
CREATE INDEX idx_table_bookings_phone ON public.table_bookings(phone_number);
CREATE INDEX idx_table_bookings_created ON public.table_bookings(created_at DESC);

-- STEP 4: Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_table_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Attach trigger to table
DROP TRIGGER IF EXISTS set_updated_at ON public.table_bookings;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.table_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_table_bookings_updated_at();

-- STEP 6: Enable Row Level Security
ALTER TABLE public.table_bookings ENABLE ROW LEVEL SECURITY;

-- STEP 7: Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow public to insert bookings" ON public.table_bookings;
DROP POLICY IF EXISTS "Allow authenticated to read bookings" ON public.table_bookings;
DROP POLICY IF EXISTS "Allow authenticated to update bookings" ON public.table_bookings;
DROP POLICY IF EXISTS "Allow authenticated to delete bookings" ON public.table_bookings;
DROP POLICY IF EXISTS "public_insert" ON public.table_bookings;
DROP POLICY IF EXISTS "auth_all" ON public.table_bookings;

-- STEP 8: Create RLS policies for public (anonymous) users
CREATE POLICY "Enable insert for anonymous users"
ON public.table_bookings
FOR INSERT
TO anon
WITH CHECK (true);

-- STEP 9: Create RLS policies for authenticated users (admin)
CREATE POLICY "Enable all for authenticated users"
ON public.table_bookings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- STEP 10: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.table_bookings TO authenticated;
GRANT INSERT ON public.table_bookings TO anon;
GRANT SELECT ON public.table_bookings TO anon;

-- STEP 11: Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- STEP 12: Insert test data to verify
INSERT INTO public.table_bookings (
  customer_name,
  phone_number,
  guest_count,
  booking_date,
  booking_time,
  special_request,
  status
) VALUES (
  'Test Booking',
  '9999999999',
  2,
  CURRENT_DATE + 1,
  '19:00:00',
  'This is a test booking to verify the table works',
  'pending'
);

-- STEP 13: Verification queries
SELECT 'Table created successfully!' as status;

SELECT 'Columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'table_bookings'
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'RLS Status:' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'table_bookings';

SELECT 'Policies:' as info;
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'table_bookings';

SELECT 'Test Data:' as info;
SELECT * FROM public.table_bookings;

SELECT 'Total Bookings:' as info;
SELECT COUNT(*) as count FROM public.table_bookings;

-- ============================================
-- IMPORTANT: AFTER RUNNING THIS SCRIPT
-- ============================================
-- 1. Wait 30 seconds
-- 2. Go to Supabase Dashboard → Settings → General
-- 3. Click "Pause project" → Wait 1 minute
-- 4. Click "Resume project" → Wait 3-5 minutes
-- 5. Hard refresh your browser (Ctrl+Shift+R)
-- 6. Test the booking form
-- ============================================
