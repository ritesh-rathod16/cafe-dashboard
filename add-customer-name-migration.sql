-- Add customer_name column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add comment to the column
COMMENT ON COLUMN orders.customer_name IS 'Optional customer name for better order tracking and searchability';
