-- Asegurar que image soporte base64 (strings largos)
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendors_image_text.sql
ALTER TABLE vendors ALTER COLUMN image TYPE text USING image::text;
