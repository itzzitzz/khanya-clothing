-- Create order status history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all status history"
  ON public.order_status_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert status history"
  ON public.order_status_history
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view status history for public tracking"
  ON public.order_status_history
  FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON public.order_status_history(changed_at);

-- Insert initial status history for existing orders
INSERT INTO public.order_status_history (order_id, status, changed_at)
SELECT id, order_status, created_at
FROM public.orders
ON CONFLICT DO NOTHING;