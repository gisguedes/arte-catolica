-- Asignar un color a una foto de producto. Solo una foto por color por producto.
-- Ejecutar: psql $DATABASE_URL -f api/sql/product_images_color_id.sql

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES colors(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_product_color_unique
  ON product_images (product_id, color_id)
  WHERE color_id IS NOT NULL;
