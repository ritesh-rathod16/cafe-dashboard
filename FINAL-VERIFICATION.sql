-- ============================================
-- FINAL VERIFICATION - Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if table exists
SELECT 
  table_schema, 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'table_bookings') as column_count
FROM information_schema.tables 
WHERE table_name = 'table_bookings';

-- 2. If table doesn't exist, create it NOW
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

-- 3. Ensure RLS is enabled
ALTER TABLE public.table_bookings ENABLE ROW LEVEL SECURITY;

-- 4. Drop and recreate policies
DROP POLICY IF EXISTS "public_insert" ON public.table_bookings;
DROP POLICY IF EXISTS "auth_all" ON public.table_bookings;

CREATE POLICY "public_insert"
ON public.table_bookings FOR INSERT
TO anon WITH CHECK (true);

CREATE POLICY "auth_all"
ON public.table_bookings FOR ALL
TO authenticated USING (true);

-- 5. Grant permissions
GRANT ALL ON public.table_bookings TO postgres;
GRANT INSERT, SELECT ON public.table_bookings TO anon;
GRANT ALL ON public.table_bookings TO authenticated;

-- 6. Test direct insert
INSERT INTO public.table_bookings (
  customer_name, phone_number, guest_count,
  booking_date, booking_time, status
) VALUES (
  'Direct SQL Test',
  '0000000000',
  2,
  CURRENT_DATE + 1,
  '18:00',
  'pending'
) RETURNING *;

-- 7. Verify data
SELECT * FROM public.table_bookings ORDER BY created_at DESC LIMIT 5;

-- SUCCESS! Table is ready for direct PostgreSQL connections
