-- Migración: quitar image_path de materials y description de material_translations.
-- No toca material_characteristics.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/materials_migration.sql

-- Quitar foto del material (ya no se usa)
ALTER TABLE materials DROP COLUMN IF EXISTS image_path;

-- Quitar descripción de traducciones (solo nombre por idioma)
ALTER TABLE material_translations DROP COLUMN IF EXISTS description;
