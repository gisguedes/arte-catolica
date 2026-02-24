-- Esquema de técnicas de producto
-- Uso: psql "$DATABASE_URL" -f api/sql/techniques_schema.sql
--
-- techniques: alias (identificador interno), relación N:M con products vía product_technique
-- technique_translations: name, slug, description por locale

CREATE TABLE IF NOT EXISTS techniques (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  alias text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technique_translations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  technique_id uuid NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  slug text,
  description text,
  UNIQUE(technique_id, locale)
);

CREATE INDEX IF NOT EXISTS technique_translations_technique_id_idx ON technique_translations(technique_id);
CREATE INDEX IF NOT EXISTS technique_translations_locale_idx ON technique_translations(locale);
CREATE UNIQUE INDEX IF NOT EXISTS technique_translations_locale_slug_key
  ON technique_translations (locale, slug) WHERE slug IS NOT NULL AND slug <> '';

CREATE TABLE IF NOT EXISTS product_technique (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  technique_id uuid NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, technique_id)
);

CREATE INDEX IF NOT EXISTS product_technique_product_id_idx ON product_technique(product_id);
CREATE INDEX IF NOT EXISTS product_technique_technique_id_idx ON product_technique(technique_id);
