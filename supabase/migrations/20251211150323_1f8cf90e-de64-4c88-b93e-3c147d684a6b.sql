-- Remove public INSERT policy on orders table
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Remove public INSERT policy on order_items table (same security concern)
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;