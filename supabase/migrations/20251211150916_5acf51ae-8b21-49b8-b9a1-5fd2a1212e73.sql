-- Remove the overly permissive SELECT policy on email_verifications
-- The edge functions use service role key and will still work
DROP POLICY IF EXISTS "Anyone can read their own verifications" ON public.email_verifications;