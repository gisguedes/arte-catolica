-- Migración: añadir phone a vendor_addresses (por si la tabla ya existía sin phone).
-- Ejecutar: psql "$DATABASE_URL" -f api/sql/vendor_addresses_add_phone.sql
--
-- Teléfono para cada dirección del vendor (admin, logistica, comercial).

ALTER TABLE vendor_addresses ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN vendor_addresses.phone IS 'Teléfono de contacto en esta dirección del vendor';
