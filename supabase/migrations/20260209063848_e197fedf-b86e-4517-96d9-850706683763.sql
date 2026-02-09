-- Delete order items for Jannie Greyvensteyn's order
DELETE FROM order_items WHERE order_id = '04ad9b26-42d6-4c53-9dfd-14b4d1270acd';

-- Delete order status history
DELETE FROM order_status_history WHERE order_id = '04ad9b26-42d6-4c53-9dfd-14b4d1270acd';

-- Delete the order itself
DELETE FROM orders WHERE id = '04ad9b26-42d6-4c53-9dfd-14b4d1270acd';