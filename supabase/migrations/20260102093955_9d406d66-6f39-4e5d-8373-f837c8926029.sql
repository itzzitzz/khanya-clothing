-- Create marketing_campaigns table
CREATE TABLE public.marketing_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

-- Create campaign_sends table to track which customers received which campaigns
CREATE TABLE public.campaign_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, customer_email)
);

-- Enable RLS on both tables
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketing_campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.marketing_campaigns
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert campaigns"
ON public.marketing_campaigns
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update campaigns"
ON public.marketing_campaigns
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campaigns"
ON public.marketing_campaigns
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for campaign_sends
CREATE POLICY "Admins can view all campaign sends"
ON public.campaign_sends
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert campaign sends"
ON public.campaign_sends
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campaign sends"
ON public.campaign_sends
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the default "Thank You" campaign
INSERT INTO public.marketing_campaigns (name, description)
VALUES ('Send thank you email', 'Thank customers for their business and encourage them to leave a Google review');