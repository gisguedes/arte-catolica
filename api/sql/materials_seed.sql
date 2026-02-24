-- Seed de materiales: lista fija con traducción español e inglés.
-- materials: alias (identificador para relaciones)
-- material_translations: una fila por material y idioma (locale), con slug y name traducidos.
-- Ejecutar después de materials_migration.sql: psql "$DATABASE_URL" -f api/sql/materials_seed.sql

-- Quitar restricción antigua de slug único global (permite mismo slug en distintos idiomas)
ALTER TABLE material_translations DROP CONSTRAINT IF EXISTS material_translations_slug_key;
DROP INDEX IF EXISTS material_translations_slug_key;

-- Índices necesarios: slug único por locale (es y en pueden tener 'metal', etc.)
CREATE UNIQUE INDEX IF NOT EXISTS materials_alias_key ON materials (alias);
CREATE UNIQUE INDEX IF NOT EXISTS material_translations_material_id_locale_key
  ON material_translations (material_id, locale);
CREATE UNIQUE INDEX IF NOT EXISTS material_translations_locale_slug_key
  ON material_translations (locale, slug);

-- Insertar materiales (alias como identificador)
INSERT INTO materials (id, alias)
SELECT uuid_generate_v4(), v.alias
FROM (VALUES
  ('madera'),
  ('piedra'),
  ('marmol'),
  ('bronce'),
  ('metal'),
  ('plata'),
  ('oro'),
  ('pan-de-oro'),
  ('lienzo'),
  ('papel'),
  ('pergamino'),
  ('vidrio'),
  ('resina'),
  ('textil'),
  ('cuero')
) AS v(alias)
ON CONFLICT (alias) DO NOTHING;

-- Traducciones español (locale = es)
INSERT INTO material_translations (id, material_id, locale, name, slug)
SELECT uuid_generate_v4(), m.id, 'es', v.name_es, v.slug_es
FROM materials m
JOIN (VALUES
  ('madera', 'Madera', 'madera'),
  ('piedra', 'Piedra', 'piedra'),
  ('marmol', 'Mármol', 'marmol'),
  ('bronce', 'Bronce', 'bronce'),
  ('metal', 'Metal', 'metal'),
  ('plata', 'Plata', 'plata'),
  ('oro', 'Oro', 'oro'),
  ('pan-de-oro', 'Pan de Oro', 'pan-de-oro'),
  ('lienzo', 'Lienzo', 'lienzo'),
  ('papel', 'Papel', 'papel'),
  ('pergamino', 'Pergamino', 'pergamino'),
  ('vidrio', 'Vidrio', 'vidrio'),
  ('resina', 'Resina', 'resina'),
  ('textil', 'Textil', 'textil'),
  ('cuero', 'Cuero', 'cuero')
) AS v(alias, name_es, slug_es) ON m.alias = v.alias
ON CONFLICT (material_id, locale) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- Traducciones inglés (locale = en)
INSERT INTO material_translations (id, material_id, locale, name, slug)
SELECT uuid_generate_v4(), m.id, 'en', v.name_en, v.slug_en
FROM materials m
JOIN (VALUES
  ('madera', 'Wood', 'wood'),
  ('piedra', 'Stone', 'stone'),
  ('marmol', 'Marble', 'marble'),
  ('bronce', 'Bronze', 'bronze'),
  ('metal', 'Metal', 'metal'),
  ('plata', 'Silver', 'silver'),
  ('oro', 'Gold', 'gold'),
  ('pan-de-oro', 'Gold Leaf', 'gold-leaf'),
  ('lienzo', 'Canvas', 'canvas'),
  ('papel', 'Paper', 'paper'),
  ('pergamino', 'Parchment', 'parchment'),
  ('vidrio', 'Glass', 'glass'),
  ('resina', 'Resin', 'resin'),
  ('textil', 'Textile', 'textile'),
  ('cuero', 'Leather', 'leather')
) AS v(alias, name_en, slug_en) ON m.alias = v.alias
ON CONFLICT (material_id, locale) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
