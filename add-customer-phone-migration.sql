-- Add customer_phone column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add comment to the column
COMMENT ON COLUMN orders.customer_phone IS 'Optional customer phone number for contact and order tracking';
