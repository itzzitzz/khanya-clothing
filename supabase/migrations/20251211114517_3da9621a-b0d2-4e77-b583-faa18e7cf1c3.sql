-- Add delivery_complex column to orders table for complex/company/office park name
ALTER TABLE public.orders 
ADD COLUMN delivery_complex text;