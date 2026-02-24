-- Migración: añadir alias a material_characteristics y crear tabla de traducciones.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/material_characteristics_migration.sql

-- 1) Añadir columna alias (identificador para relaciones)
ALTER TABLE material_characteristics ADD COLUMN IF NOT EXISTS alias text;

-- 2) Crear tabla de traducciones (una fila por característica e idioma)
CREATE TABLE IF NOT EXISTS material_characteristic_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_characteristic_id uuid NOT NULL REFERENCES material_characteristics(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  slug text,
  UNIQUE(material_characteristic_id, locale)
);

CREATE INDEX IF NOT EXISTS material_characteristic_translations_mc_id_idx
  ON material_characteristic_translations(material_characteristic_id);
CREATE INDEX IF NOT EXISTS material_characteristic_translations_locale_idx
  ON material_characteristic_translations(locale);

-- 3) Migrar characteristic_text existente a alias y a traducciones (locale es)
--    Genera alias desde el texto: minúsculas, sin acentos, espacios a guiones
UPDATE material_characteristics mc
SET alias = LOWER(REGEXP_REPLACE(
  TRANSLATE(TRIM(characteristic_text), 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'),
  '[^a-z0-9]+', '-', 'g'
))
WHERE characteristic_text IS NOT NULL AND characteristic_text <> ''
  AND (alias IS NULL OR alias = '');

-- Borrar guiones duplicados y al inicio/final
UPDATE material_characteristics
SET alias = TRIM(BOTH '-' FROM REGEXP_REPLACE(alias, '-+', '-', 'g'))
WHERE alias IS NOT NULL;

-- Fallback para filas sin texto: alias = char-{id}
UPDATE material_characteristics
SET alias = 'char-' || id::text
WHERE alias IS NULL OR alias = '';

INSERT INTO material_characteristic_translations (id, material_characteristic_id, locale, name, slug)
SELECT uuid_generate_v4(), mc.id, 'es', mc.characteristic_text, mc.alias
FROM material_characteristics mc
WHERE mc.characteristic_text IS NOT NULL AND TRIM(mc.characteristic_text) <> ''
  AND mc.alias IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM material_characteristic_translations mct
    WHERE mct.material_characteristic_id = mc.id AND mct.locale = 'es'
  );

-- Para filas sin traducción (ej. characteristic_text vacío): crear entrada con alias como name
INSERT INTO material_characteristic_translations (id, material_characteristic_id, locale, name, slug)
SELECT uuid_generate_v4(), mc.id, 'es', mc.alias, mc.alias
FROM material_characteristics mc
WHERE NOT EXISTS (SELECT 1 FROM material_characteristic_translations mct WHERE mct.material_characteristic_id = mc.id AND mct.locale = 'es');

-- 4) Hacer alias NOT NULL y eliminar characteristic_text
ALTER TABLE material_characteristics ALTER COLUMN alias SET NOT NULL;
ALTER TABLE material_characteristics DROP COLUMN IF EXISTS characteristic_text;

-- 5) Índice único en alias por material (alias único dentro de cada material)
CREATE UNIQUE INDEX IF NOT EXISTS material_characteristics_material_id_alias_key
  ON material_characteristics (material_id, alias);
