-- Add name field to stock_items table
ALTER TABLE public.stock_items 
ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed Item';

-- Remove default after adding the column
ALTER TABLE public.stock_items 
ALTER COLUMN name DROP DEFAULT;