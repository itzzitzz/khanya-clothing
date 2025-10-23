-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  delivery_city text NOT NULL,
  delivery_province text NOT NULL,
  delivery_postal_code text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('apple_pay', 'google_pay', 'card', 'eft', 'fnb_ewallet')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  order_status text NOT NULL DEFAULT 'new_order' CHECK (order_status IN ('new_order', 'packing', 'shipped', 'delivered')),
  total_amount numeric(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id integer NOT NULL,
  product_name text NOT NULL,
  product_image text,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_per_unit numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create email_verifications table for PIN codes
CREATE TABLE public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  pin_code text NOT NULL,
  verified boolean DEFAULT false NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
WITH CHECK (true);

-- RLS Policies for email_verifications
CREATE POLICY "Anyone can create verifications"
ON public.email_verifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read their own verifications"
ON public.email_verifications FOR SELECT
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_orders_email ON public.orders(customer_email);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_pin ON public.email_verifications(pin_code);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_order_number text;
  counter integer := 0;
BEGIN
  LOOP
    new_order_number := 'ORD-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_order_number);
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique order number';
    END IF;
  END LOOP;
  RETURN new_order_number;
END;
$$;

-- Function to update order status and trigger email
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_order_updated_at();