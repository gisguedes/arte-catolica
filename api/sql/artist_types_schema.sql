-- Esquema de tipos de artista con traducciones (alias + artist_type_translations)
-- Uso: psql "$DATABASE_URL" -f api/sql/artist_types_schema.sql
--
-- artist_types: alias (identificador interno), relación N:M con vendors vía artist_type_vendor
-- artist_type_translations: name, slug, description por locale

-- 1) Añadir alias a artist_types (si existe slug, migrar; si no, crear columna vacía)
ALTER TABLE artist_types ADD COLUMN IF NOT EXISTS alias text;

-- Copiar slug → alias si alias está vacío y existe slug
UPDATE artist_types SET alias = slug WHERE (alias IS NULL OR alias = '') AND slug IS NOT NULL AND slug <> '';

-- 2) Tabla de traducciones
CREATE TABLE IF NOT EXISTS artist_type_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_type_id uuid NOT NULL REFERENCES artist_types(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  slug text,
  description text,
  UNIQUE(artist_type_id, locale)
);

CREATE INDEX IF NOT EXISTS artist_type_translations_artist_type_id_idx ON artist_type_translations(artist_type_id);
CREATE INDEX IF NOT EXISTS artist_type_translations_locale_idx ON artist_type_translations(locale);
CREATE UNIQUE INDEX IF NOT EXISTS artist_type_translations_locale_slug_key
  ON artist_type_translations (locale, slug) WHERE slug IS NOT NULL AND slug <> '';

-- 3) Migrar datos existentes: crear traducción 'es' desde name/slug si no existe
INSERT INTO artist_type_translations (id, artist_type_id, locale, name, slug)
SELECT uuid_generate_v4(), at.id, 'es', COALESCE(at.name, at.alias, ''), COALESCE(at.slug, at.alias, '')
FROM artist_types at
WHERE NOT EXISTS (SELECT 1 FROM artist_type_translations att WHERE att.artist_type_id = at.id AND att.locale = 'es');

-- 4) Eliminar columnas obsoletas de artist_types (name y slug pasan a artist_type_translations)
ALTER TABLE artist_types DROP COLUMN IF EXISTS slug;
ALTER TABLE artist_types DROP COLUMN IF EXISTS name;
