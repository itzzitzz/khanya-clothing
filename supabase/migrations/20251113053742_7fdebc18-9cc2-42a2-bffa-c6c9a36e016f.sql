-- Add payment tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_tracking_status TEXT NOT NULL DEFAULT 'Awaiting payment',
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0;

-- Update existing orders to 'Awaiting payment' status
UPDATE public.orders 
SET payment_tracking_status = 'Awaiting payment',
    amount_paid = CASE 
      WHEN payment_status = 'paid' THEN total_amount 
      ELSE 0 
    END;

-- Add a comment to document the allowed values
COMMENT ON COLUMN public.orders.payment_tracking_status IS 'Payment status: Awaiting payment, Partially Paid, Fully Paid';
COMMENT ON COLUMN public.orders.amount_paid IS 'Amount paid so far in ZAR';