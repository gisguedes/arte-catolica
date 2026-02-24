-- Índice para upsert por (material_id, locale) en PATCH/POST de /api/materials.
-- Nota: image_path y description se eliminaron (ver materials_migration.sql).
-- characteristics pasó a material_characteristics (ver material_characteristics_table.sql).
CREATE UNIQUE INDEX IF NOT EXISTS material_translations_material_id_locale_key
  ON material_translations (material_id, locale);
