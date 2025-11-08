-- Fix search_path for the function created in previous migration
CREATE OR REPLACE FUNCTION update_bale_metrics_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;