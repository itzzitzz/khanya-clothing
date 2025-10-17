-- Remove image_alt_text column from product_images table in MySQL
-- Note: This is a MySQL database, not PostgreSQL
-- The actual migration will be executed on the MySQL database via the edge function

-- This migration removes the image_alt_text column from the product_images table
-- SQL to be executed: ALTER TABLE product_images DROP COLUMN image_alt_text;