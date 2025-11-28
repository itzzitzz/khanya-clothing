-- Update stock_on_hand for all stock items with random values between 14 and 170
UPDATE stock_items 
SET stock_on_hand = floor(random() * (170 - 14 + 1) + 14)::integer;