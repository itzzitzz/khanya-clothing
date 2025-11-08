-- Create bale_metrics table to track views and add to cart actions
CREATE TABLE IF NOT EXISTS public.bale_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bale_id integer NOT NULL REFERENCES public.bales(id) ON DELETE CASCADE,
  view_count integer NOT NULL DEFAULT 0,
  add_to_cart_count integer NOT NULL DEFAULT 0,
  reset_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(bale_id)
);

-- Enable RLS
ALTER TABLE public.bale_metrics ENABLE ROW LEVEL SECURITY;

-- Anyone can view metrics
CREATE POLICY "Anyone can view bale metrics"
  ON public.bale_metrics
  FOR SELECT
  USING (true);

-- Anyone can insert metrics (for initial creation)
CREATE POLICY "Anyone can insert bale metrics"
  ON public.bale_metrics
  FOR INSERT
  WITH CHECK (true);

-- Anyone can update metrics (for incrementing counts)
CREATE POLICY "Anyone can update bale metrics"
  ON public.bale_metrics
  FOR UPDATE
  USING (true);

-- Admins can delete metrics
CREATE POLICY "Admins can delete bale metrics"
  ON public.bale_metrics
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_bale_metrics_bale_id ON public.bale_metrics(bale_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bale_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bale_metrics_updated_at_trigger
  BEFORE UPDATE ON public.bale_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_bale_metrics_updated_at();