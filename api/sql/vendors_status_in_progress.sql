-- Añadir in_progress al enum y usar como default para nuevos vendors
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendors_status_in_progress.sql
-- Requiere entity_status_enum (vendors_add_status.sql o products_add_status.sql)

DO $$ BEGIN
  ALTER TYPE entity_status_enum ADD VALUE 'in_progress';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE vendors ALTER COLUMN status SET DEFAULT 'in_progress'::entity_status_enum;

ALTER TABLE vendors DROP COLUMN IF EXISTS is_active;
