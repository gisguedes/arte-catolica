-- Migración: eliminar columna bio de vendor_translations (sustituida por short_description).
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendor_translations_drop_bio.sql
--
-- Ejecutar después de vendor_translations_migration.sql si la tabla ya tiene la columna bio.

ALTER TABLE vendor_translations DROP COLUMN IF EXISTS bio;

COMMENT ON TABLE vendor_translations IS 'Textos traducibles del vendor: short_description, description';
