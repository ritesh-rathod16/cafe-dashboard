-- ============================================
-- SIMPLE TABLE CREATION - Run this first
-- ============================================

-- Drop table if exists (clean start)
DROP TABLE IF EXISTS table_bookings CASCADE;

-- Create the table
CREATE TABLE table_bookings (
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

-- Enable RLS
ALTER TABLE table_bookings ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (for customer bookings)
CREATE POLICY "Allow public insert"
ON table_bookings FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated to do everything (for admin)
CREATE POLICY "Allow authenticated all"
ON table_bookings FOR ALL
TO authenticated
USING (true);

-- Force schema reload
NOTIFY pgrst, 'reload schema';

-- Verify it worked
SELECT 'Table created successfully!' as status;
SELECT * FROM table_bookings LIMIT 1;
