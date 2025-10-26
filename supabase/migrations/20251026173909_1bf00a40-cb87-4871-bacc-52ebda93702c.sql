-- Delete all orders except ORD-062850
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders WHERE order_number != 'ORD-062850'
);

DELETE FROM orders WHERE order_number != 'ORD-062850';

-- Update bale stock quantities for ORD-062850 (already paid)
UPDATE bales SET quantity_in_stock = 0 WHERE id IN (22, 23, 27, 31);