-- Upload the logo file to the email-assets bucket
-- First, ensure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'email-assets';