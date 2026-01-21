-- Add biller_name column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS biller_name TEXT;
