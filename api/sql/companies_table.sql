-- Tabla companies: datos fiscales / facturación por vendedor (1:1).
-- Incluye migración de datos desde vendors y eliminación de columnas duplicadas.
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/companies_table.sql

-- 1. Crear tabla companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  legal_name text,
  nif text,
  phone text,
  email text,
  street text,
  postal_code text,
  city text,
  country text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_vendor_id ON companies(vendor_id);

COMMENT ON TABLE companies IS 'Datos fiscales y de facturación del vendedor. Relación 1:1 con vendors.';
COMMENT ON COLUMN companies.legal_name IS 'Razón social';
COMMENT ON COLUMN companies.street IS 'Dirección fiscal: calle y número';

-- 2. Asegurar que legal_name existe en vendors (por si no se ejecutó vendors_add_legal_name)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS legal_name text;

-- 3. Migrar datos existentes de vendors a companies (un registro por vendor, idempotente)
INSERT INTO companies (vendor_id, legal_name, nif, phone, email, street, postal_code, city, country, created_at, updated_at)
SELECT
  v.id,
  v.legal_name,
  v.nif,
  v.phone,
  v.email,
  NULL::text,
  v.postal_code,
  v.city,
  v.country,
  NOW(),
  NOW()
FROM vendors v
WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.vendor_id = v.id);

-- 4. Eliminar de vendors las columnas que pasan a companies (facturación/privadas).
--    city, postal_code y country se mantienen en vendors para la localización pública del artista.
ALTER TABLE vendors DROP COLUMN IF EXISTS legal_name;
ALTER TABLE vendors DROP COLUMN IF EXISTS nif;
ALTER TABLE vendors DROP COLUMN IF EXISTS phone;
ALTER TABLE vendors DROP COLUMN IF EXISTS email;
