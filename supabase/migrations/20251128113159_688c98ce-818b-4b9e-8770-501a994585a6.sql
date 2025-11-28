-- Increase all stock_on_hand values by 50%
UPDATE stock_items 
SET stock_on_hand = ROUND(stock_on_hand * 1.5)::integer;