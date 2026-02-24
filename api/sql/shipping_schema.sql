CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Nuevas tablas
CREATE TABLE IF NOT EXISTS carrier (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  service_level text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_shipping_policy (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  preparation_days integer DEFAULT 0,
  shipping_days text[],
  shipping_dates date[],
  hour_sales_close time DEFAULT '23:59',
  daily_ship_capacity integer,
  origin_city text,
  origin_region text,
  origin_postal_code text,
  origin_country text,
  default_carrier_id uuid REFERENCES carrier(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS vendor_shipping_policy_vendor_id_uq
  ON vendor_shipping_policy(vendor_id);

CREATE TABLE IF NOT EXISTS product_shipping_policy (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  override_vendor_policy boolean DEFAULT false,
  preparation_days integer,
  shipping_days text[],
  shipping_dates date[],
  hour_sales_close time,
  daily_ship_capacity integer,
  origin_region text,
  allowed_carrier_ids uuid[],
  extra_preparation_days integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_shipping_policy_product_id_uq
  ON product_shipping_policy(product_id);

CREATE TABLE IF NOT EXISTS shipping_zone (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_country text NOT NULL,
  destination_country text NOT NULL,
  origin_region text,
  destination_region text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS shipping_zone_unique_idx
  ON shipping_zone (origin_country, COALESCE(origin_region, ''), destination_country, COALESCE(destination_region, ''));

CREATE TABLE IF NOT EXISTS carrier_zone_transit (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id uuid NOT NULL REFERENCES carrier(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES shipping_zone(id) ON DELETE CASCADE,
  transit_days_min integer NOT NULL,
  transit_days_max integer NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS carrier_zone_transit_unique_idx
  ON carrier_zone_transit (carrier_id, zone_id);

CREATE TABLE IF NOT EXISTS shipping_capacity_date (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  ship_date date NOT NULL,
  max_capacity integer NOT NULL,
  current_booked integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipping_capacity_date_vendor_idx
  ON shipping_capacity_date(vendor_id, ship_date);

CREATE INDEX IF NOT EXISTS shipping_capacity_date_product_idx
  ON shipping_capacity_date(product_id, ship_date);

-- Cambios en tablas existentes
ALTER TABLE shipping_zone
  DROP COLUMN IF EXISTS carrier_id;

ALTER TABLE shipping_zone
  DROP COLUMN IF EXISTS transit_days_min,
  DROP COLUMN IF EXISTS transit_days_max;

ALTER TABLE vendor_shipping_policy
  ADD COLUMN IF NOT EXISTS preparation_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_days text[],
  ADD COLUMN IF NOT EXISTS shipping_dates date[],
  ADD COLUMN IF NOT EXISTS hour_sales_close time DEFAULT '23:59',
  ADD COLUMN IF NOT EXISTS daily_ship_capacity integer,
  ADD COLUMN IF NOT EXISTS origin_region text;

ALTER TABLE product_shipping_policy
  ADD COLUMN IF NOT EXISTS origin_region text;

