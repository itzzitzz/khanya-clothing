-- Make bale_number nullable since it's being removed from the application
ALTER TABLE public.bales 
ALTER COLUMN bale_number DROP NOT NULL;