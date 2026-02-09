-- Add customer feedback column to orders table
ALTER TABLE public.orders 
ADD COLUMN customer_feedback TEXT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.orders.customer_feedback IS 'Optional customer feedback about their experience using the website and intended use of clothes';