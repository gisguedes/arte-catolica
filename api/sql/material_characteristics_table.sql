-- Características del material: alias (identificador), traducciones por locale.
-- material_characteristics: material_id, alias, sort_order
-- material_characteristic_translations: name, slug por locale
-- Para DB existentes usar: material_characteristics_migration.sql

CREATE TABLE IF NOT EXISTS material_characteristics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  alias text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(material_id, alias)
);

CREATE INDEX IF NOT EXISTS material_characteristics_material_id_idx
  ON material_characteristics(material_id);

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
