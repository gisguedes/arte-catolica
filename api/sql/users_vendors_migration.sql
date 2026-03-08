-- Migración: vendor_users y vendor_addresses. Nuevo modelo usuarios-vendors.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/users_vendors_migration.sql
--
-- 1) vendor_users: relación N:M usuario-vendor con rol (owner, admin, finanzas, logistica, comercial)
-- 2) vendor_addresses: direcciones del vendor (admin, logistica, comercial) - tabla separada
-- 3) Migrar vendors.user_id → vendor_users con role='owner'
-- 4) Migrar vendors.city, country, postal_code → vendor_addresses (alias='main')
-- 5) Eliminar vendors.user_id (city, country, postal_code se mantienen en vendors para backward compatibility
--    hasta actualizar la API a leer de vendor_addresses)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1) Tabla vendor_users (usuario-vendor con rol)
-- =============================================================================
CREATE TABLE IF NOT EXISTS vendor_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(vendor_id, user_id)
);

CREATE INDEX IF NOT EXISTS vendor_users_vendor_id_idx ON vendor_users(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_users_user_id_idx ON vendor_users(user_id);

COMMENT ON TABLE vendor_users IS 'Usuarios asignados a vendors con rol: owner, admin, finanzas, logistica, comercial';

-- Migrar datos: cada vendor con user_id → vendor_users con role=owner
INSERT INTO vendor_users (id, vendor_id, user_id, role, created_at, updated_at)
SELECT uuid_generate_v4(), v.id, v.user_id, 'owner', v.created_at, v.updated_at
FROM vendors v
WHERE v.user_id IS NOT NULL
ON CONFLICT (vendor_id, user_id) DO NOTHING;

-- Eliminar columna user_id de vendors
ALTER TABLE vendors DROP COLUMN IF EXISTS user_id;

-- =============================================================================
-- 2) Tabla vendor_addresses (direcciones del vendor por tipo)
-- =============================================================================
CREATE TABLE IF NOT EXISTS vendor_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  alias text NOT NULL,
  address_line_1 text,
  address_line_2 text,
  city text,
  postal_code text,
  country text,
  phone text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_addresses_vendor_id_idx ON vendor_addresses(vendor_id);

COMMENT ON TABLE vendor_addresses IS 'Direcciones del vendor: admin, logistica, comercial, main';

-- Migrar datos: vendors con city/country/postal_code → vendor_addresses (alias='main')
INSERT INTO vendor_addresses (id, vendor_id, alias, city, postal_code, country, created_at, updated_at)
SELECT uuid_generate_v4(), v.id, 'main', v.city, v.postal_code, v.country, v.created_at, v.updated_at
FROM vendors v
WHERE (v.city IS NOT NULL OR v.postal_code IS NOT NULL OR v.country IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM vendor_addresses va WHERE va.vendor_id = v.id AND va.alias = 'main');

-- NOTA: vendors.city, vendors.country, vendors.postal_code se mantienen para backward compatibility
-- hasta actualizar la API. En una migración futura se pueden eliminar si la API lee de vendor_addresses.
