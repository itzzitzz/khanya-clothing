-- Add phone column to email_verifications table
ALTER TABLE email_verifications 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Make email nullable since we now support phone verification too
ALTER TABLE email_verifications 
ALTER COLUMN email DROP NOT NULL;

-- Add a check constraint to ensure either email or phone is provided
ALTER TABLE email_verifications 
ADD CONSTRAINT email_or_phone_required 
CHECK (email IS NOT NULL OR phone IS NOT NULL);