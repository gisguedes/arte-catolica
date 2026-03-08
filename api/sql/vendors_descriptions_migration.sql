-- Migración: descripción breve y descripción larga en vendors.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendors_descriptions_migration.sql
--
-- short_description: texto breve para la card de artistas/vendors.
-- description: texto largo donde el vendor detalla sobre sí mismo y su trabajo (página de detalle).

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN vendors.short_description IS 'Descripción breve del vendor (card de listado)';
COMMENT ON COLUMN vendors.description IS 'Descripción larga del vendor (página de detalle)';
