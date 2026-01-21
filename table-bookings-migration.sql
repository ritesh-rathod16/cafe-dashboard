-- ============================================
-- TABLE BOOKINGS SYSTEM - DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create table_bookings table
CREATE TABLE IF NOT EXISTS table_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  guest_count integer NOT NULL CHECK (guest_count > 0 AND guest_count <= 10),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  special_request text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON table_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON table_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON table_bookings(phone_number);

-- 3. Enable RLS
ALTER TABLE table_bookings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Allow public to insert bookings" ON table_bookings;
CREATE POLICY "Allow public to insert bookings"
ON table_bookings FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read bookings" ON table_bookings;
CREATE POLICY "Allow authenticated users to read bookings"
ON table_bookings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update bookings" ON table_bookings;
CREATE POLICY "Allow authenticated users to update bookings"
ON table_bookings FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete bookings" ON table_bookings;
CREATE POLICY "Allow authenticated users to delete bookings"
ON table_bookings FOR DELETE
TO authenticated
USING (true);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_table_bookings_updated_at ON table_bookings;
CREATE TRIGGER update_table_bookings_updated_at
    BEFORE UPDATE ON table_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verify table creation
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'table_bookings'
ORDER BY ordinal_position;

-- 7. Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'table_bookings';
