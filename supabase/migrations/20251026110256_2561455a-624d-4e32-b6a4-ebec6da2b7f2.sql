-- Add quantity_in_stock and bale_number to bales table
ALTER TABLE public.bales 
ADD COLUMN quantity_in_stock integer NOT NULL DEFAULT 0,
ADD COLUMN bale_number text;

-- Create function to generate sequential bale numbers
CREATE OR REPLACE FUNCTION public.generate_bale_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  max_number integer;
  new_bale_number text;
BEGIN
  -- Get the highest existing bale number
  SELECT COALESCE(MAX(CAST(SUBSTRING(bale_number FROM 'BALE-(\d+)') AS integer)), 0)
  INTO max_number
  FROM public.bales
  WHERE bale_number IS NOT NULL;
  
  -- Generate new bale number
  new_bale_number := 'BALE-' || LPAD((max_number + 1)::text, 6, '0');
  
  RETURN new_bale_number;
END;
$$;

-- Update existing bales to have bale numbers if they don't have one
DO $$
DECLARE
  bale_record RECORD;
  counter integer := 1;
BEGIN
  FOR bale_record IN 
    SELECT id FROM public.bales WHERE bale_number IS NULL ORDER BY id
  LOOP
    UPDATE public.bales 
    SET bale_number = 'BALE-' || LPAD(counter::text, 6, '0')
    WHERE id = bale_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Make bale_number NOT NULL after populating existing records
ALTER TABLE public.bales ALTER COLUMN bale_number SET NOT NULL;