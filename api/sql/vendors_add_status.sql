-- Añadir status (tipo ENUM) a vendors: in_review, approved, archived, cancelled
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendors_add_status.sql
-- Requiere haber ejecutado antes products_add_status.sql (crea entity_status_enum)

DO $$ BEGIN
  CREATE TYPE entity_status_enum AS ENUM ('in_review', 'approved', 'archived', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'status') THEN
    ALTER TABLE vendors ADD COLUMN status entity_status_enum;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'status' AND udt_name != 'entity_status_enum') THEN
    ALTER TABLE vendors ALTER COLUMN status TYPE entity_status_enum USING status::text::entity_status_enum;
  END IF;
END $$;

UPDATE vendors SET status = CASE
  WHEN COALESCE(is_active, true) = true THEN 'approved'::entity_status_enum
  ELSE 'archived'::entity_status_enum
END WHERE status IS NULL;

ALTER TABLE vendors ALTER COLUMN status SET DEFAULT 'approved'::entity_status_enum;

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_status_check;

-- Limpiar favoritos de artistas cancelados
DELETE FROM user_favorite_artists WHERE vendor_id IN (SELECT id FROM vendors WHERE status = 'cancelled');
