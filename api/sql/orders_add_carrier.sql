-- Añadir carrier y tracking a orders (opcional para datos de envío)
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/orders_add_carrier.sql

ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier_id uuid REFERENCES carrier(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
