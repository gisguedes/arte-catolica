-- Product price contracts: historial de precios por producto con vigencia por fechas.
-- Precio vigente en fecha d = fila donde start_date <= d AND end_date >= d.
--
-- Cómo aplicar: psql $DATABASE_URL -f api/sql/product_prices.sql
-- (o desde la raíz del repo: psql $DATABASE_URL -f sql/product_prices.sql si ejecutas desde api/)

CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_prices_dates CHECK (start_date < end_date)
);

-- Si la tabla ya existía sin updated_at, añadir la columna:
ALTER TABLE product_prices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_product_prices_product_dates
  ON product_prices (product_id, start_date, end_date);

-- Backfill: un contrato por cada producto que tenga price no nulo
INSERT INTO product_prices (id, product_id, price, start_date, end_date, created_at, updated_at)
SELECT
  uuid_generate_v4(),
  p.id,
  p.price,
  COALESCE(p.created_at::date, CURRENT_DATE),
  '2999-12-31'::date,
  COALESCE(p.updated_at, p.created_at, NOW()),
  COALESCE(p.updated_at, p.created_at, NOW())
FROM products p
WHERE p.price IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_prices pp WHERE pp.product_id = p.id);

-- Hacer price en products nullable (la fuente de verdad pasa a product_prices)
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
