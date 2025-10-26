-- Create stock_categories table (replaces MySQL categories)
CREATE TABLE IF NOT EXISTS public.stock_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stock_items table (replaces MySQL products)
CREATE TABLE IF NOT EXISTS public.stock_items (
  id SERIAL PRIMARY KEY,
  stock_category_id INTEGER REFERENCES public.stock_categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  age_range TEXT,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stock_item_images table
CREATE TABLE IF NOT EXISTS public.stock_item_images (
  id SERIAL PRIMARY KEY,
  stock_item_id INTEGER REFERENCES public.stock_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product_categories table (for bales)
CREATE TABLE IF NOT EXISTS public.product_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bales table (actual products customers buy)
CREATE TABLE IF NOT EXISTS public.bales (
  id SERIAL PRIMARY KEY,
  product_category_id INTEGER REFERENCES public.product_categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  recommended_sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bale_profit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bale_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  actual_selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bale_items table (line items in each bale)
CREATE TABLE IF NOT EXISTS public.bale_items (
  id SERIAL PRIMARY KEY,
  bale_id INTEGER REFERENCES public.bales(id) ON DELETE CASCADE,
  stock_item_id INTEGER REFERENCES public.stock_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  line_item_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.stock_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_categories
CREATE POLICY "Anyone can view stock categories"
  ON public.stock_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert stock categories"
  ON public.stock_categories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update stock categories"
  ON public.stock_categories FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete stock categories"
  ON public.stock_categories FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for stock_items
CREATE POLICY "Anyone can view active stock items"
  ON public.stock_items FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert stock items"
  ON public.stock_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update stock items"
  ON public.stock_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete stock items"
  ON public.stock_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for stock_item_images
CREATE POLICY "Anyone can view stock item images"
  ON public.stock_item_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert stock item images"
  ON public.stock_item_images FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update stock item images"
  ON public.stock_item_images FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete stock item images"
  ON public.stock_item_images FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for product_categories
CREATE POLICY "Anyone can view active product categories"
  ON public.product_categories FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert product categories"
  ON public.product_categories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product categories"
  ON public.product_categories FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product categories"
  ON public.product_categories FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for bales
CREATE POLICY "Anyone can view active bales"
  ON public.bales FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bales"
  ON public.bales FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bales"
  ON public.bales FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bales"
  ON public.bales FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for bale_items
CREATE POLICY "Anyone can view bale items"
  ON public.bale_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert bale items"
  ON public.bale_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bale items"
  ON public.bale_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bale items"
  ON public.bale_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_stock_items_category ON public.stock_items(stock_category_id);
CREATE INDEX idx_stock_item_images_item ON public.stock_item_images(stock_item_id);
CREATE INDEX idx_bales_category ON public.bales(product_category_id);
CREATE INDEX idx_bale_items_bale ON public.bale_items(bale_id);
CREATE INDEX idx_bale_items_stock_item ON public.bale_items(stock_item_id);