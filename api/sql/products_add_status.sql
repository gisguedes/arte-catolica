-- Añadir status (tipo ENUM) a products: in_review, approved, archived, cancelled
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/products_add_status.sql

DO $$ BEGIN
  CREATE TYPE entity_status_enum AS ENUM ('in_review', 'approved', 'archived', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status') THEN
    ALTER TABLE products ADD COLUMN status entity_status_enum;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status' AND udt_name != 'entity_status_enum') THEN
    ALTER TABLE products ALTER COLUMN status TYPE entity_status_enum USING status::text::entity_status_enum;
  END IF;
END $$;

UPDATE products SET status = CASE
  WHEN COALESCE(is_active, true) = true THEN 'approved'::entity_status_enum
  ELSE 'archived'::entity_status_enum
END WHERE status IS NULL;

ALTER TABLE products ALTER COLUMN status SET DEFAULT 'approved'::entity_status_enum;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;

-- Limpiar favoritos de productos cancelados
DELETE FROM user_favorites WHERE product_id IN (SELECT id FROM products WHERE status = 'cancelled');
