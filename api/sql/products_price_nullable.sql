-- Asegurar que products.price acepte NULL (productos sin precio hasta que se añada un contrato).
-- Ejecutar si la tabla products tiene NOT NULL en price: psql $DATABASE_URL -f api/sql/products_price_nullable.sql
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
