-- Migración: añadir campos para desactivación de cuenta de usuario
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/users_deactivate_migration.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

COMMENT ON COLUMN users.active IS 'false cuando el usuario se ha dado de baja';
COMMENT ON COLUMN users.deactivated_at IS 'Fecha en que el usuario se dio de baja';
