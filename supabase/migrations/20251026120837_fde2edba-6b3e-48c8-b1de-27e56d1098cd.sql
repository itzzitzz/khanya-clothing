-- Fix search_path for the prevent_category_deletion_with_bales function
CREATE OR REPLACE FUNCTION public.prevent_category_deletion_with_bales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bale_count integer;
BEGIN
  -- Check if any bales exist for this category
  SELECT COUNT(*)
  INTO bale_count
  FROM public.bales
  WHERE product_category_id = OLD.id;
  
  -- If bales exist, prevent deletion
  IF bale_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete category "%" because % bale(s) exist in this category. Please reassign or delete the bales first.', 
      OLD.name, bale_count;
  END IF;
  
  RETURN OLD;
END;
$$;