-- Migración: short_description y description de vendors en vendor_translations.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendor_translations_migration.sql
--
-- Crea tabla vendor_translations (traducción por idioma), migra datos existentes
-- a locale 'es' y elimina las columnas de vendors. (bio eliminado; solo short_description y description.)

-- 1) Crear tabla de traducciones
CREATE TABLE IF NOT EXISTS vendor_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  locale text NOT NULL,
  short_description text,
  description text,
  UNIQUE(vendor_id, locale)
);

CREATE INDEX IF NOT EXISTS vendor_translations_vendor_id_idx ON vendor_translations(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_translations_locale_idx ON vendor_translations(locale);

COMMENT ON TABLE vendor_translations IS 'Textos traducibles del vendor: short_description, description';

-- 2) Migrar datos existentes de vendors a vendor_translations (locale 'es')
--    Si la tabla ya tiene columna bio, migrarla antes a short_description o ejecutar vendor_translations_drop_bio.sql después.
INSERT INTO vendor_translations (id, vendor_id, locale, short_description, description)
SELECT uuid_generate_v4(), v.id, 'es', v.short_description, v.description
FROM vendors v
ON CONFLICT (vendor_id, locale) DO UPDATE SET
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description;

-- 3) Eliminar columnas de vendors
ALTER TABLE vendors DROP COLUMN IF EXISTS bio;
ALTER TABLE vendors DROP COLUMN IF EXISTS short_description;
ALTER TABLE vendors DROP COLUMN IF EXISTS description;
